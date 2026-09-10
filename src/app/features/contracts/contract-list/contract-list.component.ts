import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';
import {
    finalize,
    forkJoin,
} from 'rxjs';

import {
    HOP_DONG_TRANG_THAI,
    HopDongTrangThai,
} from '../../../core/constants/status.constants';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    HopDongService,
} from '../services/hop-dong.service';

import {
    ContractListItem,
    ContractTypeOption,
} from './contract-list.model';

@Component({
    selector: 'app-contract-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './contract-list.component.html',
    styleUrl:
        './contract-list.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class ContractListComponent
    implements OnInit {

    searchTerm = '';

    selectedContractType = '';

    selectedStatus:
        HopDongTrangThai | '' = '';

    currentPage = 1;
    pageSize = 10;

    toastMessage = '';

    isLoading = false;

    readonly contractStatus =
        HOP_DONG_TRANG_THAI;

    contracts:
        ContractListItem[] = [];

    contractTypes:
        ContractTypeOption[] = [];

    constructor(
        private readonly router:
            Router,

        private readonly hopDongService:
            HopDongService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadContracts();
    }
    loadContracts(): void {
        this.isLoading = true;

        forkJoin({
            contracts:
                this.hopDongService
                    .getAll(),

            contractTypes:
                this.hopDongService
                    .getContractTypes(),

            employees:
                this.nhanVienService
                    .getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading =
                        false;

                    this.changeDetectorRef
                        .markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    contracts,
                    contractTypes,
                    employees,
                }) => {

                    this.contractTypes =
                        contractTypes.map(
                            (
                                item,
                            ) => ({
                                maLoaiHD:
                                    item.maLoaiHD,

                                tenLoaiHD:
                                    item.tenLoaiHD,
                            }),
                        );

                    this.contracts =
                        contracts.map(
                            (
                                contract,
                            ) => {

                                const employee =
                                    employees.find(
                                        (
                                            item,
                                        ) =>
                                            item.maNV ===
                                            contract.maNV,
                                    );

                                const contractType =
                                    contractTypes.find(
                                        (
                                            item,
                                        ) =>
                                            item.maLoaiHD ===
                                            contract.maLoaiHD,
                                    );

                                return {
                                    maHD:
                                        contract.maHD,

                                    maNV:
                                        contract.maNV,

                                    tenNV:
                                        employee
                                            ?.hoTen ??
                                        `Nhân viên #${contract.maNV}`,

                                    maLoaiHD:
                                        contract.maLoaiHD,

                                    tenLoaiHD:
                                        contractType
                                            ?.tenLoaiHD ??
                                        `Loại hợp đồng #${contract.maLoaiHD}`,

                                    ngayBatDau:
                                        contract.ngayBatDau,

                                    ngayKetThuc:
                                        contract.ngayKetThuc,

                                    luongCoBan:
                                        contract.luongCoBan,

                                    trangThai:
                                        contract.trangThai as
                                        HopDongTrangThai,
                                };
                            },
                        );

                    this.currentPage =
                        1;

                    console.log(
                        'HOP DONG API:',
                        contracts,
                    );

                    console.log(
                        'LOAI HOP DONG API:',
                        contractTypes,
                    );

                    console.log(
                        'HOP DONG SAU KHI GHEP:',
                        this.contracts,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD CONTRACTS ERROR:',
                        error,
                    );

                    this.contracts =
                        [];

                    this.contractTypes =
                        [];

                    if (
                        error.status ===
                        401
                    ) {
                        this.showToast(
                            'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
                        );

                    } else if (
                        error.status ===
                        403
                    ) {
                        this.showToast(
                            'Bạn không có quyền xem danh sách hợp đồng.',
                        );

                    } else if (
                        error.status ===
                        0
                    ) {
                        this.showToast(
                            'Không thể kết nối đến API hợp đồng.',
                        );

                    } else {
                        this.showToast(
                            `Không thể tải danh sách hợp đồng (${error.status}).`,
                        );
                    }
                },
            });
    }

    get filteredContracts():
        ContractListItem[] {

        const keyword =
            this.searchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        return this.contracts
            .filter(
                (
                    contract,
                ) => {

                    const code =
                        this
                            .formatContractCode(
                                contract.maHD,
                            )
                            .toLocaleLowerCase(
                                'vi',
                            );

                    const employeeName =
                        (
                            contract.tenNV ??
                            ''
                        )
                            .toLocaleLowerCase(
                                'vi',
                            );

                    const contractType =
                        (
                            contract.tenLoaiHD ??
                            ''
                        )
                            .toLocaleLowerCase(
                                'vi',
                            );

                    const matchesKeyword =
                        !keyword ||
                        code.includes(
                            keyword,
                        ) ||
                        employeeName
                            .includes(
                                keyword,
                            ) ||
                        contractType
                            .includes(
                                keyword,
                            );

                    const matchesType =
                        !this
                            .selectedContractType ||
                        contract.maLoaiHD ===
                        Number(
                            this
                                .selectedContractType,
                        );

                    const matchesStatus =
                        !this
                            .selectedStatus ||
                        contract.trangThai ===
                        this
                            .selectedStatus;

                    return (
                        matchesKeyword &&
                        matchesType &&
                        matchesStatus
                    );
                },
            );
    }

    get paginatedContracts():
        ContractListItem[] {

        const start =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this
            .filteredContracts
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
                this
                    .filteredContracts
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
            this
                .filteredContracts
                .length === 0
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

            this
                .filteredContracts
                .length,
        );
    }
    get expiringSoonCount():
        number {

        return this.contracts
            .filter(
                (
                    contract,
                ) =>
                    this
                        .isExpiringSoon(
                            contract,
                        ),
            )
            .length;
    }

    get expiredContractCount():
        number {

        return this.contracts
            .filter(
                (
                    contract,
                ) =>
                    contract
                        .trangThai ===
                    HOP_DONG_TRANG_THAI
                        .HET_HIEU_LUC,
            )
            .length;
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';

        this.selectedContractType =
            '';

        this.selectedStatus =
            '';

        this.currentPage = 1;
    }

    goToPage(
        page: number,
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

    formatContractCode(
        maHD: number,
    ): string {

        return `HD-${maHD
            .toString()
            .padStart(
                5,
                '0',
            )}`;
    }

    isExpiringSoon(
        contract:
            ContractListItem,
    ): boolean {

        if (
            !contract
                .ngayKetThuc ||
            contract
                .trangThai !==
            HOP_DONG_TRANG_THAI
                .CON_HIEU_LUC
        ) {
            return false;
        }

        const today =
            new Date();

        const endDate =
            new Date(
                contract
                    .ngayKetThuc,
            );

        today.setHours(
            0,
            0,
            0,
            0,
        );

        endDate.setHours(
            0,
            0,
            0,
            0,
        );

        const millisecondsPerDay =
            1000 *
            60 *
            60 *
            24;

        const remainingDays =
            Math.ceil(
                (
                    endDate
                        .getTime() -
                    today
                        .getTime()
                ) /
                millisecondsPerDay,
            );

        return (
            remainingDays >=
            0 &&
            remainingDays <=
            30
        );
    }

    viewContract(
        contract:
            ContractListItem,
    ): void {

        void this.router
            .navigate(
                [
                    '/contracts',
                    contract.maHD,
                ],
                {
                    state: {
                        contract,
                    },
                },
            );
    }

    editContract(
        contract:
            ContractListItem,
    ): void {

        void this.router
            .navigate(
                [
                    '/contracts',
                    contract.maHD,
                    'edit',
                ],
                {
                    state: {
                        contract,
                    },
                },
            );
    }
    deleteContract(
        contract:
            ContractListItem,
    ): void {

        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa ${this.formatContractCode(
                    contract.maHD,
                )}?`,
            );

        if (!confirmed) {
            return;
        }

        this.hopDongService
            .delete(
                contract.maHD,
            )
            .subscribe({
                next: () => {

                    this.contracts =
                        this.contracts
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.maHD !==
                                    contract.maHD,
                            );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {
                        this.currentPage =
                            this.totalPages;
                    }

                    this.showToast(
                        'Xóa hợp đồng thành công.',
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'DELETE CONTRACT ERROR:',
                        error,
                    );

                    if (
                        error.status ===
                        401
                    ) {
                        this.showToast(
                            'Phiên đăng nhập đã hết hạn.',
                        );

                    } else if (
                        error.status ===
                        403
                    ) {
                        this.showToast(
                            'Bạn không có quyền xóa hợp đồng.',
                        );

                    } else if (
                        error.status ===
                        404
                    ) {
                        this.showToast(
                            'Không tìm thấy hợp đồng.',
                        );

                    } else if (
                        error.status ===
                        409
                    ) {
                        this.showToast(
                            error.error
                                ?.message ??
                            'Không thể xóa hợp đồng vì đang có dữ liệu liên quan.',
                        );

                    } else {
                        this.showToast(
                            error.error
                                ?.message ??
                            'Không thể xóa hợp đồng.',
                        );
                    }

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    exportContracts():
        void {

        if (
            this.isLoading
        ) {

            return;
        }


        if (
            this.filteredContracts
                .length ===
            0
        ) {

            this.showToast(
                'Không có dữ liệu hợp đồng để xuất.',
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
                    'Mã hợp đồng',
                    'Mã nhân viên',
                    'Nhân viên',
                    'Loại hợp đồng',
                    'Ngày bắt đầu',
                    'Ngày kết thúc',
                    'Lương cơ bản',
                    'Trạng thái',
                ],

                ...this.filteredContracts
                    .map(
                        (
                            contract,
                        ) => [
                                this.formatContractCode(
                                    contract.maHD,
                                ),

                                contract.maNV,

                                contract.tenNV,

                                contract.tenLoaiHD,

                                contract.ngayBatDau,

                                contract.ngayKetThuc ??
                                '',

                                contract.luongCoBan,

                                contract.trangThai,
                            ],
                    ),
            ];


        const csv =
            rows
                .map(
                    (
                        row,
                    ) =>
                        row
                            .map(
                                (
                                    value,
                                ) =>
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
            'danh-sach-hop-dong.csv';


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
            'Đã xuất danh sách hợp đồng.',
        );
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

    private showToast(
        message: string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        window.setTimeout(
            () => {
                this.toastMessage =
                    '';

                this.changeDetectorRef
                    .markForCheck();
            },
            2800,
        );
    }
}
