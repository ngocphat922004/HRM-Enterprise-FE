import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { MA_QUYEN } from '../../../core/constants/role.constants';
import {
    NHAN_VIEN_PHU_CAP_TRANG_THAI,
    NHAN_VIEN_TRANG_THAI,
    NhanVienTrangThai,
} from '../../../core/constants/status.constants';
import { StorageService } from '../../../core/services/storage.service';
import { PhongBan } from '../../departments/models/phong-ban.model';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { NhanVienPhuCap } from '../../payroll/models/nhan-vien-phu-cap.model';
import { PhuCap } from '../../payroll/models/phu-cap.model';
import { NhanVienPhuCapService } from '../../payroll/services/nhan-vien-phu-cap.service';
import { PhuCapService } from '../../payroll/services/phu-cap.service';
import { ChucVu } from '../models/chuc-vu.model';
import { NhanVienChiTiet, UpdateNhanVienRequest } from '../models/nhan-vien.model';
import { TrinhDo } from '../models/trinh-do.model';
import { ChucVuService } from '../services/chuc-vu.service';
import { NhanVienService } from '../services/nhan-vien.service';
import { TrinhDoService } from '../services/trinh-do.service';
import {
    EditEmployeeAllowanceForm,
    EditEmployeeAllowanceItem,
    EditEmployeeForm,
    EditEmployeeTab,
    EmployeeEditTab,
} from './edit-employee.model';

