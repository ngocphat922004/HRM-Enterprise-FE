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
    ActivatedRoute,
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
    UpdateTaiKhoanRequest,
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
    EditAccountData,
    EditAccountEmployeeOption,
    EditAccountForm,
    EditAccountRoleOption,
} from './edit-account.model';

@Component({
    selector:
        'app-edit-account',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './edit-account.component.html',

    styleUrl:
        './edit-account.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class EditAccountComponent
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
        EditAccountEmployeeOption[] =
        [];

    roles:
        EditAccountRoleOption[] =
        [];

    accountId:
        number | null =
        null;

    account:
        EditAccountData | null =
        null;

    private existingUsernames =
        new Map<
            string,
            number
        >();

    form:
        EditAccountForm = {

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
    isLoading =
        false;

    isSaving =
        false;

    submitted =
        false;

    errorMessage =
        '';

    toastMessage =
        '';

    preparedPayload:
        UpdateTaiKhoanRequest |
        null =
        null;

    private toastTimer:
        ReturnType<
            typeof setTimeout
        > | null =
        null;

    constructor(
        private readonly route:
            ActivatedRoute,

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

        this.readRouteId();
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

    get accountCode():
        string {

        const id =
            this.account
                ?.maTK ??
            this.accountId;

        if (
            id ===
            null
        ) {

            return '—';
        }

        return `TK-${String(
            id,
        ).padStart(
            5,
            '0',
        )}`;
    }

    get availableEmployees():
        EditAccountEmployeeOption[] {

        return this.employees
            .filter(
                (
                    employee,
                ) =>
                    !employee
                        .daCoTaiKhoan ||

                    employee.maNV ===
                    this.account
                        ?.maNV,
            );
    }

    get selectedEmployee():
        EditAccountEmployeeOption |
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
        EditAccountRoleOption |
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

    get usernameDuplicate():
        boolean {

        const username =
            this.normalizeUsername(
                this.form
                    .tenDangNhap,
            );

        if (
            !username ||
            this.accountId ===
            null
        ) {

            return false;
        }

        const ownerId =
            this.existingUsernames
                .get(
                    username,
                );

        return (
            ownerId !==
            undefined &&

            ownerId !==
            this.accountId
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

        const selected =
            this.selectedEmployee;

        return (
            this.submitted &&
            (
                this.form.maNV ===
                null ||

                (
                    selected
                        ?.daCoTaiKhoan ===
                    true &&

                    selected.maNV !==
                    this.account
                        ?.maNV
                )
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
            (
                this.form.matKhau.length < 6 ||
                this.form.matKhau.length > 255
            )
        );
    }

    get confirmPasswordInvalid():
        boolean {

        return (
            this.submitted &&
            (
                !this.form.xacNhanMatKhau ||
                this.form.xacNhanMatKhau !==
                this.form.matKhau
            )
        );
    }

    cancel():
        void {

        if (
            this.isSaving
        ) {

            return;
        }

        if (
            this.accountId ===
            null
        ) {

            void this.router
                .navigate([
                    '/settings',
                ]);

            return;
        }

        void this.router
            .navigate([
                '/settings/accounts',
                this.accountId,
            ]);
    }

    retry():
        void {

        if (
            this.accountId ===
            null ||

            this.isLoading ||

            this.isSaving
        ) {

            return;
        }

        this.loadAccount();
    }

    saveAccount():
        void {

        this.submitted =
            true;

        this.errorMessage =
            '';

        if (
            this.isSaving ||
            this.isLoading
        ) {

            return;
        }

        if (
            !this.account ||
            this.accountId ===
            null
        ) {

            this.showToast(
                'Chưa có dữ liệu tài khoản để cập nhật.',
            );

            return;
        }

        if (
            !this.isFormValid()
        ) {

            if (
                this.usernameDuplicate
            ) {

                this.showToast(
                    'Tên đăng nhập đã được sử dụng bởi tài khoản khác.',
                );

                return;
            }

            if (
                this.selectedEmployee
                    ?.daCoTaiKhoan ===
                true &&

                this.selectedEmployee
                    .maNV !==
                this.account.maNV
            ) {

                this.showToast(
                    'Nhân viên được chọn đã có tài khoản.',
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
                    .trangThai as TaiKhoanTrangThai,
        };

        this.isSaving =
            true;

        this.taiKhoanService
            .update(
                this.accountId,
                this.preparedPayload!,
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

                next: () => {

                    const id =
                        this.accountId;

                    this.showToast(
                        'Cập nhật tài khoản thành công.',
                    );

                    window.setTimeout(
                        () => {

                            void this.router
                                .navigate([
                                    '/settings/accounts',
                                    id,
                                ]);

                        },
                        700,
                    );
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể cập nhật tài khoản.',
                        );

                    this.showToast(
                        this.errorMessage,
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

    private readRouteId():
        void {

        const rawId =
            this.route
                .snapshot
                .paramMap
                .get(
                    'id',
                );

        const parsedId =
            Number(
                rawId,
            );

        if (
            !rawId ||

            !Number.isInteger(
                parsedId,
            ) ||

            parsedId <= 0
        ) {

            this.accountId =
                null;

            this.account =
                null;

            this.errorMessage =
                'Mã tài khoản trên đường dẫn không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.accountId =
            parsedId;

        this.loadAccount();
    }

    private loadAccount():
        void {

        if (
            this.accountId ===
            null
        ) {

            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.account =
            null;

        this.employees =
            [];

        this.roles =
            [];

        this.submitted =
            false;

        this.preparedPayload =
            null;

        this.resetForm();

        forkJoin({

            account:
                this.taiKhoanService
                    .getById(
                        this.accountId,
                    ),

            accounts:
                this.taiKhoanService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.phongBanService
                    .getAll(),

            roles:
                this.quyenService
                    .getAll(),

        })
            .pipe(
                finalize(
                    () => {

                        this.isLoading =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({

                next: ({
                    account,
                    accounts,
                    employees,
                    departments,
                    roles,
                }) => {

                    this.existingUsernames =
                        new Map(
                            accounts.map(
                                (
                                    item,
                                ) => [

                                        this.normalizeUsername(
                                            item.tenDangNhap,
                                        ),

                                        item.maTK,

                                    ],
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
                                                item,
                                            ) =>
                                                item.maNV ===
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
                                                ?.tenPB ??
                                            null,

                                        tenCV:
                                            employeeExtra
                                                ?.tenCV ??
                                            null,

                                        daCoTaiKhoan:
                                            hasAccount,

                                    } as
                                        EditAccountEmployeeOption;
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

                    const employee =
                        employees.find(
                            (
                                item,
                            ) =>
                                item.maNV ===
                                account.maNV,
                        );

                    const department =
                        employee?.maPB !==
                            null &&
                            employee?.maPB !==
                            undefined

                            ? departments.find(
                                (
                                    item,
                                ) =>
                                    item.maPB ===
                                    employee.maPB,
                            )

                            : undefined;

                    const role =
                        roles.find(
                            (
                                item,
                            ) =>
                                item.maQuyen ===
                                account.maQuyen,
                        );

                    const employeeExtra =
                        employee as
                        (
                            typeof employee & {

                                email?:
                                string | null;

                                tenPB?:
                                string | null;

                                tenCV?:
                                string | null;
                            }
                        ) |
                        undefined;

                    const accountDetail:
                        EditAccountData = {

                        maTK:
                            account.maTK,

                        tenDangNhap:
                            account.tenDangNhap,

                        maNV:
                            account.maNV,

                        maQuyen:
                            account.maQuyen,

                        tenQuyen:
                            role
                                ?.tenQuyen ??
                            account
                                .tenQuyen ??
                            `Quyền #${account.maQuyen}`,

                        trangThai:
                            this.normalizeAccountStatus(
                                account.trangThai,
                            ),

                        hoTen:
                            employee
                                ?.hoTen ??
                            `Nhân viên #${account.maNV}`,

                        email:
                            employeeExtra
                                ?.email ??
                            null,

                        tenPB:
                            department
                                ?.tenPB ??
                            employeeExtra
                                ?.tenPB ??
                            null,

                        tenCV:
                            employeeExtra
                                ?.tenCV ??
                            null,
                    };

                    this.account =
                        accountDetail;

                    this.fillForm(
                        accountDetail,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.account =
                        null;

                    this.employees =
                        [];

                    this.roles =
                        [];

                    this.existingUsernames =
                        new Map();

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải dữ liệu tài khoản.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private fillForm(
        account:
            EditAccountData,
    ): void {

        this.form = {

            tenDangNhap:
                account.tenDangNhap,

            matKhau:
                '',

            xacNhanMatKhau:
                '',

            maNV:
                account.maNV,

            maQuyen:
                account.maQuyen,

            trangThai:
                this.normalizeAccountStatus(
                    account.trangThai,
                ),
        };
    }

    private resetForm():
        void {

        this.form = {

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
    }

    private isFormValid():
        boolean {

        const username =
            this.form
                .tenDangNhap
                .trim();

        const employee =
            this.selectedEmployee;

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

            employee !==
            null &&

            (
                employee.daCoTaiKhoan !==
                true ||

                employee.maNV ===
                this.account
                    ?.maNV
            ) &&

            this.form.maQuyen !==
            null &&

            this.form.matKhau.length >=
            6 &&

            this.form.matKhau.length <=
            255 &&

            this.form.xacNhanMatKhau ===
            this.form.matKhau &&

            this.form.trangThai !== '' &&

            this.statusOptions
                .includes(
                    this.form
                        .trangThai as TaiKhoanTrangThai,
                )
        );
    }

    private normalizeAccountStatus(
        status:
            string,
    ): TaiKhoanTrangThai | '' {

        switch (
        status
        ) {

            case this.lockedStatus:

                return (
                    this.lockedStatus
                );

            case this.inactiveStatus:

                return (
                    this.inactiveStatus
                );

            case this.activeStatus:

                return (
                    this.activeStatus
                );

            default:

                return '';
        }
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
                    'Bạn không có quyền chỉnh sửa tài khoản.'
                );

            case 404:

                return (
                    'Không tìm thấy tài khoản, nhân viên hoặc quyền.'
                );

            case 409:

                return (
                    'Tên đăng nhập hoặc nhân viên đã được sử dụng bởi tài khoản khác.'
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