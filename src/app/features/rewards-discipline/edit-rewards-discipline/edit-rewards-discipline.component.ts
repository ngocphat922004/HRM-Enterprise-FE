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
    KHEN_THUONG_KY_LUAT_LOAI,
} from '../../../core/constants/status.constants';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    KhenThuongKyLuat,
    UpdateKhenThuongKyLuatRequest,
} from '../models/khen-thuong-ky-luat.model';

import {
    KhenThuongKyLuatService,
} from '../services/khen-thuong-ky-luat.service';

import {
    EditRewardsDisciplineEmployeeOption,
    EditRewardsDisciplineForm,
} from './edit-rewards-discipline.model';


@Component({
    selector:
        'app-edit-rewards-discipline',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './edit-rewards-discipline.component.html',

    styleUrl:
        './edit-rewards-discipline.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class EditRewardsDisciplineComponent
    implements OnInit, OnDestroy {

    readonly rewardType =
        KHEN_THUONG_KY_LUAT_LOAI
            .KHEN_THUONG;


    readonly disciplineType =
        KHEN_THUONG_KY_LUAT_LOAI
            .KY_LUAT;






    employees:
        EditRewardsDisciplineEmployeeOption[] =
        [];


    decisionId:
        number | null =
        null;


    decision:
        KhenThuongKyLuat | null =
        null;






    form:
        EditRewardsDisciplineForm;


    submitted =
        false;


    isLoading =
        false;


    isSaving =
        false;


    loadError =
        '';


    toastMessage =
        '';


    preparedPayload:
        UpdateKhenThuongKyLuatRequest |
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

        private readonly khenThuongKyLuatService:
            KhenThuongKyLuatService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) {

        this.form =
            this.createEmptyForm();
    }


    ngOnInit():
        void {

        const rawId =
            this.route
                .snapshot
                .paramMap
                .get(
                    'id',
                );


        const routeId =
            Number(
                rawId,
            );


        if (
            !rawId ||

            !Number.isInteger(
                routeId,
            ) ||

            routeId <= 0
        ) {

            this.loadError =
                'Mã quyết định không hợp lệ.';


            this.changeDetectorRef
                .markForCheck();


            return;
        }


        this.decisionId =
            routeId;


        this.loadDecision();
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






    get decisionCode():
        string {

        if (
            this.decisionId ===
            null
        ) {

            return (
                'Chưa xác định'
            );
        }


        return this
            .formatDecisionCode(
                this.decisionId,
            );
    }






    get selectedEmployee():
        EditRewardsDisciplineEmployeeOption |
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






    get employeeInvalid():
        boolean {

        return (
            this.submitted &&
            this.form.maNV ===
            null
        );
    }


    get typeInvalid():
        boolean {

        return (
            this.submitted &&
            (
                this.form.loai !==
                this.rewardType &&

                this.form.loai !==
                this.disciplineType
            )
        );
    }


    get amountInvalid():
        boolean {

        const amount =
            Number(
                this.form
                    .soTien,
            );


        return (
            this.submitted &&
            (
                this.form.soTien ===
                null ||

                !Number.isFinite(
                    amount,
                ) ||

                amount < 0
            )
        );
    }


    get decisionDateInvalid():
        boolean {

        return (
            this.submitted &&
            !this.isValidDate(
                this.form
                    .ngayQuyetDinh,
            )
        );
    }






    get reasonInvalid():
        boolean {

        return (
            this.form.lyDo
                .trim()
                .length >
            1000
        );
    }






    get typeDescription():
        string {

        if (
            this.form.loai ===
            this.rewardType
        ) {

            return (
                'Ghi nhận thành tích và đóng góp tích cực của nhân viên.'
            );
        }


        if (
            this.form.loai ===
            this.disciplineType
        ) {

            return (
                'Ghi nhận quyết định xử lý vi phạm theo quy định.'
            );
        }


        return (
            'Chọn loại quyết định để xem thông tin tóm tắt.'
        );
    }




    normalizeAmount():
        void {

        const rawValue =
            this.form
                .soTien;


        if (
            rawValue ===
            null ||

            rawValue ===
            undefined
        ) {

            this.form.soTien =
                0;

            return;
        }


        const amount =
            Number(
                rawValue,
            );


        this.form.soTien =
            Number.isFinite(
                amount,
            )
                ? amount
                : 0;
    }






    retry():
        void {

        if (
            this.isLoading ||
            this.isSaving ||
            this.decisionId ===
            null
        ) {

            return;
        }


        this.loadDecision();
    }






    cancel():
        void {

        if (
            this.isSaving
        ) {

            return;
        }


        if (
            this.decisionId !==
            null
        ) {

            void this.router
                .navigate([
                    '/rewards-discipline',
                    this.decisionId,
                ]);

            return;
        }


        void this.router
            .navigate([
                '/rewards-discipline',
            ]);
    }





    saveDecision():
        void {

        this.submitted =
            true;


        this.loadError =
            '';


        if (
            this.isSaving ||
            this.isLoading
        ) {

            return;
        }


        if (
            this.decisionId ===
            null
        ) {

            this.showToast(
                'Không xác định được mã quyết định.',
            );

            return;
        }


        if (
            !this.isFormValid()
        ) {

            this.showToast(
                'Vui lòng kiểm tra lại các trường bắt buộc.',
            );

            return;
        }


        this.preparedPayload =
            this.buildPayload();


        this.isSaving =
            true;


        this.khenThuongKyLuatService
            .update(
                this.decisionId,
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
                    updatedDecision,
                ) => {

                    this.applyDecision(
                        updatedDecision,
                    );


                    this.showToast(
                        `Đã cập nhật quyết định ${this.decisionCode} thành công.`,
                    );


                    window.setTimeout(
                        () => {

                            void this.router
                                .navigate([
                                    '/rewards-discipline',
                                    updatedDecision
                                        .maKTKL,
                                ]);

                        },
                        700,
                    );
                },


                error: (
                    error:
                        unknown,
                ) => {


                    this.loadError =
                        this.getApiErrorMessage(
                            error,

                            'Không thể cập nhật quyết định.',
                        );


                    this.showToast(
                        this.loadError,
                    );
                },
            });
    }




    private loadDecision():
        void {

        if (
            this.decisionId ===
            null
        ) {

            return;
        }


        this.isLoading =
            true;


        this.loadError =
            '';


        const hasLoadedDecision =
            this.decision !==
            null;


        if (!hasLoadedDecision) {
            this.form =
                this.createEmptyForm();
        }


        forkJoin({

            decision:
                this.khenThuongKyLuatService
                    .getById(
                        this.decisionId,
                    ),

            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.phongBanService
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
                    decision,
                    employees,
                    departments,
                }) => {





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

                                    } as
                                        EditRewardsDisciplineEmployeeOption;
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


                    this.applyDecision(
                        decision,
                    );


                    this.changeDetectorRef
                        .markForCheck();
                },


                error: (
                    error:
                        unknown,
                ) => {


                    if (!hasLoadedDecision) {
                        this.decision =
                            null;

                        this.employees =
                            [];
                    }


                    this.loadError =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải quyết định.',
                        );


                    this.showToast(
                        this.loadError,
                    );
                },
            });
    }






    private applyDecision(
        decision:
            KhenThuongKyLuat,
    ): void {

        this.decision =
            decision;


        this.form = {

            maNV:
                decision.maNV,

            loai:
                decision.loai,

            lyDo:
                decision.lyDo ??
                '',

            soTien:
                Number(
                    decision.soTien ??
                    0,
                ),

            ngayQuyetDinh:
                this.toDateInputValue(
                    decision
                        .ngayQuyetDinh,
                ),
        };
    }






    private createEmptyForm():
        EditRewardsDisciplineForm {

        return {

            maNV:
                null,

            loai:
                '',

            lyDo:
                '',

            soTien:
                0,

            ngayQuyetDinh:
                '',
        };
    }





    private buildPayload():
        UpdateKhenThuongKyLuatRequest {

        const decisionType =
            this.form.loai ===
                this.rewardType

                ? this.rewardType

                : this.disciplineType;


        return {

            maNV:
                Number(
                    this.form.maNV,
                ),

            loai:
                decisionType,

            lyDo:
                this.form.lyDo
                    .trim() ||
                null,

            soTien:
                this.toAmount(
                    this.form.soTien,
                ),

            ngayQuyetDinh:
                this.form
                    .ngayQuyetDinh,
        };
    }






    private isFormValid():
        boolean {

        return (
            this.form.maNV !==
            null &&

            (
                this.form.loai ===
                this.rewardType ||

                this.form.loai ===
                this.disciplineType
            ) &&

            this.form.soTien !==
            null &&

            !this.amountInvalid &&

            this.toAmount(
                this.form.soTien,
            ) >= 0 &&

            !this.reasonInvalid &&

            this.isValidDate(
                this.form
                    .ngayQuyetDinh,
            )
        );
    }






    private isValidDate(
        value:
            string,
    ): boolean {

        if (
            !value
        ) {

            return false;
        }


        if (
            !/^\d{4}-\d{2}-\d{2}$/
                .test(
                    value,
                )
        ) {

            return false;
        }


        const [
            year,
            month,
            day,
        ] =
            value
                .split(
                    '-',
                )
                .map(
                    Number,
                );


        const date =
            new Date(
                year,
                month - 1,
                day,
            );


        return (
            date.getFullYear() ===
            year &&

            date.getMonth() ===
            month - 1 &&

            date.getDate() ===
            day
        );
    }






    private toDateInputValue(
        value:
            string,
    ): string {

        return value
            ? value.slice(
                0,
                10,
            )
            : '';
    }






    private toAmount(
        value:
            number |
            null |
            undefined,
    ): number {

        const amount =
            Number(
                value ??
                0,
            );


        return Number.isFinite(
            amount,
        )
            ? amount
            : 0;
    }






    private formatDecisionCode(
        maKTKL:
            number,
    ): string {

        return `KTKL-${String(
            maKTKL,
        ).padStart(
            5,
            '0',
        )}`;
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






    private getApiErrorMessage(
        error:
            unknown,

        fallback:
            string,
    ): string {

        if (!(error instanceof HttpErrorResponse)) {
            return error instanceof Error && error.message.trim()
                ? error.message.trim()
                : fallback;
        }

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
                    'Dữ liệu quyết định không hợp lệ.'
                );


            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );


            case 403:

                return (
                    'Bạn không có quyền chỉnh sửa quyết định.'
                );


            case 404:

                return (
                    'Không tìm thấy quyết định.'
                );


            case 409:

                return (
                    'Dữ liệu quyết định đang bị xung đột.'
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