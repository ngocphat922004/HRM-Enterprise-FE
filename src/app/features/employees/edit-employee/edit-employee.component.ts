import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import {
    RoleKey,
    resolveUserRole,
} from '../../../core/guards/role.guard';
import { StorageService } from '../../../core/services/storage.service';
import {
    NHAN_VIEN_PHU_CAP_TRANG_THAI,
    NHAN_VIEN_TRANG_THAI,
    NhanVienTrangThai,
} from '../../../core/constants/status.constants';
import { PhongBan } from '../../departments/models/phong-ban.model';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { NhanVienPhuCap } from '../../payroll/models/nhan-vien-phu-cap.model';
import { PhuCap } from '../../payroll/models/phu-cap.model';
import { NhanVienPhuCapService } from '../../payroll/services/nhan-vien-phu-cap.service';
import { PhuCapPayload, PhuCapService } from '../../payroll/services/phu-cap.service';
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

interface AllowanceTypeForm {
    tenPC: string;
    soTien: number | null;
    moTa: string;
}

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
    isLoading = false;
    isSaving = false;
    isDeleting = false;
    isSuspending = false;
    isLoadingAllowances = false;
    allowanceLoadFailed = false;
    isSavingAllowance = false;
    deletingAllowanceId: number | null = null;
    isSavingAllowanceType = false;
    deletingAllowanceTypeId: number | null = null;
    errorMessage = '';
    allowanceErrorMessage = '';
    allowanceTypeErrorMessage = '';
    toastMessage = '';

    departments: PhongBan[] = [];
    positions: ChucVu[] = [];
    qualifications: TrinhDo[] = [];
    allowanceTypes: PhuCap[] = [];
    employeeAllowances: EditEmployeeAllowanceItem[] = [];
    allowanceTypeForm: AllowanceTypeForm = this.createEmptyAllowanceTypeForm();
    editingAllowanceTypeId: number | null = null;

    readonly tabs: EditEmployeeTab[] = [
        { id: 'personal', label: 'Thông tin cá nhân' },
        { id: 'work', label: 'Thông tin công việc' },
        { id: 'allowances', label: 'Phụ cấp' },
    ];

    get visibleTabs(): EditEmployeeTab[] {
        return this.tabs.filter((tab) => {
            if (tab.id === 'allowances') {
                return this.canViewAllowances;
            }

            return (
                this.canViewEmployees ||
                this.canEditEmployees
            );
        });
    }

    get canViewEmployees(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
            'manager',
            'director',
        );
    }

    get canEditEmployees(): boolean {
        return this.isRole(
            'admin',
            'hr',
        );
    }

    get canDeleteEmployees(): boolean {
        return this.isRole(
            'admin',
            'hr',
        );
    }

    get canViewDepartments(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
            'manager',
            'director',
        );
    }

    get canViewPositions(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
            'manager',
            'director',
        );
    }

    get canViewQualifications(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
            'manager',
            'director',
        );
    }

    get canViewAllowances(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
            'manager',
            'director',
        );
    }

    get canCreateAllowances(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
        );
    }

    get canEditAllowances(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
        );
    }

    get canDeleteAllowances(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
        );
    }

    get canManageAllowanceTypes(): boolean {
        return this.isRole(
            'admin',
            'hr',
            'accountant',
        );
    }

    /*
     * Getter tương thích với HTML hiện tại.
     * File HTML tiếp theo sẽ tách các nút theo từng quyền.
     */
    get canManageEmployeeRecord(): boolean {
        return this.canEditEmployees;
    }

    get canManageAllowances(): boolean {
        return this.canViewAllowances;
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
        const id = Number(
            this.route.snapshot.paramMap.get('id'),
        );

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            this.errorMessage =
                'Mã nhân viên không hợp lệ.';
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.employeeId = id;
        this.initializeAccess();
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
        return (
            this.isLoadingAllowances ||
            this.isSavingAllowance ||
            this.deletingAllowanceId !== null ||
            this.isAllowanceTypeBusy
        );
    }

    get isAllowanceTypeBusy(): boolean {
        return (
            this.isSavingAllowanceType ||
            this.deletingAllowanceTypeId !== null
        );
    }

    get canSaveAllowanceType(): boolean {
        if (
            !this.canManageAllowanceTypes ||
            this.isAllowanceTypeBusy ||
            this.isLoadingAllowances ||
            this.allowanceLoadFailed
        ) {
            return false;
        }

        const name = this.allowanceTypeForm.tenPC.trim();
        const description = this.allowanceTypeForm.moTa.trim();
        const amount = Number(this.allowanceTypeForm.soTien);

        if (
            !name ||
            name.length > 100 ||
            description.length > 255 ||
            !Number.isFinite(amount) ||
            amount < 0
        ) {
            return false;
        }

        const normalizedName = name.toLocaleLowerCase('vi');

        return !this.allowanceTypes.some(
            (allowance) =>
                allowance.maPC !== this.editingAllowanceTypeId &&
                allowance.tenPC.trim().toLocaleLowerCase('vi') === normalizedName,
        );
    }

    get hasNoAllowanceTypes(): boolean {
        return (
            !this.isLoadingAllowances &&
            !this.allowanceLoadFailed &&
            this.allowanceTypes.length === 0
        );
    }

    get hasAssignedAllAllowanceTypes(): boolean {
        return (
            !this.isLoadingAllowances &&
            !this.allowanceLoadFailed &&
            this.editingAllowanceId === null &&
            this.allowanceTypes.length > 0 &&
            this.availableAllowanceTypes.length === 0
        );
    }

    get canSelectAllowanceType(): boolean {
        return (
            this.canCreateAllowances &&
            !this.isAllowanceBusy &&
            !this.allowanceLoadFailed &&
            this.editingAllowanceId === null &&
            this.availableAllowanceTypes.length > 0
        );
    }

    get canSaveAllowance(): boolean {
        const maPC = this.allowanceForm.maPC;
        const isEditing = this.editingAllowanceId !== null;

        if (
            this.isAllowanceBusy ||
            this.allowanceLoadFailed ||
            !this.allowanceForm.ngayApDung ||
            maPC === null
        ) {
            return false;
        }

        if (
            isEditing
                ? !this.canEditAllowances
                : !this.canCreateAllowances
        ) {
            return false;
        }

        return this.availableAllowanceTypes.some(
            (allowance) => allowance.maPC === maPC,
        );
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

        if (
            this.canViewEmployees &&
            this.employeeId > 0
        ) {
            void this.router.navigate([
                '/employees',
                this.employeeId,
            ]);
            return;
        }

        if (this.canViewAllowances) {
            void this.router.navigate([
                '/payroll',
            ]);
            return;
        }

        void this.router.navigate([
            '/dashboard',
        ]);
    }

    retry(): void {
        if (this.isLoading || this.employeeId <= 0) {
            return;
        }

        if (
            this.canViewEmployees ||
            this.canEditEmployees
        ) {
            this.loadEmployee();
        }

        if (this.canViewAllowances) {
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
            !this.canEditEmployees ||
            !this.originalEmployee
        ) {
            return;
        }

        if (!this.validateForm()) {
            return;
        }

        const payload: UpdateNhanVienRequest = {
            maNV: this.employeeId,
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
        const editingAllowanceId =
            this.editingAllowanceId;

        const isEditing =
            editingAllowanceId !== null;

        if (
            (
                isEditing
                    ? !this.canEditAllowances
                    : !this.canCreateAllowances
            ) ||
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

        if (
            !Number.isInteger(maPC) ||
            maPC <= 0 ||
            !this.availableAllowanceTypes.some(
                (allowance) => allowance.maPC === maPC,
            )
        ) {
            this.showToast(
                'Phụ cấp đã chọn không hợp lệ hoặc không còn khả dụng. Vui lòng tải lại dữ liệu.',
            );
            return;
        }

        if (this.allowanceLoadFailed) {
            this.showToast(
                'Danh sách phụ cấp chưa tải thành công. Vui lòng thử lại trước khi lưu.',
            );
            return;
        }

        if (!this.allowanceForm.ngayApDung) {
            this.showToast('Vui lòng chọn ngày áp dụng.');
            return;
        }

        this.isSavingAllowance = true;
        this.allowanceErrorMessage = '';

        const request$ = !isEditing
            ? this.nhanVienPhuCapService.create({
                maNV: this.employeeId,
                maPC,
                ngayApDung: this.allowanceForm.ngayApDung,
                trangThai: NHAN_VIEN_PHU_CAP_TRANG_THAI.DANG_AP_DUNG,
            })
            : this.nhanVienPhuCapService.update(
                this.employeeId,
                editingAllowanceId,
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
                    const wasEditing = isEditing;
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

    retryAllowanceData(): void {
        if (
            this.isAllowanceBusy ||
            !this.canViewAllowances ||
            this.employeeId <= 0
        ) {
            return;
        }

        this.loadAllowanceData();
    }

    editAllowance(item: EditEmployeeAllowanceItem): void {
        if (!this.canEditAllowances || this.isAllowanceBusy) {
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
        if (this.isSavingAllowance) {
            return;
        }

        this.resetAllowanceForm();
    }

    deleteAllowance(item: EditEmployeeAllowanceItem): void {
        if (
            !this.canDeleteAllowances ||
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

    startCreateAllowanceType(): void {
        if (
            !this.canManageAllowanceTypes ||
            this.isAllowanceBusy
        ) {
            return;
        }

        this.allowanceTypeErrorMessage = '';
        this.editingAllowanceTypeId = null;
        this.allowanceTypeForm = this.createEmptyAllowanceTypeForm();
    }

    editAllowanceType(allowance: PhuCap): void {
        if (
            !this.canManageAllowanceTypes ||
            this.isAllowanceBusy
        ) {
            return;
        }

        this.allowanceTypeErrorMessage = '';
        this.editingAllowanceTypeId = allowance.maPC;
        this.allowanceTypeForm = {
            tenPC: allowance.tenPC,
            soTien: Number(allowance.soTien ?? 0),
            moTa: allowance.moTa ?? '',
        };
    }

    cancelAllowanceTypeEdit(): void {
        if (this.isAllowanceTypeBusy) {
            return;
        }

        this.resetAllowanceTypeForm();
    }

    saveAllowanceType(): void {
        if (
            !this.canManageAllowanceTypes ||
            this.isAllowanceTypeBusy ||
            this.isLoadingAllowances ||
            this.allowanceLoadFailed
        ) {
            return;
        }

        const name = this.allowanceTypeForm.tenPC.trim();
        const description = this.allowanceTypeForm.moTa.trim();
        const amount = Number(this.allowanceTypeForm.soTien);

        if (!name) {
            this.allowanceTypeErrorMessage = 'Vui lòng nhập tên phụ cấp.';
            this.showToast(this.allowanceTypeErrorMessage);
            return;
        }

        if (name.length > 100) {
            this.allowanceTypeErrorMessage = 'Tên phụ cấp không được vượt quá 100 ký tự.';
            this.showToast(this.allowanceTypeErrorMessage);
            return;
        }

        if (description.length > 255) {
            this.allowanceTypeErrorMessage = 'Mô tả phụ cấp không được vượt quá 255 ký tự.';
            this.showToast(this.allowanceTypeErrorMessage);
            return;
        }

        if (!Number.isFinite(amount) || amount < 0) {
            this.allowanceTypeErrorMessage = 'Số tiền phụ cấp phải là số không âm.';
            this.showToast(this.allowanceTypeErrorMessage);
            return;
        }

        const normalizedName = name.toLocaleLowerCase('vi');
        const duplicate = this.allowanceTypes.some(
            (allowance) =>
                allowance.maPC !== this.editingAllowanceTypeId &&
                allowance.tenPC.trim().toLocaleLowerCase('vi') === normalizedName,
        );

        if (duplicate) {
            this.allowanceTypeErrorMessage = 'Tên phụ cấp đã tồn tại.';
            this.showToast(this.allowanceTypeErrorMessage);
            return;
        }

        const payload: PhuCapPayload = {
            tenPC: name,
            soTien: amount,
            moTa: description || null,
        };

        const editingId = this.editingAllowanceTypeId;
        const isEditing = editingId !== null;

        this.isSavingAllowanceType = true;
        this.allowanceTypeErrorMessage = '';

        const request$ = isEditing
            ? this.phuCapService.update(editingId, payload)
            : this.phuCapService.create(payload);

        request$
            .pipe(
                finalize(() => {
                    this.isSavingAllowanceType = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (savedAllowance) => {
                    if (isEditing) {
                        this.allowanceTypes = this.allowanceTypes.map((allowance) =>
                            allowance.maPC === savedAllowance.maPC
                                ? savedAllowance
                                : allowance,
                        );

                        this.employeeAllowances = this.employeeAllowances.map((allowance) =>
                            allowance.maPC === savedAllowance.maPC
                                ? {
                                    ...allowance,
                                    tenPC: savedAllowance.tenPC,
                                    soTien: Number(savedAllowance.soTien ?? 0),
                                    moTa: savedAllowance.moTa ?? null,
                                }
                                : allowance,
                        );
                    } else {
                        this.allowanceTypes = [
                            ...this.allowanceTypes,
                            savedAllowance,
                        ];
                    }

                    this.sortAllowanceTypes();
                    this.resetAllowanceTypeForm();
                    this.showToast(
                        isEditing
                            ? 'Đã cập nhật danh mục phụ cấp.'
                            : 'Đã thêm danh mục phụ cấp.',
                    );
                },
                error: (error: unknown) => {
                    this.allowanceTypeErrorMessage = this.getErrorMessage(
                        error,
                        isEditing
                            ? 'Không thể cập nhật danh mục phụ cấp.'
                            : 'Không thể thêm danh mục phụ cấp.',
                    );
                    this.showToast(this.allowanceTypeErrorMessage);
                },
            });
    }

    deleteAllowanceType(allowance: PhuCap): void {
        if (
            !this.canManageAllowanceTypes ||
            this.isAllowanceBusy ||
            allowance.maPC <= 0
        ) {
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(`Xóa danh mục phụ cấp "${allowance.tenPC}"?`);

        if (!confirmed) {
            return;
        }

        this.deletingAllowanceTypeId = allowance.maPC;
        this.allowanceTypeErrorMessage = '';

        this.phuCapService
            .delete(allowance.maPC)
            .pipe(
                finalize(() => {
                    this.deletingAllowanceTypeId = null;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    this.allowanceTypes = this.allowanceTypes.filter(
                        (item) => item.maPC !== allowance.maPC,
                    );

                    if (this.allowanceForm.maPC === allowance.maPC) {
                        this.resetAllowanceForm();
                    }

                    if (this.editingAllowanceTypeId === allowance.maPC) {
                        this.resetAllowanceTypeForm();
                    }

                    this.showToast('Đã xóa danh mục phụ cấp.');
                },
                error: (error: unknown) => {
                    this.allowanceTypeErrorMessage = this.getErrorMessage(
                        error,
                        'Không thể xóa danh mục phụ cấp.',
                    );
                    this.showToast(this.allowanceTypeErrorMessage);
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
            !this.canDeleteEmployees ||
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
            !this.canEditEmployees ||
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
            maNV: this.employeeId,
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

    private initializeAccess(): void {
        const requestedTab =
            this.route.snapshot
                .queryParamMap
                .get('tab');

        if (
            this.isEditTab(
                requestedTab,
            ) &&
            this.visibleTabs.some(
                (tab) =>
                    tab.id ===
                    requestedTab,
            )
        ) {
            this.activeTab =
                requestedTab;
        } else {
            this.activeTab =
                this.visibleTabs[0]
                    ?.id ??
                'personal';
        }

        if (
            this.canViewEmployees ||
            this.canEditEmployees
        ) {
            this.loadEmployee();
        }

        if (
            this.canViewAllowances
        ) {
            this.loadAllowanceData();
        }

        if (
            !this.visibleTabs.length
        ) {
            this.errorMessage =
                'Bạn không có quyền truy cập thông tin nhân viên hoặc phụ cấp.';
        }

        this.changeDetectorRef
            .markForCheck();
    }

    private getCurrentRole(): RoleKey | null {
        return resolveUserRole(
            this.storageService
                .getCurrentUser(),
        );
    }

    private isRole(
        ...roles: RoleKey[]
    ): boolean {
        const currentRole =
            this.getCurrentRole();

        return (
            currentRole !==
            null &&
            roles.includes(
                currentRole,
            )
        );
    }

    private loadEmployee(): void {
        if (
            this.employeeId <= 0 ||
            (
                !this.canViewEmployees &&
                !this.canEditEmployees
            )
        ) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            employee:
                this.nhanVienService
                    .getById(
                        this.employeeId,
                    ),

            departments:
                this.canViewDepartments
                    ? this.phongBanService
                        .getAll()
                    : of<PhongBan[]>([]),

            positions:
                this.canViewPositions
                    ? this.chucVuService
                        .getAll()
                    : of<ChucVu[]>([]),

            qualifications:
                this.canViewQualifications
                    ? this.trinhDoService
                        .getAll()
                    : of<TrinhDo[]>([]),
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
            !this.canViewAllowances ||
            this.employeeId <= 0 ||
            this.isLoadingAllowances
        ) {
            return;
        }

        this.isLoadingAllowances = true;
        this.allowanceLoadFailed = false;
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
                    this.allowanceLoadFailed = false;
                    this.allowanceTypes = allowanceTypes;
                    this.sortAllowanceTypes();
                    this.allowanceTypeErrorMessage = '';
                    this.employeeAllowances = this.mapAllowances(
                        assignments.filter((item) => item.maNV === this.employeeId),
                        allowanceTypes,
                    );
                },
                error: (error: unknown) => {
                    this.allowanceLoadFailed = true;
                    this.allowanceTypes = [];
                    this.employeeAllowances = [];
                    this.allowanceForm.maPC = null;
                    this.resetAllowanceTypeForm();
                    this.allowanceTypeErrorMessage = '';
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

    private createEmptyAllowanceTypeForm(): AllowanceTypeForm {
        return {
            tenPC: '',
            soTien: 0,
            moTa: '',
        };
    }

    private resetAllowanceTypeForm(): void {
        this.editingAllowanceTypeId = null;
        this.allowanceTypeForm = this.createEmptyAllowanceTypeForm();
        this.allowanceTypeErrorMessage = '';
    }

    private sortAllowanceTypes(): void {
        this.allowanceTypes = [...this.allowanceTypes].sort((first, second) =>
            first.tenPC.localeCompare(second.tenPC, 'vi'),
        );
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