@Component({
    selector: 'app-edit-employee',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './edit-employee.component.html',
    styleUrl: './edit-employee.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditEmployeeComponent implements OnInit, OnDestroy {
    activeTab: EmployeeEditTab = 'personal';
    employeeId = 0;
    currentRoleId = 0;
    isLoading = false;
    isSaving = false;
    isDeleting = false;
    isSuspending = false;
    isLoadingAllowances = false;
    isSavingAllowance = false;
    deletingAllowanceId: number | null = null;
    errorMessage = '';
    allowanceErrorMessage = '';
    toastMessage = '';

    departments: PhongBan[] = [];
    positions: ChucVu[] = [];
    qualifications: TrinhDo[] = [];
    allowanceTypes: PhuCap[] = [];
    employeeAllowances: EditEmployeeAllowanceItem[] = [];

    readonly tabs: EditEmployeeTab[] = [
        { id: 'personal', label: 'Thông tin cá nhân' },
        { id: 'work', label: 'Thông tin công việc' },
        { id: 'allowances', label: 'Phụ cấp' },
    ];

    get visibleTabs(): EditEmployeeTab[] {
        if (this.currentRoleId === MA_QUYEN.QUAN_TRI_VIEN) {
            return this.tabs;
        }

        if (this.currentRoleId === MA_QUYEN.NHAN_VIEN_NHAN_SU) {
            return this.tabs.filter(
                (tab) => tab.id === 'personal' || tab.id === 'work',
            );
        }

        if (this.currentRoleId === MA_QUYEN.KE_TOAN) {
            return this.tabs.filter((tab) => tab.id === 'allowances');
        }

        return [];
    }

    get canManageEmployeeRecord(): boolean {
        return (
            this.currentRoleId === MA_QUYEN.QUAN_TRI_VIEN ||
            this.currentRoleId === MA_QUYEN.NHAN_VIEN_NHAN_SU
        );
    }

    get canManageAllowances(): boolean {
        return (
            this.currentRoleId === MA_QUYEN.QUAN_TRI_VIEN ||
            this.currentRoleId === MA_QUYEN.KE_TOAN
        );
    }

    readonly allowanceStatus = NHAN_VIEN_PHU_CAP_TRANG_THAI;

    employee: EditEmployeeForm = this.createEmptyForm();
    allowanceForm: EditEmployeeAllowanceForm = this.createEmptyAllowanceForm();
    editingAllowanceId: number | null = null;

    private originalEmployee: NhanVienChiTiet | null = null;
    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly storageService: StorageService,
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly chucVuService: ChucVuService,
        private readonly trinhDoService: TrinhDoService,
        private readonly phuCapService: PhuCapService,
        private readonly nhanVienPhuCapService: NhanVienPhuCapService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        const currentUser = this.storageService.getCurrentUser();
        this.currentRoleId = Number(currentUser?.maQuyen) || 0;

        const requestedTab = this.route.snapshot.queryParamMap.get('tab');

        if (this.currentRoleId === MA_QUYEN.KE_TOAN) {
            this.activeTab = 'allowances';
        } else if (this.isEditTab(requestedTab)) {
            this.activeTab = requestedTab;
        }

        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!Number.isInteger(id) || id <= 0) {
            this.errorMessage = 'Mã nhân viên không hợp lệ.';
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.employeeId = id;
        this.loadEmployee();

        if (this.canManageAllowances) {
            this.loadAllowanceData();
        }
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get departmentName(): string {
        if (this.employee.maPB === null) {
            return 'Chưa phân phòng';
        }

        return this.departments.find((item) => item.maPB === this.employee.maPB)?.tenPB ?? 'Chưa phân phòng';
    }

    get positionName(): string {
        if (this.employee.maCV === null) {
            return 'Chưa có chức vụ';
        }

        return this.positions.find((item) => item.maCV === this.employee.maCV)?.tenCV ?? 'Chưa có chức vụ';
    }

    get qualificationName(): string {
        if (this.employee.maTD === null) {
            return 'Chưa có trình độ';
        }

        return this.qualifications.find((item) => item.maTD === this.employee.maTD)?.tenTD ?? 'Chưa có trình độ';
    }

    get availableAllowanceTypes(): PhuCap[] {
        const assignedIds = new Set(this.employeeAllowances.map((item) => item.maPC));

        return this.allowanceTypes.filter(
            (allowance) => allowance.maPC === this.editingAllowanceId || !assignedIds.has(allowance.maPC),
        );
    }

    get activeAllowanceCount(): number {
        return this.employeeAllowances.filter(
            (item) => item.trangThai === NHAN_VIEN_PHU_CAP_TRANG_THAI.DANG_AP_DUNG,
        ).length;
    }

    get activeAllowanceTotal(): number {
        return this.employeeAllowances
            .filter((item) => item.trangThai === NHAN_VIEN_PHU_CAP_TRANG_THAI.DANG_AP_DUNG)
            .reduce((total, item) => total + item.soTien, 0);
    }

    get isAllowanceBusy(): boolean {
        return this.isLoadingAllowances || this.isSavingAllowance || this.deletingAllowanceId !== null;
    }

    changeTab(tabId: EmployeeEditTab): void {
        if (
            this.isSaving ||
            this.isDeleting ||
            this.isSuspending ||
            this.isAllowanceBusy ||
            !this.visibleTabs.some((tab) => tab.id === tabId)
        ) {
            return;
        }

        this.activeTab = tabId;
    }

    cancel(): void {
        if (this.isSaving || this.isDeleting || this.isSuspending || this.isAllowanceBusy) {
            return;
        }

        if (this.currentRoleId === MA_QUYEN.KE_TOAN) {
            void this.router.navigate(['/payroll']);
            return;
        }

        void this.router.navigate(
            this.employeeId > 0
                ? ['/employees', this.employeeId]
                : ['/employees'],
        );
    }

    retry(): void {
        if (this.isLoading || this.employeeId <= 0) {
            return;
        }

        this.loadEmployee();

        if (this.canManageAllowances) {
            this.loadAllowanceData();
        }
    }

    saveChanges(): void {
        if (
            this.isLoading ||
            this.isSaving ||
            this.isDeleting ||
            this.isSuspending ||
            this.isAllowanceBusy ||
            !this.canManageEmployeeRecord ||
            !this.originalEmployee
        ) {
            return;
        }

        if (!this.validateForm()) {
            return;
        }

        const payload: UpdateNhanVienRequest = {
            hoTen: this.employee.fullName.trim(),
            gioiTinh: this.employee.gender.trim(),
            ngaySinh: this.employee.dateOfBirth,
            cccd: this.employee.identityNumber.trim() || null,
            diaChi: this.employee.permanentAddress.trim(),
            sdt: this.employee.phoneNumber.trim() || null,
            email: this.employee.personalEmail.trim() || null,
            ngayVaoLam: this.employee.joinDate,
            hinhAnh: this.employee.avatarPreview.trim() || null,
            maPB: this.employee.maPB,
            maCV: this.employee.maCV,
            maTD: this.employee.maTD,
            trangThai: this.originalEmployee.trangThai,
        };

        this.isSaving = true;
        this.errorMessage = '';

        this.nhanVienService
            .update(this.employeeId, payload)
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (updatedEmployee) => {
                    this.originalEmployee = {
                        ...this.originalEmployee!,
                        ...updatedEmployee,
                        tenPB: this.departmentName === 'Chưa phân phòng' ? null : this.departmentName,
                        tenCV: this.positionName === 'Chưa có chức vụ' ? null : this.positionName,
                        tenTD: this.qualificationName === 'Chưa có trình độ' ? null : this.qualificationName,
                    };
                    this.employee = this.mapEmployeeToForm(this.originalEmployee);
                    this.showToast('Đã cập nhật thông tin nhân viên.');
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error, 'Không thể cập nhật nhân viên.');
                    this.showToast(this.errorMessage);
                },
            });
    }

    saveAllowance(): void {
        if (
            !this.canManageAllowances ||
            this.isAllowanceBusy ||
            this.employeeId <= 0
        ) {
            return;
        }

        const maPC = this.allowanceForm.maPC;
        if (maPC === null) {
            this.showToast('Vui lòng chọn phụ cấp.');
            return;
        }

        if (!this.allowanceForm.ngayApDung) {
            this.showToast('Vui lòng chọn ngày áp dụng.');
            return;
        }

        this.isSavingAllowance = true;
        this.allowanceErrorMessage = '';

        const request$ = this.editingAllowanceId === null
            ? this.nhanVienPhuCapService.create({
                maNV: this.employeeId,
                maPC,
                ngayApDung: this.allowanceForm.ngayApDung,
                trangThai: NHAN_VIEN_PHU_CAP_TRANG_THAI.DANG_AP_DUNG,
            })
            : this.nhanVienPhuCapService.update(
                this.employeeId,
                this.editingAllowanceId,
                {
                    ngayApDung: this.allowanceForm.ngayApDung,
                    trangThai: this.allowanceForm.trangThai,
                },
            );

        request$
            .pipe(
                finalize(() => {
                    this.isSavingAllowance = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    const wasEditing = this.editingAllowanceId !== null;
                    this.resetAllowanceForm();
                    this.showToast(wasEditing ? 'Đã cập nhật phụ cấp.' : 'Đã gán phụ cấp cho nhân viên.');
                    this.loadAllowanceData();
                },
                error: (error: unknown) => {
                    this.allowanceErrorMessage = this.getErrorMessage(
                        error,
                        this.editingAllowanceId === null
                            ? 'Không thể gán phụ cấp cho nhân viên.'
                            : 'Không thể cập nhật phụ cấp.',
                    );
                    this.showToast(this.allowanceErrorMessage);
                },
            });
    }

    editAllowance(item: EditEmployeeAllowanceItem): void {
        if (!this.canManageAllowances || this.isAllowanceBusy) {
            return;
        }

        this.editingAllowanceId = item.maPC;
        this.allowanceForm = {
            maPC: item.maPC,
            ngayApDung: this.normalizeDate(item.ngayApDung),
            trangThai: item.trangThai,
        };
    }

    cancelAllowanceEdit(): void {
        if (!this.canManageAllowances || this.isSavingAllowance) {
            return;
        }

        this.resetAllowanceForm();
    }

    deleteAllowance(item: EditEmployeeAllowanceItem): void {
        if (
            !this.canManageAllowances ||
            this.isAllowanceBusy ||
            this.employeeId <= 0
        ) {
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(`Xóa phụ cấp "${item.tenPC}" khỏi nhân viên này?`);

        if (!confirmed) {
            return;
        }

        this.deletingAllowanceId = item.maPC;
        this.allowanceErrorMessage = '';

        this.nhanVienPhuCapService
            .delete(this.employeeId, item.maPC)
            .pipe(
                finalize(() => {
                    this.deletingAllowanceId = null;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    if (this.editingAllowanceId === item.maPC) {
                        this.resetAllowanceForm();
                    }
                    this.showToast('Đã xóa phụ cấp khỏi nhân viên.');
                    this.loadAllowanceData();
                },
                error: (error: unknown) => {
                    this.allowanceErrorMessage = this.getErrorMessage(error, 'Không thể xóa phụ cấp.');
                    this.showToast(this.allowanceErrorMessage);
                },
            });
    }

    sendEmail(): void {
        const email = this.employee.personalEmail.trim();
        if (!email) {
            this.showToast('Nhân viên chưa có email.');
            return;
        }

        if (typeof window !== 'undefined') {
            window.location.href = `mailto:${email}`;
        }
    }

    callEmployee(): void {
        const phone = this.employee.phoneNumber.trim();
        if (!phone) {
            this.showToast('Nhân viên chưa có số điện thoại.');
            return;
        }

        if (typeof window !== 'undefined') {
            window.location.href = `tel:${phone}`;
        }
    }

    deleteEmployee(): void {
        if (
            this.isLoading ||
            this.isSaving ||
            this.isDeleting ||
            this.isSuspending ||
            this.isAllowanceBusy ||
            !this.canManageEmployeeRecord ||
            this.employeeId <= 0
        ) {
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(`Bạn có chắc muốn xóa nhân viên "${this.employee.fullName}"?`);

        if (!confirmed) {
            return;
        }

        this.isDeleting = true;
        this.errorMessage = '';

        this.nhanVienService
            .delete(this.employeeId)
            .pipe(
                finalize(() => {
                    this.isDeleting = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => void this.router.navigate(['/employees']),
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error, 'Không thể xóa nhân viên.');
                    this.showToast(this.errorMessage);
                },
            });
    }

    suspendEmployee(): void {
        if (
            this.isLoading ||
            this.isSaving ||
            this.isDeleting ||
            this.isSuspending ||
            this.isAllowanceBusy ||
            !this.canManageEmployeeRecord ||
            !this.originalEmployee ||
            this.originalEmployee.trangThai === NHAN_VIEN_TRANG_THAI.TAM_NGHI
        ) {
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(`Chuyển "${this.employee.fullName}" sang trạng thái Tạm nghỉ?`);

        if (!confirmed) {
            return;
        }

        const payload: UpdateNhanVienRequest = {
            hoTen: this.employee.fullName.trim(),
            gioiTinh: this.employee.gender.trim(),
            ngaySinh: this.employee.dateOfBirth,
            cccd: this.employee.identityNumber.trim() || null,
            diaChi: this.employee.permanentAddress.trim(),
            sdt: this.employee.phoneNumber.trim() || null,
            email: this.employee.personalEmail.trim() || null,
            ngayVaoLam: this.employee.joinDate,
            hinhAnh: this.employee.avatarPreview.trim() || null,
            maPB: this.employee.maPB,
            maCV: this.employee.maCV,
            maTD: this.employee.maTD,
            trangThai: NHAN_VIEN_TRANG_THAI.TAM_NGHI,
        };

        this.isSuspending = true;
        this.errorMessage = '';

        this.nhanVienService
            .update(this.employeeId, payload)
            .pipe(
                finalize(() => {
                    this.isSuspending = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (updatedEmployee) => {
                    this.originalEmployee = {
                        ...this.originalEmployee!,
                        ...updatedEmployee,
                        trangThai: NHAN_VIEN_TRANG_THAI.TAM_NGHI,
                    };
                    this.employee = { ...this.employee, status: 'on-leave' };
                    this.showToast('Đã chuyển nhân viên sang trạng thái Tạm nghỉ.');
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error, 'Không thể cập nhật trạng thái nhân viên.');
                    this.showToast(this.errorMessage);
                },
            });
    }

    private loadEmployee(): void {
        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            employee: this.nhanVienService.getById(this.employeeId),
            departments: this.phongBanService.getAll(),
            positions: this.chucVuService.getAll(),
            qualifications: this.trinhDoService.getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ employee, departments, positions, qualifications }) => {
                    this.departments = departments;
                    this.positions = positions;
                    this.qualifications = qualifications;
                    this.originalEmployee = { ...employee };
                    this.employee = this.mapEmployeeToForm(employee);
                },
                error: (error: unknown) => {
                    this.originalEmployee = null;
                    this.errorMessage = this.getErrorMessage(error, 'Không thể tải thông tin nhân viên.');
                },
            });
    }

    private loadAllowanceData(): void {
        if (
            !this.canManageAllowances ||
            this.employeeId <= 0 ||
            this.isLoadingAllowances
        ) {
            return;
        }

        this.isLoadingAllowances = true;
        this.allowanceErrorMessage = '';

        forkJoin({
            allowanceTypes: this.phuCapService.getAll(),
            assignments: this.nhanVienPhuCapService.getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoadingAllowances = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ allowanceTypes, assignments }) => {
                    this.allowanceTypes = allowanceTypes;
                    this.employeeAllowances = this.mapAllowances(
                        assignments.filter((item) => item.maNV === this.employeeId),
                        allowanceTypes,
                    );
                },
                error: (error: unknown) => {
                    this.allowanceTypes = [];
                    this.employeeAllowances = [];
                    this.allowanceErrorMessage = this.getErrorMessage(
                        error,
                        'Không thể tải phụ cấp của nhân viên.',
                    );
                },
            });
    }

    private mapAllowances(assignments: NhanVienPhuCap[], allowanceTypes: PhuCap[]): EditEmployeeAllowanceItem[] {
        const typeMap = new Map(allowanceTypes.map((item) => [item.maPC, item]));

        return [...assignments]
            .sort((first, second) => {
                const dateComparison = this.getDateTime(second.ngayApDung) - this.getDateTime(first.ngayApDung);
                return dateComparison !== 0 ? dateComparison : second.maPC - first.maPC;
            })
            .map((assignment) => {
                const allowance = typeMap.get(assignment.maPC);
                return {
                    maPC: assignment.maPC,
                    tenPC: allowance?.tenPC ?? `Phụ cấp ${assignment.maPC}`,
                    soTien: Number(allowance?.soTien ?? 0),
                    moTa: allowance?.moTa ?? null,
                    ngayApDung: assignment.ngayApDung,
                    trangThai: assignment.trangThai,
                };
            });
    }

    private validateForm(): boolean {
        const fullName =
            this.employee.fullName.trim();

        const identityNumber =
            this.employee.identityNumber.trim();

        const address =
            this.employee.permanentAddress.trim();

        const phone =
            this.employee.phoneNumber.trim();

        const email =
            this.employee.personalEmail.trim();

        if (!fullName) {
            this.showToast(
                'Vui lòng nhập họ và tên.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (!this.employee.dateOfBirth) {
            this.showToast(
                'Vui lòng chọn ngày sinh.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (!this.employee.gender.trim()) {
            this.showToast(
                'Vui lòng chọn giới tính.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (!address) {
            this.showToast(
                'Vui lòng nhập địa chỉ.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (
            identityNumber &&
            identityNumber.length > 20
        ) {
            this.showToast(
                'CCCD không được vượt quá 20 ký tự.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (
            phone &&
            phone.length > 15
        ) {
            this.showToast(
                'Số điện thoại không được vượt quá 15 ký tự.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (email.length > 100) {
            this.showToast(
                'Email không được vượt quá 100 ký tự.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            this.showToast(
                'Email không đúng định dạng.',
            );
            this.activeTab = 'personal';
            return false;
        }

        if (!this.employee.joinDate) {
            this.showToast(
                'Vui lòng chọn ngày vào làm.',
            );
            this.activeTab = 'work';
            return false;
        }

        return true;
    }

    private mapEmployeeToForm(employee: NhanVienChiTiet): EditEmployeeForm {
        return {
            id: employee.maNV,
            employeeCode: `NV-${String(employee.maNV).padStart(4, '0')}`,
            fullName: employee.hoTen,
            status: this.mapStatus(employee.trangThai),
            dateOfBirth: this.normalizeDate(employee.ngaySinh),
            gender: employee.gioiTinh,
            identityNumber: employee.cccd ?? '',
            permanentAddress: employee.diaChi ?? '',
            personalEmail: employee.email ?? '',
            phoneNumber: employee.sdt ?? '',
            avatarPreview: employee.hinhAnh ?? '',
            maPB: employee.maPB,
            maCV: employee.maCV,
            maTD: employee.maTD,
            joinDate: this.normalizeDate(employee.ngayVaoLam),
        };
    }

    private createEmptyForm(): EditEmployeeForm {
        return {
            id: 0,
            employeeCode: '',
            fullName: '',
            status: 'working',
            dateOfBirth: '',
            gender: 'Nam',
            identityNumber: '',
            permanentAddress: '',
            personalEmail: '',
            phoneNumber: '',
            avatarPreview: '',
            maPB: null,
            maCV: null,
            maTD: null,
            joinDate: '',
        };
    }

    private createEmptyAllowanceForm(): EditEmployeeAllowanceForm {
        return {
            maPC: null,
            ngayApDung: this.getToday(),
            trangThai: NHAN_VIEN_PHU_CAP_TRANG_THAI.DANG_AP_DUNG,
        };
    }

    private resetAllowanceForm(): void {
        this.editingAllowanceId = null;
        this.allowanceForm = this.createEmptyAllowanceForm();
    }

    private mapStatus(status: NhanVienTrangThai): EditEmployeeForm['status'] {
        if (status === NHAN_VIEN_TRANG_THAI.TAM_NGHI) {
            return 'on-leave';
        }

        if (status === NHAN_VIEN_TRANG_THAI.DA_NGHI_VIEC) {
            return 'resigned';
        }

        return 'working';
    }

    private normalizeDate(value: string): string {
        return value ? value.slice(0, 10) : '';
    }

    private getToday(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private getDateTime(value: string): number {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }

    private isEditTab(value: string | null): value is EmployeeEditTab {
        return value !== null && this.visibleTabs.some((tab) => tab.id === value);
    }

    private getErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
            if (message) {
                return message;
            }

            if (error.status === 0) {
                return 'Không thể kết nối đến hệ thống.';
            }

            if (error.status === 400) {
                return 'Thông tin chưa hợp lệ.';
            }

            if (error.status === 401) {
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
            }

            if (error.status === 403) {
                return 'Bạn không có quyền thực hiện thao tác này.';
            }

            if (error.status === 404) {
                return 'Không tìm thấy dữ liệu cần thiết.';
            }

            if (error.status === 409) {
                return 'Không thể thực hiện do dữ liệu đang được sử dụng hoặc bị trùng.';
            }
        }

        if (error instanceof Error && error.message) {
            return error.message;
        }

        return fallback;
    }

    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        this.toastTimer = setTimeout(() => {
            this.toastMessage = '';
            this.toastTimer = null;
            this.changeDetectorRef.markForCheck();
        }, 3000);
    }
}
