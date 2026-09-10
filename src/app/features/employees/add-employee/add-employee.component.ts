import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { NHAN_VIEN_TRANG_THAI, TAI_KHOAN_TRANG_THAI } from '../../../core/constants/status.constants';
import { PhongBan } from '../../departments/models/phong-ban.model';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { PhuCap } from '../../payroll/models/phu-cap.model';
import { NhanVienPhuCapService } from '../../payroll/services/nhan-vien-phu-cap.service';
import { PhuCapService } from '../../payroll/services/phu-cap.service';
import { Quyen } from '../../accounts/models/quyen.model';
import { QuyenService } from '../../accounts/services/quyen.service';
import { TaiKhoanService } from '../../accounts/services/tai-khoan.service';
import { ChucVu } from '../models/chuc-vu.model';
import { CreateNhanVienRequest } from '../models/nhan-vien.model';
import { TrinhDo } from '../models/trinh-do.model';
import { ChucVuService } from '../services/chuc-vu.service';
import { NhanVienService } from '../services/nhan-vien.service';
import { TrinhDoService } from '../services/trinh-do.service';
import {
    AccountInformationForm,
    FormTab,
    Gender,
    PersonalInformationForm,
    SalaryInformationForm,
    WorkInformationForm,
} from './add-employee.model';

interface EmployeeSetupResult {
    employeeId: number;
    failedAllowanceIds: number[];
    accountPending: boolean;
}

