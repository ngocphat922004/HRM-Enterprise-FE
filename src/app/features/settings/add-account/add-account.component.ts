import { CommonModule } from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';

import {
    FormsModule,
} from '@angular/forms';

import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
    forkJoin,
} from 'rxjs';

import {
    TAI_KHOAN_TRANG_THAI,
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';

import {
    CreateTaiKhoanRequest,
} from '../../accounts/models/tai-khoan.model';

import {
    QuyenService,
} from '../../accounts/services/quyen.service';

import {
    TaiKhoanService,
} from '../../accounts/services/tai-khoan.service';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    AddAccountEmployeeOption,
    AddAccountForm,
    AddAccountPasswordRule,
    AddAccountRoleOption,
} from './add-account.model';

@Component({
    selector:
        'app-add-account',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './add-account.component.html',

    styleUrl:
        './add-account.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AddAccountComponent
    implements OnInit, OnDestroy {

    readonly activeStatus =
        TAI_KHOAN_TRANG_THAI
            .HOAT_DONG;

    readonly lockedStatus =
        TAI_KHOAN_TRANG_THAI
            .BI_KHOA;

    readonly inactiveStatus =
        TAI_KHOAN_TRANG_THAI
            .NGUNG_HOAT_DONG;

    readonly statusOptions:
        readonly TaiKhoanTrangThai[] = [

            this.activeStatus,
            this.lockedStatus,
            this.inactiveStatus,
        ];

    employees:
        AddAccountEmployeeOption[] =
        [];

    roles:
        AddAccountRoleOption[] =
        [];

    private existingUsernames =
        new Set<string>();

    form:
        AddAccountForm = {

            tenDangNhap:
                '',

            matKhau:
                '',

            xacNhanMatKhau:
                '',

            maNV:
                null,

            maQuyen:
                null,

            trangThai:
                this.activeStatus,
        };
    submitted =
        false;

    isLoadingData =
        false;

    isSaving =
        false;

    loadError =
        '';

    showPassword =
        false;

    showConfirmPassword =
        false;

    toastMessage =
        '';

    preparedPayload:
        CreateTaiKhoanRequest |
        null =
        null;

    private toastTimer:
        ReturnType<
            typeof setTimeout
        > | null =
        null;

    constructor(
        private readonly router:
            Router,

        private readonly taiKhoanService:
            TaiKhoanService,

        private readonly quyenService:
            QuyenService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.loadFormData();
    }

    ngOnDestroy():
        void {

        if (
            this.toastTimer
        ) {

            clearTimeout(
                this.toastTimer,
            );
        }
    }

    get availableEmployees():
        AddAccountEmployeeOption[] {

        return this.employees
            .filter(
                (
                    employee,
                ) =>
                    !employee
                        .daCoTaiKhoan,
            );
    }

    get selectedEmployee():
        AddAccountEmployeeOption |
        null {

        return (
            this.employees
                .find(
                    (
                        employee,
                    ) =>
                        employee.maNV ===
                        this.form.maNV,
                ) ??
            null
        );
    }

    get selectedRole():
        AddAccountRoleOption |
        null {

        return (
            this.roles
                .find(
                    (
                        role,
                    ) =>
                        role.maQuyen ===
                        this.form.maQuyen,
                ) ??
            null
        );
    }

    get passwordRules():
        AddAccountPasswordRule[] {

        return [
            {
                label: 'Ít nhất 6 ký tự',
                passed: this.form.matKhau.length >= 6,
            },
        ];
    }

    get usernameDuplicate():
        boolean {

        const username =
            this.normalizeUsername(
                this.form
                    .tenDangNhap,
            );

        if (
            !username
        ) {

            return false;
        }

        return this
            .existingUsernames
            .has(
                username,
            );
    }

    get usernameInvalid():
        boolean {

        const username =
            this.form
                .tenDangNhap
                .trim();

        return (
            this.submitted &&
            (
                username.length <
                4 ||

                username.length >
                100 ||

                !/^[a-zA-Z0-9._-]+$/
                    .test(
                        username,
                    ) ||

                this.usernameDuplicate
            )
        );
    }

    get employeeInvalid():
        boolean {

        return (
            this.submitted &&
            (
                this.form.maNV ===
                null ||

                this.selectedEmployee
                    ?.daCoTaiKhoan ===
                true
            )
        );
    }

    get roleInvalid():
        boolean {

        return (
            this.submitted &&
            this.form.maQuyen ===
            null
        );
    }

    get passwordInvalid():
        boolean {

        return (
            this.submitted &&
            !this.passwordRules
                .every(
                    (
                        rule,
                    ) =>
                        rule.passed,
                )
        );
    }

    get confirmPasswordInvalid():
        boolean {

        return (
            this.submitted &&
            (
                !this.form
                    .xacNhanMatKhau ||

                this.form
                    .xacNhanMatKhau !==
                this.form
                    .matKhau
            )
        );
    }

    togglePasswordVisibility():
        void {

        this.showPassword =
            !this.showPassword;
    }

    toggleConfirmPasswordVisibility():
        void {

        this.showConfirmPassword =
            !this.showConfirmPassword;
    }

    retry():
        void {

        if (
            this.isLoadingData ||
            this.isSaving
        ) {

            return;
        }

        this.loadFormData();
    }

    cancel():
        void {

        if (
            this.isSaving
        ) {

            return;
        }

        void this.router
            .navigate([
                '/settings',
            ]);
    }

    saveAccount():
        void {

        this.submitted =
            true;

        this.loadError =
            '';

        if (
            this.isSaving ||
            this.isLoadingData
        ) {

            return;
        }

        if (
            !this.isFormValid()
        ) {

            if (
                this.usernameDuplicate
            ) {

                this.showToast(
                    'Tên đăng nhập đã tồn tại.',
                );

                return;
            }

            if (
                this.selectedEmployee
                    ?.daCoTaiKhoan ===
                true
            ) {

                this.showToast(
                    'Nhân viên này đã có tài khoản.',
                );

                return;
            }

            this.showToast(
                'Vui lòng kiểm tra lại các trường bắt buộc.',
            );

            return;
        }

        this.preparedPayload = {

            tenDangNhap:
                this.form
                    .tenDangNhap
                    .trim(),

            matKhau:
                this.form
                    .matKhau,

            maNV:
                Number(
                    this.form
                        .maNV,
                ),

            maQuyen:
                Number(
                    this.form
                        .maQuyen,
                ),

            trangThai:
                this.form
                    .trangThai,
        };

        this.isSaving =
            true;

        this.taiKhoanService
            .create(
                this.preparedPayload,
            )
            .pipe(
                finalize(
                    () => {

                        this.isSaving =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({

                next: (
                    createdAccount,
                ) => {

                    this.showToast(
                        'Tạo tài khoản thành công.',
                    );

                    const createdId =
                        createdAccount
                            ?.maTK;

                    window.setTimeout(
                        () => {

                            if (
                                createdId
                            ) {

                                void this.router
                                    .navigate([
                                        '/settings/accounts',
                                        createdId,
                                    ]);

                                return;
                            }

                            void this.router
                                .navigate([
                                    '/settings',
                                ]);

                        },
                        700,
                    );
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.loadError =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tạo tài khoản.',
                        );

                    this.showToast(
                        this.loadError,
                    );
                },
            });
    }

    getInitials(
        name:
            string,
    ): string {

        const parts =
            name
                .trim()
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );

        if (
            parts.length ===
            0
        ) {

            return 'NV';
        }

        if (
            parts.length ===
            1
        ) {

            return parts[0]
                .slice(
                    0,
                    2,
                )
                .toUpperCase();
        }

        return parts
            .slice(
                -2,
            )
            .map(
                (
                    part,
                ) =>
                    part[0],
            )
            .join(
                '',
            )
            .toUpperCase();
    }

    private loadFormData():
        void {

        this.isLoadingData =
            true;

        this.loadError =
            '';

        forkJoin({

            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.phongBanService
                    .getAll(),

            roles:
                this.quyenService
                    .getAll(),

            accounts:
                this.taiKhoanService
                    .getAll(),

        })
            .pipe(
                finalize(
                    () => {

                        this.isLoadingData =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({

                next: ({
                    employees,
                    departments,
                    roles,
                    accounts,
                }) => {

                    this.existingUsernames =
                        new Set(
                            accounts
                                .map(
                                    (
                                        account,
                                    ) =>
                                        this.normalizeUsername(
                                            account
                                                .tenDangNhap,
                                        ),
                                ),
                        );

                    this.employees =
                        employees
                            .map(
                                (
                                    employee,
                                ) => {

                                    const department =
                                        employee.maPB !==
                                            null &&
                                            employee.maPB !==
                                            undefined

                                            ? departments.find(
                                                (
                                                    item,
                                                ) =>
                                                    item.maPB ===
                                                    employee.maPB,
                                            )

                                            : undefined;

                                    const employeeExtra =
                                        employee as
                                        typeof employee & {

                                            email?:
                                            string | null;

                                            tenPB?:
                                            string | null;

                                            tenCV?:
                                            string | null;
                                        };

                                    const hasAccount =
                                        accounts.some(
                                            (
                                                account,
                                            ) =>
                                                account.maNV ===
                                                employee.maNV,
                                        );

                                    return {

                                        maNV:
                                            employee.maNV,

                                        hoTen:
                                            employee.hoTen,

                                        email:
                                            employeeExtra
                                                .email ??
                                            null,

                                        tenPB:
                                            department
                                                ?.tenPB ??
                                            employeeExtra
                                                .tenPB ??
                                            null,

                                        tenCV:
                                            employeeExtra
                                                .tenCV ??
                                            null,

                                        daCoTaiKhoan:
                                            hasAccount,

                                    } as
                                        AddAccountEmployeeOption;
                                },
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.hoTen
                                        .localeCompare(
                                            b.hoTen,
                                            'vi',
                                        ),
                            );

                    this.roles =
                        roles
                            .map(
                                (
                                    role,
                                ) => ({

                                    maQuyen:
                                        role.maQuyen,

                                    tenQuyen:
                                        role.tenQuyen,

                                    moTa:
                                        role.moTa ??
                                        null,

                                }),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.tenQuyen
                                        .localeCompare(
                                            b.tenQuyen,
                                            'vi',
                                        ),
                            );

                    if (
                        this.selectedEmployee
                            ?.daCoTaiKhoan ===
                        true
                    ) {

                        this.form.maNV =
                            null;
                    }

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.employees =
                        [];

                    this.roles =
                        [];

                    this.existingUsernames =
                        new Set();

                    this.loadError =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải dữ liệu tạo tài khoản.',
                        );

                    this.showToast(
                        this.loadError,
                    );
                },
            });
    }

    private isFormValid():
        boolean {

        const username =
            this.form
                .tenDangNhap
                .trim();

        return (
            username.length >=
            4 &&

            username.length <=
            100 &&

            /^[a-zA-Z0-9._-]+$/
                .test(
                    username,
                ) &&

            !this.usernameDuplicate &&

            this.form.maNV !==
            null &&

            this.selectedEmployee
                ?.daCoTaiKhoan !==
            true &&

            this.form.maQuyen !==
            null &&

            this.passwordRules
                .every(
                    (
                        rule,
                    ) =>
                        rule.passed,
                ) &&

            !!this.form
                .xacNhanMatKhau &&

            this.form
                .xacNhanMatKhau ===
            this.form
                .matKhau &&

            this.statusOptions
                .includes(
                    this.form
                        .trangThai,
                )
        );
    }

    private normalizeUsername(
        value:
            string,
    ): string {

        return value
            .trim()
            .toLowerCase();
    }

    private getApiErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

        const backendMessage =
            typeof error.error
                ?.message ===
                'string'

                ? error.error
                    .message

                : '';

        if (
            backendMessage
        ) {

            return backendMessage;
        }

        const backendErrors =
            error.error
                ?.errors;

        if (
            backendErrors &&
            typeof backendErrors ===
            'object'
        ) {

            const messages =
                Object.values(
                    backendErrors as
                    Record<
                        string,
                        unknown
                    >,
                )
                    .flatMap(
                        (
                            value,
                        ) => {

                            if (
                                Array.isArray(
                                    value,
                                )
                            ) {

                                return value.map(
                                    (
                                        item,
                                    ) =>
                                        String(
                                            item,
                                        ),
                                );
                            }

                            return [
                                String(
                                    value,
                                ),
                            ];
                        },
                    )
                    .filter(
                        Boolean,
                    );

            if (
                messages.length >
                0
            ) {

                return messages
                    .join(
                        ' ',
                    );
            }
        }

        switch (
        error.status
        ) {

            case 0:

                return (
                    'Không thể kết nối đến hệ thống.'
                );

            case 400:

                return (
                    'Dữ liệu tài khoản không hợp lệ.'
                );

            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:

                return (
                    'Bạn không có quyền tạo tài khoản.'
                );

            case 404:

                return (
                    'Không tìm thấy nhân viên hoặc quyền được chọn.'
                );

            case 409:

                return (
                    'Tên đăng nhập hoặc nhân viên đã được sử dụng cho tài khoản khác.'
                );

            default:

                return fallback;
        }
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        if (
            this.toastTimer
        ) {

            clearTimeout(
                this.toastTimer,
            );
        }

        this.toastTimer =
            setTimeout(
                () => {

                    this.toastMessage =
                        '';

                    this.toastTimer =
                        null;

                    this.changeDetectorRef
                        .markForCheck();

                },
                3500,
            );
    }
}
