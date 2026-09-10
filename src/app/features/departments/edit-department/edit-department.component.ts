import {
    CommonModule,
} from '@angular/common';

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
} from 'rxjs';

import {
    PHONG_BAN_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    PhongBanService,
} from '../services/phong-ban.service';

import {
    DepartmentEditForm,
} from './edit-department.model';


@Component({
    selector:
        'app-edit-department',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './edit-department.component.html',

    styleUrl:
        './edit-department.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class EditDepartmentComponent
    implements OnInit, OnDestroy {
    searchTerm =
        '';

    isLoading =
        false;

    isSaving =
        false;

    submitted =
        false;

    toastMessage =
        '';

    errorMessage =
        '';

    isCreateMode =
        false;

    departmentId:
        number | null =
        null;


    private toastTimer:
        ReturnType<typeof setTimeout> | null =
        null;
    readonly phongBanTrangThai =
        PHONG_BAN_TRANG_THAI;
    form:
        DepartmentEditForm = {

            maPB:
                0,

            tenPB:
                '',

            moTa:
                '',

            trangThai:
                PHONG_BAN_TRANG_THAI
                    .DANG_HOAT_DONG,
        };


    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly phongBanService:
            PhongBanService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }


    ngOnInit():
        void {

        this.readRoute();
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
    get pageTitle():
        string {

        return this.isCreateMode
            ? 'Thêm phòng ban'
            : 'Chỉnh sửa phòng ban';
    }


    get submitButtonLabel():
        string {

        return this.isCreateMode
            ? 'Thêm phòng ban'
            : 'Lưu thay đổi';
    }
    get departmentNameInvalid():
        boolean {

        if (
            !this.submitted
        ) {

            return false;
        }


        const value =
            this.form
                .tenPB
                .trim();


        return (
            value.length ===
            0 ||

            value.length >
            100
        );
    }


    get descriptionInvalid():
        boolean {

        if (
            !this.submitted
        ) {

            return false;
        }


        return (
            this.form
                .moTa
                .trim()
                .length >
            255
        );
    }
    private readRoute():
        void {

        const rawId =
            this.route
                .snapshot
                .paramMap
                .get(
                    'id',
                );
        if (
            rawId ===
            null
        ) {

            this.isCreateMode =
                true;


            this.departmentId =
                null;


            this.resetForm();


            this.changeDetectorRef
                .markForCheck();


            return;
        }


        const parsedId =
            Number(
                rawId,
            );


        if (
            !Number.isInteger(
                parsedId,
            ) ||

            parsedId <=
            0
        ) {

            this.isCreateMode =
                false;


            this.departmentId =
                null;


            this.errorMessage =
                'Mã phòng ban trên đường dẫn không hợp lệ.';


            this.resetForm();


            this.changeDetectorRef
                .markForCheck();


            return;
        }


        this.isCreateMode =
            false;


        this.departmentId =
            parsedId;


        this.loadDepartment();
    }
    private loadDepartment():
        void {

        if (
            this.departmentId ===
            null
        ) {

            return;
        }


        this.isLoading =
            true;


        this.errorMessage =
            '';


        this.submitted =
            false;


        this.phongBanService
            .getById(
                this.departmentId,
            )
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

                next: (
                    department,
                ) => {

                    this.form = {

                        maPB:
                            department.maPB,

                        tenPB:
                            department.tenPB,

                        moTa:
                            department.moTa ??
                            '',

                        trangThai:
                            department.trangThai as
                            DepartmentEditForm['trangThai'],
                    };


                    this.changeDetectorRef
                        .markForCheck();
                },


                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD DEPARTMENT ERROR:',
                        error,
                    );


                    this.resetForm();


                    if (
                        error.status ===
                        404
                    ) {

                        this.errorMessage =
                            'Không tìm thấy phòng ban.';

                    } else if (
                        error.status ===
                        401
                    ) {

                        this.errorMessage =
                            'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';

                    } else if (
                        error.status ===
                        0
                    ) {

                        this.errorMessage =
                            'Không thể kết nối đến API phòng ban.';

                    } else {

                        this.errorMessage =
                            error.error
                                ?.message ??
                            'Không thể tải thông tin phòng ban.';
                    }


                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }
    saveChanges():
        void {

        this.submitted =
            true;


        if (
            this.isSaving ||
            this.isLoading
        ) {

            return;
        }


        const tenPB =
            this.form
                .tenPB
                .trim();


        const moTa =
            this.form
                .moTa
                .trim();


        if (
            tenPB.length ===
            0
        ) {

            this.showToast(
                'Vui lòng nhập tên phòng ban.',
            );


            return;
        }


        if (
            tenPB.length >
            100
        ) {

            this.showToast(
                'Tên phòng ban không được vượt quá 100 ký tự.',
            );


            return;
        }


        if (
            moTa.length >
            255
        ) {

            this.showToast(
                'Mô tả phòng ban không được vượt quá 255 ký tự.',
            );


            return;
        }
        const payload = {

            tenPB,

            moTa:
                moTa.length >
                    0

                    ? moTa
                    : null,

            trangThai:
                this.form
                    .trangThai,
        };


        this.isSaving =
            true;


        this.errorMessage =
            '';
        if (
            this.isCreateMode
        ) {

            this.phongBanService
                .create(
                    payload,
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
                        department,
                    ) => {

                        this.showToast(
                            'Thêm phòng ban thành công.',
                        );


                        void this.router
                            .navigate([
                                '/departments',
                                department.maPB,
                            ]);
                    },


                    error: (
                        error:
                            HttpErrorResponse,
                    ) => {

                        this.handleSaveError(
                            error,
                        );
                    },
                });


            return;
        }
        if (
            this.departmentId ===
            null
        ) {

            this.isSaving =
                false;


            this.showToast(
                'Không xác định được phòng ban cần cập nhật.',
            );


            this.changeDetectorRef
                .markForCheck();


            return;
        }


        this.phongBanService
            .update(
                this.departmentId,
                payload,
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
                    department,
                ) => {

                    this.form = {

                        maPB:
                            department.maPB,

                        tenPB:
                            department.tenPB,

                        moTa:
                            department.moTa ??
                            '',

                        trangThai:
                            department.trangThai as
                            DepartmentEditForm['trangThai'],
                    };


                    this.showToast(
                        'Cập nhật phòng ban thành công.',
                    );


                    void this.router
                        .navigate([
                            '/departments',
                            department.maPB,
                        ]);
                },


                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.handleSaveError(
                        error,
                    );
                },
            });
    }
    private handleSaveError(
        error:
            HttpErrorResponse,
    ): void {

        console.error(
            'SAVE DEPARTMENT ERROR:',
            error,
        );


        if (
            error.status ===
            400
        ) {

            this.errorMessage =
                error.error
                    ?.message ??
                'Dữ liệu phòng ban không hợp lệ.';

        } else if (
            error.status ===
            401
        ) {

            this.errorMessage =
                'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';

        } else if (
            error.status ===
            404
        ) {

            this.errorMessage =
                'Không tìm thấy phòng ban cần cập nhật.';

        } else if (
            error.status ===
            409
        ) {

            this.errorMessage =
                error.error
                    ?.message ??
                'Thông tin phòng ban đã tồn tại.';

        } else if (
            error.status ===
            0
        ) {

            this.errorMessage =
                'Không thể kết nối đến API phòng ban.';

        } else {

            this.errorMessage =
                error.error
                    ?.message ??
                'Không thể lưu thông tin phòng ban.';
        }


        this.showToast(
            this.errorMessage,
        );
    }
    retry():
        void {

        if (
            this.isCreateMode ||
            this.departmentId ===
            null ||
            this.isLoading
        ) {

            return;
        }


        this.loadDepartment();
    }
    cancel():
        void {

        if (
            this.isSaving
        ) {

            return;
        }


        if (
            !this.isCreateMode &&
            this.departmentId !==
            null
        ) {

            void this.router
                .navigate([
                    '/departments',
                    this.departmentId,
                ]);


            return;
        }


        void this.router
            .navigate([
                '/departments',
            ]);
    }

    private resetForm():
        void {

        this.form = {

            maPB:
                this.departmentId ??
                0,

            tenPB:
                '',

            moTa:
                '',

            trangThai:
                PHONG_BAN_TRANG_THAI
                    .DANG_HOAT_DONG,
        };


        this.submitted =
            false;
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
                2500,
            );
    }
}
