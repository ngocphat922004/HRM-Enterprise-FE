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
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
    forkJoin,
} from 'rxjs';

import {
    NhanVienChiTiet,
} from '../models/nhan-vien.model';

import {
    ChucVuService,
} from '../services/chuc-vu.service';

import {
    NhanVienService,
} from '../services/nhan-vien.service';

import {
    PositionListItem,
    PositionStaffingFilter,
} from './position-list.model';

@Component({
    selector: 'app-position-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './position-list.component.html',
    styleUrl:
        './position-list.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class PositionListComponent
    implements OnInit, OnDestroy {

    searchTerm = '';

    selectedStaffing:
        PositionStaffingFilter = '';

    currentPage = 1;

    pageSize = 5;

    positions:
        PositionListItem[] = [];

    isLoading = false;

    errorMessage = '';

    deletingPositionId:
        number | null = null;

    toastMessage = '';

    private toastTimer:
        ReturnType<typeof setTimeout> |
        null = null;

    constructor(
        private readonly router:
            Router,

        private readonly chucVuService:
            ChucVuService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadPositions();
    }

    ngOnDestroy(): void {
        if (
            this.toastTimer
        ) {
            clearTimeout(
                this.toastTimer,
            );
        }
    }

    get filteredPositions():
        PositionListItem[] {

        const keyword =
            this.searchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        return this.positions
            .filter(
                position => {
                    const matchesKeyword =
                        !keyword ||
                        position.tenCV
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||
                        (
                            position.moTa ??
                            ''
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||
                        this.formatPositionCode(
                            position.maCV,
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            );

                    const matchesStaffing =
                        !this.selectedStaffing ||
                        (
                            this.selectedStaffing ===
                                'filled'
                                ? position.employeeCount >
                                0
                                : position.employeeCount ===
                                0
                        );

                    return (
                        matchesKeyword &&
                        matchesStaffing
                    );
                },
            );
    }

    get paginatedPositions():
        PositionListItem[] {

        const start =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this.filteredPositions
            .slice(
                start,
                start +
                this.pageSize,
            );
    }

    get totalPages():
        number {

        return Math.max(
            1,
            Math.ceil(
                this.filteredPositions
                    .length /
                this.pageSize,
            ),
        );
    }

    get visiblePages():
        number[] {

        return Array.from(
            {
                length:
                    this.totalPages,
            },
            (
                _,
                index,
            ) =>
                index + 1,
        );
    }

    get firstDisplayedRow():
        number {

        if (
            this.filteredPositions
                .length ===
            0
        ) {
            return 0;
        }

        return (
            (
                this.currentPage -
                1
            ) *
            this.pageSize +
            1
        );
    }

    get lastDisplayedRow():
        number {

        return Math.min(
            this.currentPage *
            this.pageSize,
            this.filteredPositions
                .length,
        );
    }

    get vacantPositionCount():
        number {

        return this.positions
            .filter(
                position =>
                    position.employeeCount ===
                    0,
            )
            .length;
    }

    get staffedPositionRate():
        number {

        if (
            this.positions.length ===
            0
        ) {
            return 0;
        }

        const staffed =
            this.positions.length -
            this.vacantPositionCount;

        return Math.round(
            (
                staffed /
                this.positions.length
            ) *
            100,
        );
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedStaffing = '';
        this.currentPage = 1;
    }

    goToPage(
        page:
            number,
    ): void {

        if (
            page < 1 ||
            page >
            this.totalPages
        ) {
            return;
        }

        this.currentPage =
            page;
    }

    formatPositionCode(
        maCV:
            number,
    ): string {

        return `CV-${maCV
            .toString()
            .padStart(
                3,
                '0',
            )}`;
    }

    viewPosition(
        position:
            PositionListItem,
    ): void {

        if (
            this.deletingPositionId !==
            null
        ) {
            return;
        }

        void this.router
            .navigate(
                [
                    '/positions',
                    position.maCV,
                ],
                {
                    state: {
                        position,
                    },
                },
            );
    }

    editPosition(
        position:
            PositionListItem,
    ): void {

        if (
            this.deletingPositionId !==
            null
        ) {
            return;
        }

        void this.router
            .navigate([
                '/positions',
                position.maCV,
                'edit',
            ]);
    }

    deletePosition(
        position:
            PositionListItem,
    ): void {

        if (
            this.deletingPositionId !==
            null
        ) {
            return;
        }

        if (
            position.employeeCount >
            0
        ) {
            this.showToast(
                'Không thể xóa chức vụ đang được nhân viên sử dụng.',
            );

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa chức vụ "${position.tenCV}"?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.deletingPositionId =
            position.maCV;

        this.errorMessage = '';

        this.changeDetectorRef
            .markForCheck();

        this.chucVuService
            .delete(
                position.maCV,
            )
            .pipe(
                finalize(
                    () => {
                        this.deletingPositionId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: () => {
                    this.positions =
                        this.positions
                            .filter(
                                item =>
                                    item.maCV !==
                                    position.maCV,
                            );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {
                        this.currentPage =
                            this.totalPages;
                    }

                    this.showToast(
                        `Đã xóa chức vụ ${position.tenCV}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    console.error(
                        'DELETE POSITION ERROR:',
                        error,
                    );

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể xóa chức vụ.',
                        ),
                    );
                },
            });
    }

    retry(): void {
        if (
            this.isLoading
        ) {
            return;
        }

        this.loadPositions();
    }

    exportReport(): void {
        if (
            this.isLoading
        ) {
            return;
        }

        if (
            this.filteredPositions
                .length ===
            0
        ) {
            this.showToast(
                'Không có dữ liệu chức vụ để xuất.',
            );

            return;
        }

        if (
            typeof window ===
            'undefined' ||
            typeof document ===
            'undefined'
        ) {
            return;
        }

        const rows:
            Array<
                Array<
                    string | number
                >
            > = [
                [
                    'Mã chức vụ',
                    'Tên chức vụ',
                    'Mô tả',
                    'Số nhân viên',
                ],

                ...this.filteredPositions
                    .map(
                        position => [
                            this.formatPositionCode(
                                position.maCV,
                            ),
                            position.tenCV,
                            position.moTa ??
                            '',
                            position.employeeCount,
                        ],
                    ),
            ];

        const csv =
            rows
                .map(
                    row =>
                        row
                            .map(
                                value =>
                                    this.escapeCsvValue(
                                        value,
                                    ),
                            )
                            .join(
                                ',',
                            ),
                )
                .join(
                    '\r\n',
                );

        const blob =
            new Blob(
                [
                    '\uFEFF',
                    csv,
                ],
                {
                    type:
                        'text/csv;charset=utf-8;',
                },
            );

        const url =
            URL.createObjectURL(
                blob,
            );

        const link =
            document.createElement(
                'a',
            );

        link.href =
            url;

        link.download =
            'danh-sach-chuc-vu.csv';

        document.body
            .appendChild(
                link,
            );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url,
        );

        this.showToast(
            'Đã xuất danh sách chức vụ.',
        );
    }

    private loadPositions():
        void {

        this.isLoading = true;

        this.errorMessage = '';

        forkJoin({
            positions:
                this.chucVuService
                    .getAll(),

            employees:
                this.nhanVienService
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
                    positions,
                    employees,
                }) => {
                    this.positions =
                        positions
                            .map(
                                position => ({
                                    maCV:
                                        position.maCV,

                                    tenCV:
                                        position.tenCV,

                                    moTa:
                                        position.moTa,

                                    employeeCount:
                                        this.countEmployeesByPosition(
                                            employees,
                                            position.maCV,
                                        ),
                                }),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.maCV -
                                    b.maCV,
                            );

                    this.currentPage =
                        1;

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    console.error(
                        'LOAD POSITIONS ERROR:',
                        error,
                    );

                    this.positions = [];

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải danh sách chức vụ.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private countEmployeesByPosition(
        employees:
            NhanVienChiTiet[],

        maCV:
            number,
    ): number {

        return employees
            .filter(
                employee =>
                    employee.maCV ===
                    maCV,
            )
            .length;
    }

    private escapeCsvValue(
        value:
            string | number,
    ): string {

        const text =
            String(
                value ??
                '',
            );

        return `"${text.replace(
            /"/g,
            '""',
        )}"`;
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
                        value => {
                            if (
                                Array.isArray(
                                    value,
                                )
                            ) {
                                return value.map(
                                    item =>
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
                return 'Không thể kết nối đến Backend.';

            case 400:
                return 'Dữ liệu chức vụ không hợp lệ.';

            case 401:
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';

            case 403:
                return 'Bạn không có quyền thực hiện thao tác này.';

            case 404:
                return 'Không tìm thấy chức vụ.';

            case 409:
                return 'Không thể xóa chức vụ vì đang có dữ liệu liên quan.';

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
                3000,
            );
    }
}