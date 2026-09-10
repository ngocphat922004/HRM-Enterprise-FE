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
    KHEN_THUONG_KY_LUAT_LOAI,
    KhenThuongKyLuatLoai,
} from '../../../core/constants/status.constants';

import {
    ExcelExportService,
} from '../../../core/services/excel-export.service';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    KhenThuongKyLuatService,
} from '../services/khen-thuong-ky-luat.service';

import {
    RewardsDisciplineDepartmentOption,
    RewardsDisciplineListItem,
    RewardsDisciplineListStats,
} from './rewards-discipline-list.model';

@Component({
    selector:
        'app-rewards-discipline-list',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './rewards-discipline-list.component.html',

    styleUrl:
        './rewards-discipline-list.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class RewardsDisciplineListComponent
    implements OnInit, OnDestroy {

    readonly rewardType =
        KHEN_THUONG_KY_LUAT_LOAI
            .KHEN_THUONG;

    readonly disciplineType =
        KHEN_THUONG_KY_LUAT_LOAI
            .KY_LUAT;

    years:
        number[] = [];

    departments:
        RewardsDisciplineDepartmentOption[] =
        [];

    records:
        RewardsDisciplineListItem[] =
        [];

    globalSearchTerm =
        '';

    selectedType:
        KhenThuongKyLuatLoai | '' =
        '';

    selectedYear:
        number | null =
        null;

    selectedDepartment:
        number | null =
        null;

    currentPage =
        1;

    pageSize =
        10;

    toastMessage =
        '';

    errorMessage =
        '';

    isLoading =
        false;

    deletingDecisionId:
        number | null =
        null;

    private toastTimer:
        ReturnType<
            typeof setTimeout
        > | null =
        null;

    constructor(
        private readonly router:
            Router,

        private readonly khenThuongKyLuatService:
            KhenThuongKyLuatService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly excelExportService:
            ExcelExportService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) {

        const currentYear =
            new Date()
                .getFullYear();

        this.selectedYear =
            currentYear;

        this.years =
            [currentYear];
    }

    ngOnInit():
        void {

        this.loadData();
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

    loadData():
        void {

        if (
            this.isLoading
        ) {

            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        forkJoin({

            decisions:
                this.khenThuongKyLuatService
                    .getAll(),

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
                    decisions,
                    employees,
                    departments,
                }) => {

                    this.departments =
                        departments.map(
                            (
                                department,
                            ) => ({

                                maPB:
                                    department.maPB,

                                tenPB:
                                    department.tenPB,

                            }),
                        );

                    this.records =
                        decisions.map(
                            (
                                decision,
                            ) => {

                                const employee =
                                    employees.find(
                                        (
                                            item,
                                        ) =>
                                            item.maNV ===
                                            decision.maNV,
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

                                const employeeExtra =
                                    employee as
                                    typeof employee & {

                                        tenPB?:
                                        string | null;

                                        tenCV?:
                                        string | null;

                                        email?:
                                        string | null;

                                        hinhAnh?:
                                        string | null;
                                    };

                                return {

                                    maKTKL:
                                        decision.maKTKL,

                                    maNV:
                                        decision.maNV,

                                    loai:
                                        decision.loai,

                                    lyDo:
                                        decision.lyDo,

                                    soTien:
                                        Number(
                                            decision.soTien ??
                                            0,
                                        ),

                                    ngayQuyetDinh:
                                        decision.ngayQuyetDinh,

                                    hoTen:
                                        employee?.hoTen ??
                                        `Nhân viên #${decision.maNV}`,

                                    email:
                                        employeeExtra
                                            ?.email ??
                                        null,

                                    hinhAnh:
                                        employeeExtra
                                            ?.hinhAnh ??
                                        null,

                                    maPB:
                                        employee?.maPB ??
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

                                } as
                                    RewardsDisciplineListItem;
                            },
                        );

                    this.records =
                        [
                            ...this.records,
                        ]
                            .sort(
                                (
                                    a,
                                    b,
                                ) => {

                                    const dateCompare =
                                        this.compareDateStrings(
                                            b.ngayQuyetDinh,
                                            a.ngayQuyetDinh,
                                        );

                                    if (
                                        dateCompare !==
                                        0
                                    ) {

                                        return dateCompare;
                                    }

                                    return (
                                        b.maKTKL -
                                        a.maKTKL
                                    );
                                },
                            );

                    this.years =
                        this.buildAvailableYears(
                            this.records,
                        );

                    this.currentPage =
                        1;

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        unknown,
                ) => {
                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải dữ liệu khen thưởng, kỷ luật.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    get filteredRecords():
        RewardsDisciplineListItem[] {

        const keyword =
            this.globalSearchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        return this.records
            .filter(
                (
                    record,
                ) => {

                    const decisionYear =
                        this.getDecisionYear(
                            record.ngayQuyetDinh,
                        );

                    const matchesKeyword =
                        !keyword ||

                        record.hoTen
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||

                        String(
                            record.maNV,
                        )
                            .includes(
                                keyword,
                            ) ||

                        this.formatDecisionCode(
                            record.maKTKL,
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||

                        (
                            record.lyDo ??
                            ''
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            );

                    const matchesType =
                        !this.selectedType ||

                        record.loai ===
                        this.selectedType;

                    const matchesYear =
                        this.selectedYear ===
                        null ||

                        decisionYear ===
                        this.selectedYear;

                    const matchesDepartment =
                        this.selectedDepartment ===
                        null ||

                        record.maPB ===
                        this.selectedDepartment;

                    return (
                        matchesKeyword &&
                        matchesType &&
                        matchesYear &&
                        matchesDepartment
                    );
                },
            );
    }

    get pagedRecords():
        RewardsDisciplineListItem[] {

        const startIndex =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this
            .filteredRecords
            .slice(
                startIndex,

                startIndex +
                this.pageSize,
            );
    }

    get totalPages():
        number {

        return Math.max(
            1,

            Math.ceil(
                this
                    .filteredRecords
                    .length /

                this.pageSize,
            ),
        );
    }

    get visiblePageNumbers():
        number[] {

        const pageCount =
            5;

        let startPage =
            Math.max(
                1,

                this.currentPage -
                Math.floor(
                    pageCount /
                    2,
                ),
            );

        let endPage =
            Math.min(
                this.totalPages,

                startPage +
                pageCount -
                1,
            );

        startPage =
            Math.max(
                1,

                endPage -
                pageCount +
                1,
            );

        return Array.from(
            {
                length:
                    endPage -
                    startPage +
                    1,
            },

            (
                _,
                index,
            ) =>
                startPage +
                index,
        );
    }

    get startItem():
        number {

        if (
            this
                .filteredRecords
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

    get endItem():
        number {

        return Math.min(
            this.currentPage *
            this.pageSize,

            this
                .filteredRecords
                .length,
        );
    }

    get stats():
        RewardsDisciplineListStats {

        return this
            .filteredRecords
            .reduce<
                RewardsDisciplineListStats
            >(
                (
                    result,
                    record,
                ) => ({

                    tongQuyetDinh:
                        result
                            .tongQuyetDinh +
                        1,

                    tongKhenThuong:
                        result
                            .tongKhenThuong +

                        (
                            record.loai ===
                                this.rewardType

                                ? 1

                                : 0
                        ),

                    tongKyLuat:
                        result
                            .tongKyLuat +

                        (
                            record.loai ===
                                this.disciplineType

                                ? 1

                                : 0
                        ),

                    tongSoTien:
                        result
                            .tongSoTien +

                        Number(
                            record.soTien ??
                            0,
                        ),

                }),

                {
                    tongQuyetDinh:
                        0,

                    tongKhenThuong:
                        0,

                    tongKyLuat:
                        0,

                    tongSoTien:
                        0,
                },
            );
    }

    applyFilters():
        void {

        this.currentPage =
            1;
    }

    resetFilters():
        void {

        this.globalSearchTerm =
            '';

        this.selectedType =
            '';

        this.selectedYear =
            null;

        this.selectedDepartment =
            null;

        this.currentPage =
            1;
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

    createDecision():
        void {

        if (
            this.isLoading ||
            this.deletingDecisionId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate([
                '/rewards-discipline',
                'add',
            ]);
    }

    viewDecision(
        record:
            RewardsDisciplineListItem,
    ): void {

        if (
            this.deletingDecisionId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate([
                '/rewards-discipline',
                record.maKTKL,
            ]);
    }

    editDecision(
        record:
            RewardsDisciplineListItem,
    ): void {

        if (
            this.deletingDecisionId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate([
                '/rewards-discipline',
                record.maKTKL,
                'edit',
            ]);
    }

    printDecision(
        record:
            RewardsDisciplineListItem,
    ): void {

        if (
            this.deletingDecisionId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate(
                [
                    '/rewards-discipline',
                    record.maKTKL,
                ],

                {
                    queryParams: {
                        print:
                            '1',
                    },
                },
            );
    }

    deleteDecision(
        record:
            RewardsDisciplineListItem,
    ): void {

        if (
            this.deletingDecisionId !==
            null
        ) {

            return;
        }

        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa quyết định ${this.formatDecisionCode(
                    record.maKTKL,
                )} của ${record.hoTen}?`,
            );

        if (
            !confirmed
        ) {

            return;
        }

        this.deletingDecisionId =
            record.maKTKL;

        this.khenThuongKyLuatService
            .delete(
                record.maKTKL,
            )
            .pipe(
                finalize(
                    () => {

                        this.deletingDecisionId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({

                next: () => {

                    this.records =
                        this.records
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.maKTKL !==
                                    record.maKTKL,
                            );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {

                        this.currentPage =
                            this.totalPages;
                    }

                    this.showToast(
                        `Đã xóa quyết định ${this.formatDecisionCode(
                            record.maKTKL,
                        )}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        unknown,
                ) => {
                    this.showToast(
                        this.getApiErrorMessage(
                            error,

                            'Không thể xóa quyết định.',
                        ),
                    );
                },
            });
    }

    isDeleting(
        record:
            RewardsDisciplineListItem,
    ): boolean {

        return (
            this.deletingDecisionId ===
            record.maKTKL
        );
    }

    exportReport():
        void {

        const data = this.filteredRecords.map((record) => ({
            'Mã quyết định': this.formatDecisionCode(record.maKTKL),
            'Mã nhân viên': `NV-${String(record.maNV).padStart(4, '0')}`,
            'Họ tên': record.hoTen,
            'Phòng ban': record.tenPB ?? 'Chưa phân phòng',
            'Chức vụ': record.tenCV ?? 'Chưa có chức vụ',
            'Loại': record.loai,
            'Lý do': record.lyDo ?? '',
            'Số tiền': record.soTien,
            'Ngày quyết định': this.formatExportDate(record.ngayQuyetDinh),
        }));

        if (!data.length) {
            this.showToast('Không có dữ liệu khen thưởng, kỷ luật để xuất.');
            return;
        }

        const suffix = this.selectedYear ?? this.getTodayFileName();

        this.excelExportService.exportToExcel(
            data,
            `khen-thuong-ky-luat-${suffix}`,
            'Khen thưởng - Kỷ luật',
        );

        this.showToast('Đã xuất danh sách khen thưởng, kỷ luật.');
    }

    formatDecisionCode(
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
        fullName:
            string,
    ): string {

        const words =
            fullName
                .trim()
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );

        if (
            words.length ===
            0
        ) {

            return 'NV';
        }

        if (
            words.length ===
            1
        ) {

            return words[0]
                .slice(
                    0,
                    2,
                )
                .toUpperCase();
        }

        return words
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

    private buildAvailableYears(
        records:
            RewardsDisciplineListItem[],
    ): number[] {

        const years =
            new Set<number>([
                new Date()
                    .getFullYear(),
            ]);

        records.forEach(
            record => {

                const year =
                    this.getDecisionYear(
                        record.ngayQuyetDinh,
                    );

                if (year !== null) {
                    years.add(year);
                }
            },
        );

        return Array.from(years)
            .sort(
                (first, second) =>
                    second - first,
            );
    }

    private getDecisionYear(
        date:
            string,
    ): number | null {

        if (
            !date
        ) {

            return null;
        }

        const year =
            Number(
                date
                    .slice(
                        0,
                        4,
                    ),
            );

        return Number.isInteger(
            year,
        )
            ? year
            : null;
    }

    private compareDateStrings(
        first:
            string,

        second:
            string,
    ): number {

        const firstTime =
            this.toDateTime(
                first,
            );

        const secondTime =
            this.toDateTime(
                second,
            );

        return (
            firstTime -
            secondTime
        );
    }

    private toDateTime(
        value:
            string,
    ): number {

        if (
            !value
        ) {

            return 0;
        }

        const parts =
            value
                .slice(
                    0,
                    10,
                )
                .split(
                    '-',
                )
                .map(
                    Number,
                );

        if (
            parts.length !==
            3
        ) {

            return 0;
        }

        const [
            year,
            month,
            day,
        ] =
            parts;

        if (
            !year ||
            !month ||
            !day
        ) {

            return 0;
        }

        return new Date(
            year,
            month - 1,
            day,
        )
            .getTime();
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
                    'Dữ liệu khen thưởng, kỷ luật không hợp lệ.'
                );

            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:

                return (
                    'Bạn không có quyền thực hiện thao tác này.'
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

    private formatExportDate(value: string): string {
        const normalized = value?.slice(0, 10) ?? '';
        const [year, month, day] = normalized.split('-');

        return year && month && day
            ? `${day}/${month}/${year}`
            : value;
    }

    private getTodayFileName(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
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