@Component({
    selector: 'app-add-employee',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './add-employee.component.html',
    styleUrl: './add-employee.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEmployeeComponent implements OnInit {
    activeTab: FormTab['id'] = 'personal';
    toastMessage = '';
    isSaving = false;
    isLoadingWorkData = false;
    isLoadingSalaryData = false;
    isLoadingAccountData = false;
    createdEmployeeId: number | null = null;
    private pendingAllowanceIds: number[] = [];
    private accountSetupPending = false;
    phongBans: PhongBan[] = [];
    chucVus: ChucVu[] = [];
    trinhDos: TrinhDo[] = [];
    phuCaps: PhuCap[] = [];
    quyens: Quyen[] = [];
    readonly tabs: FormTab[] = [
        {
            id: 'personal',
            label: 'Thông tin cá nhân',
            icon: 'user-round',
        },
        {
            id: 'work',
            label: 'Thông tin công việc',
            icon: 'briefcase-business',
        },
        {
            id: 'salary',
            label: 'Lương & Phúc lợi',
            icon: 'wallet',
        },
        {
            id: 'account',
            label: 'Cài đặt tài khoản',
            icon: 'settings',
        },
    ];
    personalForm: PersonalInformationForm = {
        fullName: '',
        employeeCode: 'Tự động sau khi lưu',
        dateOfBirth: '',
        gender: '',
        identityNumber: '',
        permanentAddress: '',
        phoneNumber: '',
        personalEmail: '',
        avatarPreview: '',
    };
    workForm: WorkInformationForm = {
        maPB: null,
        maCV: null,
        maTD: null,
        ngayVaoLam: this.getToday(),
    };
    salaryForm: SalaryInformationForm = {
        selectedAllowanceIds: [],
        allowanceStartDate: this.getToday(),
    };
    accountForm: AccountInformationForm = {
        createAccount: true,
        username: '',
        password: '',
        confirmPassword: '',
        maQuyen: null,
        status: 'Hoạt động',
    };
    constructor(
        private readonly router: Router,
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly chucVuService: ChucVuService,
        private readonly trinhDoService: TrinhDoService,
        private readonly phuCapService: PhuCapService,
        private readonly nhanVienPhuCapService: NhanVienPhuCapService,
        private readonly quyenService: QuyenService,
        private readonly taiKhoanService: TaiKhoanService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }
    ngOnInit(): void {
        this.loadWorkData();
        this.loadSalaryData();
        this.loadAccountData();
    }
    loadWorkData(): void {
        this.isLoadingWorkData = true;
        forkJoin({
            phongBans: this.phongBanService.getAll(),
            chucVus: this.chucVuService.getAll(),
            trinhDos: this.trinhDoService.getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoadingWorkData = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ phongBans, chucVus, trinhDos }) => {
                    this.phongBans = phongBans;
                    this.chucVus = chucVus;
                    this.trinhDos = trinhDos;
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        this.showToast('Phiên đăng nhập đã hết hạn.');
                    } else {
                        this.showToast('Không thể tải Phòng ban, Chức vụ hoặc Trình độ.');
                    }
                },
            });
    }
    loadSalaryData(): void {
        this.isLoadingSalaryData = true;
        this.phuCapService
            .getAll()
            .pipe(
                finalize(() => {
                    this.isLoadingSalaryData = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (data) => {
                    this.phuCaps = data;
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        this.showToast('Phiên đăng nhập đã hết hạn.');
                    } else {
                        this.showToast('Không thể tải danh sách phụ cấp.');
                    }
                },
            });
    }
    loadAccountData(): void {
        this.isLoadingAccountData = true;
        this.quyenService
            .getAll()
            .pipe(
                finalize(() => {
                    this.isLoadingAccountData = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (data) => {
                    this.quyens = data;
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        this.showToast('Phiên đăng nhập đã hết hạn.');
                    } else {
                        this.showToast('Không thể tải danh sách quyền.');
                    }
                },
            });
    }
    toggleAllowance(maPC: number, checked: boolean): void {
        if (checked) {
            if (!this.salaryForm.selectedAllowanceIds.includes(maPC)) {
                this.salaryForm.selectedAllowanceIds = [...this.salaryForm.selectedAllowanceIds, maPC];
            }
            return;
        }
        this.salaryForm.selectedAllowanceIds = this.salaryForm.selectedAllowanceIds.filter((id) => id !== maPC);
    }
    isAllowanceSelected(maPC: number): boolean {
        return this.salaryForm.selectedAllowanceIds.includes(maPC);
    }
    changeTab(tab: FormTab['id']): void {
        if (
            this.createdEmployeeId !== null &&
            (tab === 'personal' || tab === 'work')
        ) {
            this.showToast('Hồ sơ nhân viên đã được tạo. Vui lòng hoàn tất các bước còn lại.');
            return;
        }

        if (tab !== 'personal' && !this.validatePersonalForm()) {
            this.activeTab = 'personal';
            return;
        }

        if ((tab === 'salary' || tab === 'account') && !this.validateWorkForm()) {
            this.activeTab = 'work';
            return;
        }

        this.activeTab = tab;
    }

    continueToNextStep(): void {
        if (!this.validatePersonalForm()) {
            return;
        }
        this.activeTab = 'work';
    }
    saveEmployee(): void {
        if (this.isSaving) {
            return;
        }

        if (this.createdEmployeeId !== null) {
            if (this.pendingAllowanceIds.length > 0 && !this.validateSalaryForm()) {
                this.activeTab = 'salary';
                return;
            }

            if (
                this.accountSetupPending &&
                this.accountForm.createAccount &&
                !this.validateAccountForm()
            ) {
                this.activeTab = 'account';
                return;
            }

            if (!this.accountForm.createAccount) {
                this.accountSetupPending = false;
            }

            this.retryPendingSetup();
            return;
        }

        if (!this.validatePersonalForm()) {
            this.activeTab = 'personal';
            return;
        }

        if (!this.validateWorkForm()) {
            this.activeTab = 'work';
            return;
        }

        if (!this.validateSalaryForm()) {
            this.activeTab = 'salary';
            return;
        }

        if (!this.validateAccountForm()) {
            this.activeTab = 'account';
            return;
        }

        const payload: CreateNhanVienRequest = this.buildPayload();

        this.isSaving = true;
        this.nhanVienService
            .create(payload)
            .pipe(
                switchMap((employee) => {
                    this.createdEmployeeId = employee.maNV;
                    this.personalForm.employeeCode = this.formatEmployeeCode(employee.maNV);
                    this.pendingAllowanceIds = [...this.salaryForm.selectedAllowanceIds];
                    this.accountSetupPending = this.accountForm.createAccount;
                    this.changeDetectorRef.markForCheck();

                    return this.completePendingSetup(employee.maNV);
                }),
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (result) => {
                    this.handleSetupResult(result);
                },
                error: (error: HttpErrorResponse) => {
                    this.handleCreateEmployeeError(error);
                },
            });
    }

    private retryPendingSetup(): void {
        if (this.createdEmployeeId === null) {
            return;
        }

        this.isSaving = true;
        this.completePendingSetup(this.createdEmployeeId)
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (result) => {
                    this.handleSetupResult(result);
                },
            });
    }

    private completePendingSetup(employeeId: number): Observable<EmployeeSetupResult> {
        const allowances$ = this.completePendingAllowances(employeeId);
        const account$ = this.accountSetupPending
            ? this.completePendingAccount(employeeId)
            : of(true);

        return forkJoin({
            failedAllowanceIds: allowances$,
            accountSuccess: account$,
        }).pipe(
            map(({ failedAllowanceIds, accountSuccess }) => ({
                employeeId,
                failedAllowanceIds,
                accountPending: this.accountSetupPending && !accountSuccess,
            })),
        );
    }

    private completePendingAllowances(employeeId: number): Observable<number[]> {
        const targetIds = [...this.pendingAllowanceIds];

        if (targetIds.length === 0) {
            return of([]);
        }

        return this.nhanVienPhuCapService
            .getAll()
            .pipe(
                switchMap((assignments) => {
                    const existingIds = new Set(
                        assignments
                            .filter((item) => item.maNV === employeeId)
                            .map((item) => item.maPC),
                    );

                    const missingIds = targetIds.filter(
                        (maPC) => !existingIds.has(maPC),
                    );

                    if (missingIds.length === 0) {
                        return of([]);
                    }

                    return forkJoin(
                        missingIds.map((maPC) =>
                            this.nhanVienPhuCapService
                                .create({
                                    maNV: employeeId,
                                    maPC,
                                    ngayApDung: this.salaryForm.allowanceStartDate,
                                    trangThai: 'Đang áp dụng',
                                })
                                .pipe(
                                    map(() => ({
                                        maPC,
                                        success: true,
                                    })),
                                    catchError(() =>
                                        of({
                                            maPC,
                                            success: false,
                                        }),
                                    ),
                                ),
                        ),
                    ).pipe(
                        map((results) =>
                            results
                                .filter((result) => !result.success)
                                .map((result) => result.maPC),
                        ),
                    );
                }),
                catchError(() => of(targetIds)),
            );
    }

    private completePendingAccount(employeeId: number): Observable<boolean> {
        if (!this.accountForm.createAccount) {
            return of(true);
        }

        return this.taiKhoanService
            .getAll()
            .pipe(
                switchMap((accounts) => {
                    const existingAccount = accounts.find(
                        (account) => account.maNV === employeeId,
                    );

                    if (existingAccount) {
                        return of(true);
                    }

                    return this.taiKhoanService
                        .create({
                            tenDangNhap: this.accountForm.username.trim(),
                            matKhau: this.accountForm.password,
                            maNV: employeeId,
                            maQuyen: this.accountForm.maQuyen!,
                            trangThai: this.mapAccountStatus(this.accountForm.status),
                        })
                        .pipe(
                            map(() => true),
                            catchError(() => of(false)),
                        );
                }),
                catchError(() => of(false)),
            );
    }

    private handleSetupResult(result: EmployeeSetupResult): void {
        this.pendingAllowanceIds = result.failedAllowanceIds;
        this.accountSetupPending = result.accountPending;

        if (
            this.pendingAllowanceIds.length === 0 &&
            !this.accountSetupPending
        ) {
            this.showToast('Thêm nhân viên thành công.');

            window.setTimeout(() => {
                void this.router.navigate(['/employees']);
            }, 700);

            return;
        }

        if (this.pendingAllowanceIds.length > 0) {
            this.activeTab = 'salary';
        } else {
            this.activeTab = 'account';
        }

        const pendingParts: string[] = [];

        if (this.pendingAllowanceIds.length > 0) {
            pendingParts.push(
                `${this.pendingAllowanceIds.length} phụ cấp chưa gán được`,
            );
        }

        if (this.accountSetupPending) {
            pendingParts.push('tài khoản chưa tạo được');
        }

        this.showToast(
            `${this.formatEmployeeCode(result.employeeId)} đã được tạo. ${pendingParts.join(
                ' và ',
            )}. Kiểm tra thông tin rồi bấm Hoàn tất để thử lại.`,
        );
    }

    private handleCreateEmployeeError(error: HttpErrorResponse): void {
        if (error.status === 401) {
            this.showToast('Phiên đăng nhập đã hết hạn.');
            return;
        }

        if (error.status === 400) {
            this.showToast(error.error?.message ?? 'Dữ liệu nhân viên chưa hợp lệ.');
            return;
        }

        if (error.status === 0) {
            this.showToast('Không thể kết nối đến hệ thống.');
            return;
        }

        this.showToast(error.error?.message ?? 'Không thể thêm nhân viên.');
    }

    cancel(): void {
        if (this.isSaving) {
            return;
        }

        if (this.createdEmployeeId !== null) {
            void this.router.navigate(['/employees', this.createdEmployeeId]);
            return;
        }

        void this.router.navigate(['/employees']);
    }
    private buildPayload(): CreateNhanVienRequest {
        return {
            hoTen: this.personalForm.fullName.trim(),
            gioiTinh: this.mapGender(this.personalForm.gender),
            ngaySinh: this.personalForm.dateOfBirth,
            cccd: this.personalForm.identityNumber.trim() || null,
            diaChi: this.personalForm.permanentAddress.trim(),
            sdt: this.personalForm.phoneNumber.trim() || null,
            email: this.personalForm.personalEmail.trim() || null,
            ngayVaoLam: this.workForm.ngayVaoLam,
            hinhAnh: this.personalForm.avatarPreview.trim() || null,
            maPB: this.workForm.maPB,
            maCV: this.workForm.maCV,
            maTD: this.workForm.maTD,
            trangThai: NHAN_VIEN_TRANG_THAI.DANG_LAM_VIEC,
        };
    }
    private validateWorkForm():
        boolean {

        if (
            !this.workForm
                .ngayVaoLam
        ) {
            this.showToast(
                'Vui lòng chọn ngày vào làm.',
            );

            return false;
        }

        return true;
    }
    private validateSalaryForm(): boolean {
        if (this.salaryForm.selectedAllowanceIds.length > 0 && !this.salaryForm.allowanceStartDate) {
            this.showToast('Vui lòng chọn ngày áp dụng phụ cấp.');
            return false;
        }
        return true;
    }
    private validateAccountForm(): boolean {
        if (!this.accountForm.createAccount) {
            return true;
        }
        const username = this.accountForm.username.trim();
        if (!username) {
            this.showToast('Vui lòng nhập tên đăng nhập.');
            return false;
        }
        if (username.length < 3) {
            this.showToast('Tên đăng nhập phải có ít nhất 3 ký tự.');
            return false;
        }
        if (!this.accountForm.password) {
            this.showToast('Vui lòng nhập mật khẩu.');
            return false;
        }
        if (this.accountForm.password.length < 6) {
            this.showToast('Mật khẩu phải có ít nhất 6 ký tự.');
            return false;
        }
        if (!this.accountForm.confirmPassword) {
            this.showToast('Vui lòng xác nhận mật khẩu.');
            return false;
        }
        if (this.accountForm.password !== this.accountForm.confirmPassword) {
            this.showToast('Mật khẩu xác nhận không khớp.');
            return false;
        }
        if (this.accountForm.maQuyen === null) {
            this.showToast('Vui lòng chọn quyền cho tài khoản.');
            return false;
        }
        if (!this.accountForm.status) {
            this.showToast('Vui lòng chọn trạng thái tài khoản.');
            return false;
        }
        return true;
    }
    private mapGender(gender: Gender | ''): string {
        switch (gender) {
            case 'male':
                return 'Nam';
            case 'female':
                return 'Nữ';
            case 'other':
                return 'Khác';
            default:
                return '';
        }
    }
    private formatEmployeeCode(maNV: number): string {
        return `NV-${String(maNV).padStart(4, '0')}`;
    }

    private getToday(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    private validatePersonalForm():
        boolean {

        const fullName =
            this.personalForm
                .fullName
                .trim();

        const identityNumber =
            this.personalForm
                .identityNumber
                .trim();

        const address =
            this.personalForm
                .permanentAddress
                .trim();

        const phone =
            this.personalForm
                .phoneNumber
                .trim();

        const email =
            this.personalForm
                .personalEmail
                .trim();

        if (!fullName) {
            this.showToast(
                'Vui lòng nhập họ và tên.',
            );

            return false;
        }

        if (
            !this.personalForm
                .dateOfBirth
        ) {
            this.showToast(
                'Vui lòng chọn ngày sinh.',
            );

            return false;
        }

        if (
            !this.personalForm
                .gender
        ) {
            this.showToast(
                'Vui lòng chọn giới tính.',
            );

            return false;
        }

        if (!address) {
            this.showToast(
                'Vui lòng nhập địa chỉ thường trú.',
            );

            return false;
        }

        if (
            identityNumber &&
            identityNumber.length > 20
        ) {
            this.showToast(
                'CCCD không được vượt quá 20 ký tự.',
            );

            return false;
        }

        if (
            phone &&
            phone.length > 15
        ) {
            this.showToast(
                'Số điện thoại không được vượt quá 15 ký tự.',
            );

            return false;
        }

        if (
            email.length > 100
        ) {
            this.showToast(
                'Email không được vượt quá 100 ký tự.',
            );

            return false;
        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(
                    email,
                )
        ) {
            this.showToast(
                'Email cá nhân không đúng định dạng.',
            );

            return false;
        }

        return true;
    }

    private mapAccountStatus(status: string): (typeof TAI_KHOAN_TRANG_THAI)[keyof typeof TAI_KHOAN_TRANG_THAI] {
        if (status === TAI_KHOAN_TRANG_THAI.BI_KHOA || status === 'Tạm khóa') {
            return TAI_KHOAN_TRANG_THAI.BI_KHOA;
        }
        if (status === TAI_KHOAN_TRANG_THAI.NGUNG_HOAT_DONG) {
            return TAI_KHOAN_TRANG_THAI.NGUNG_HOAT_DONG;
        }
        return TAI_KHOAN_TRANG_THAI.HOAT_DONG;
    }
    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();
        window.setTimeout(() => {
            this.toastMessage = '';
            this.changeDetectorRef.markForCheck();
        }, 2600);
    }
}
