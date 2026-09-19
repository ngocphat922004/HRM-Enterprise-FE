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
    map,
    of,
} from 'rxjs';

import {
    HOP_DONG_TRANG_THAI,
    HopDongTrangThai,
} from '../../../core/constants/status.constants';

import {
    canManageContracts,
    canViewContracts,
    resolveUserRole,
} from '../../../core/guards/role.guard';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    HopDongService,
} from '../services/hop-dong.service';

import {
    CreateLoaiHopDongRequest,
    LoaiHopDong,
    UpdateLoaiHopDongRequest,
} from '../models/loai-hop-dong.model';

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

    managedContractTypes:
        LoaiHopDong[] = [];

    isContractTypeEditorOpen =
        false;

    editingContractTypeId:
        number | null =
        null;

    contractTypeForm:
        CreateLoaiHopDongRequest = {
            tenLoaiHD: '',
            moTa: null,
        };

    contractTypeSubmitted =
        false;

    isSavingContractType =
        false;

    deletingContractTypeId:
        number | null =
        null;

    constructor(
        private readonly router:
            Router,

        private readonly storageService:
            StorageService,

        private readonly hopDongService:
            HopDongService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.loadContracts();
    }

    /*
     * =========================================
     * PERMISSION
     * =========================================
     */

    get canViewContractList():
        boolean {

        const role =
            this.getCurrentRole();

        return canViewContracts(
            role,
        );
    }

    get canManageContractList():
        boolean {

        const role =
            this.getCurrentRole();

        return canManageContracts(
            role,
        );
    }

    get canCreateContracts():
        boolean {

        return this.canManageContractList;
    }

    get canEditContracts():
        boolean {

        return this.canManageContractList;
    }

    get canDeleteContracts():
        boolean {

        return this.canManageContractList;
    }

    get canManageContractTypes():
        boolean {

        return this.canManageContractList;
    }

    get contractTypeEditorTitle():
        string {

        return this.editingContractTypeId ===
            null
            ? 'Thêm loại hợp đồng'
            : 'Chỉnh sửa loại hợp đồng';
    }

    get contractTypeNameInvalid():
        boolean {

        if (
            !this.contractTypeSubmitted
        ) {
            return false;
        }

        const name =
            this.contractTypeForm
                .tenLoaiHD
                .trim();

        return (
            name.length <
            2 ||
            name.length >
            100
        );
    }

    /*
     * =========================================
     * LOAD DATA
     * =========================================
     */

    loadContracts():
        void {

        if (
            !this.canViewContractList
        ) {
            this.contracts = [];

            this.contractTypes = [];

            this.managedContractTypes =
                [];

            this.showToast(
                'Bạn không có quyền xem danh sách hợp đồng.',
            );

            return;
        }

        const role =
            this.getCurrentRole();

        const isEmployee =
            role ===
            'employee';

        this.isLoading =
            true;

        forkJoin({
            contracts:
                isEmployee
                    ? this.hopDongService
                        .getMe()
                    : this.hopDongService
                        .getAll(),

            contractTypes:
                isEmployee
                    ? of([])
                    : this.hopDongService
                        .getContractTypes(),

            employees:
                isEmployee
                    ? this.nhanVienService
                        .getMe()
                        .pipe(
                            map(
                                employee =>
                                    [employee],
                            ),
                        )
                    : this.nhanVienService
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
                    contracts,
                    contractTypes,
                    employees,
                }) => {

                    const scopedEmployees =
                        employees;

                    const scopedContracts =
                        contracts;

                    const displayContractTypes:
                        ContractTypeOption[] =
                        contractTypes.length >
                            0
                            ? contractTypes.map(
                                (
                                    item,
                                ) => ({
                                    maLoaiHD:
                                        item.maLoaiHD,

                                    tenLoaiHD:
                                        item.tenLoaiHD,
                                }),
                            )
                            : [
                                ...new Set(
                                    scopedContracts.map(
                                        contract =>
                                            contract.maLoaiHD,
                                    ),
                                ),
                            ].map(
                                maLoaiHD => ({
                                    maLoaiHD,

                                    tenLoaiHD:
                                        `Loại hợp đồng #${maLoaiHD}`,
                                }),
                            );

                    this.contractTypes =
                        displayContractTypes;

                    this.managedContractTypes =
                        contractTypes;

                    this.contracts =
                        scopedContracts
                            .map(
                                (
                                    contract,
                                ) => {

                                    const employee =
                                        scopedEmployees.find(
                                            (
                                                item,
                                            ) =>
                                                item.maNV ===
                                                contract.maNV,
                                        );

                                    const contractType =
                                        displayContractTypes.find(
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

                    this.managedContractTypes =
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
                            error.error?.message ??
                            `Không thể tải danh sách hợp đồng (${error.status}).`,
                        );
                    }

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    /*
     * =========================================
     * FILTER
     * =========================================
     */

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
                        this.formatContractCode(
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

                        employeeName.includes(
                            keyword,
                        ) ||

                        contractType.includes(
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
                index +
                1,
        );
    }

    get firstDisplayedRow():
        number {

        if (
            this
                .filteredContracts
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

            this
                .filteredContracts
                .length,
        );
    }

    /*
     * =========================================
     * STATISTICS
     * =========================================
     */

    get expiringSoonCount():
        number {

        return this.contracts
            .filter(
                (
                    contract,
                ) =>
                    this.isExpiringSoon(
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

    /*
     * =========================================
     * FILTER ACTIONS
     * =========================================
     */

    applyFilters():
        void {

        this.currentPage =
            1;
    }

    resetFilters():
        void {

        this.searchTerm =
            '';

        this.selectedContractType =
            '';

        this.selectedStatus =
            '';

        this.currentPage =
            1;
    }

    /*
     * =========================================
     * PAGINATION
     * =========================================
     */

    goToPage(
        page:
            number,
    ): void {

        if (
            page <
            1 ||

            page >
            this.totalPages
        ) {
            return;
        }

        this.currentPage =
            page;
    }

    /*
     * =========================================
     * ADD CONTRACT
     * =========================================
     */

    addContract():
        void {

        if (
            !this.canCreateContracts
        ) {
            this.showToast(
                'Bạn không có quyền thêm hợp đồng.',
            );

            return;
        }

        if (
            this.isLoading
        ) {
            return;
        }

        void this.router
            .navigate([
                '/contracts/add',
            ]);
    }

    /*
     * =========================================
     * CONTRACT TYPE MANAGEMENT
     * =========================================
     */

    openCreateContractType():
        void {

        if (
            !this.canManageContractTypes ||
            this.isLoading
        ) {
            if (
                !this.canManageContractTypes
            ) {
                this.showToast(
                    'Bạn không có quyền quản lý loại hợp đồng.',
                );
            }

            return;
        }

        this.editingContractTypeId =
            null;

        this.contractTypeForm = {
            tenLoaiHD: '',
            moTa: null,
        };

        this.contractTypeSubmitted =
            false;

        this.isContractTypeEditorOpen =
            true;
    }

    openEditContractType(
        contractType:
            LoaiHopDong,
    ): void {

        if (
            !this.canManageContractTypes ||
            this.isLoading
        ) {
            if (
                !this.canManageContractTypes
            ) {
                this.showToast(
                    'Bạn không có quyền chỉnh sửa loại hợp đồng.',
                );
            }

            return;
        }

        this.editingContractTypeId =
            contractType.maLoaiHD;

        this.contractTypeForm = {
            tenLoaiHD:
                contractType.tenLoaiHD,
            moTa:
                contractType.moTa,
        };

        this.contractTypeSubmitted =
            false;

        this.isContractTypeEditorOpen =
            true;
    }

    closeContractTypeEditor():
        void {

        if (
            this.isSavingContractType
        ) {
            return;
        }

        this.isContractTypeEditorOpen =
            false;

        this.editingContractTypeId =
            null;

        this.contractTypeSubmitted =
            false;

        this.contractTypeForm = {
            tenLoaiHD: '',
            moTa: null,
        };
    }

    saveContractType():
        void {

        if (
            !this.canManageContractTypes ||
            this.isSavingContractType
        ) {
            if (
                !this.canManageContractTypes
            ) {
                this.showToast(
                    'Bạn không có quyền quản lý loại hợp đồng.',
                );
            }

            return;
        }

        this.contractTypeSubmitted =
            true;

        const name =
            this.contractTypeForm
                .tenLoaiHD
                .trim();

        if (
            name.length <
            2 ||
            name.length >
            100
        ) {
            this.showToast(
                'Tên loại hợp đồng phải từ 2 đến 100 ký tự.',
            );

            return;
        }

        const duplicate =
            this.managedContractTypes
                .some(
                    item =>
                        item.maLoaiHD !==
                        this.editingContractTypeId &&
                        item.tenLoaiHD
                            .trim()
                            .toLocaleLowerCase(
                                'vi',
                            ) ===
                        name
                            .toLocaleLowerCase(
                                'vi',
                            ),
                );

        if (
            duplicate
        ) {
            this.showToast(
                'Tên loại hợp đồng đã tồn tại.',
            );

            return;
        }

        const description =
            this.contractTypeForm
                .moTa
                ?.trim() ??
            '';

        if (
            description.length >
            255
        ) {
            this.showToast(
                'Mô tả loại hợp đồng không được vượt quá 255 ký tự.',
            );

            return;
        }

        const payload:
            UpdateLoaiHopDongRequest = {
            tenLoaiHD:
                name,
            moTa:
                description ||
                null,
        };

        const editingId =
            this.editingContractTypeId;

        const request$ =
            editingId ===
                null
                ? this.hopDongService
                    .createContractType(
                        payload,
                    )
                : this.hopDongService
                    .updateContractType(
                        editingId,
                        payload,
                    );

        this.isSavingContractType =
            true;

        request$
            .pipe(
                finalize(
                    () => {
                        this.isSavingContractType =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: () => {
                    const message =
                        editingId ===
                            null
                            ? 'Thêm loại hợp đồng thành công.'
                            : 'Cập nhật loại hợp đồng thành công.';

                    this.isContractTypeEditorOpen =
                        false;

                    this.editingContractTypeId =
                        null;

                    this.contractTypeSubmitted =
                        false;

                    this.contractTypeForm = {
                        tenLoaiHD: '',
                        moTa: null,
                    };

                    this.showToast(
                        message,
                    );

                    this.loadContracts();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    console.error(
                        'SAVE CONTRACT TYPE ERROR:',
                        error,
                    );

                    this.showToast(
                        this.getContractTypeErrorMessage(
                            error,
                            editingId ===
                                null
                                ? 'Không thể thêm loại hợp đồng.'
                                : 'Không thể cập nhật loại hợp đồng.',
                        ),
                    );
                },
            });
    }

    deleteContractType(
        contractType:
            LoaiHopDong,
    ): void {

        if (
            !this.canManageContractTypes ||
            this.deletingContractTypeId !==
            null
        ) {
            if (
                !this.canManageContractTypes
            ) {
                this.showToast(
                    'Bạn không có quyền xóa loại hợp đồng.',
                );
            }

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa loại hợp đồng "${contractType.tenLoaiHD}"?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.deletingContractTypeId =
            contractType.maLoaiHD;

        this.hopDongService
            .deleteContractType(
                contractType.maLoaiHD,
            )
            .pipe(
                finalize(
                    () => {
                        this.deletingContractTypeId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: () => {
                    this.showToast(
                        'Xóa loại hợp đồng thành công.',
                    );

                    this.loadContracts();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    console.error(
                        'DELETE CONTRACT TYPE ERROR:',
                        error,
                    );

                    this.showToast(
                        this.getContractTypeErrorMessage(
                            error,
                            'Không thể xóa loại hợp đồng.',
                        ),
                    );
                },
            });
    }

    /*
     * =========================================
     * FORMAT
     * =========================================
     */

    formatContractCode(
        maHD:
            number,
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

    /*
     * =========================================
     * VIEW
     * =========================================
     */

    viewContract(
        contract:
            ContractListItem,
    ): void {

        if (
            !this.canViewContractList
        ) {
            this.showToast(
                'Bạn không có quyền xem hợp đồng.',
            );

            return;
        }

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

    /*
     * =========================================
     * EDIT
     * =========================================
     */

    editContract(
        contract:
            ContractListItem,
    ): void {

        if (
            !this.canEditContracts
        ) {
            this.showToast(
                'Bạn chỉ có quyền xem hợp đồng.',
            );

            return;
        }

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

    /*
     * =========================================
     * DELETE
     * =========================================
     */

    deleteContract(
        contract:
            ContractListItem,
    ): void {

        if (
            !this.canDeleteContracts
        ) {
            this.showToast(
                'Bạn không có quyền xóa hợp đồng.',
            );

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa ${this.formatContractCode(
                        contract.maHD,
                    )}?`,
                );

        if (
            !confirmed
        ) {
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

    /*
     * =========================================
     * EXPORT
     * =========================================
     */

    exportContracts():
        void {

        if (
            !this.canViewContractList
        ) {
            this.showToast(
                'Bạn không có quyền xuất danh sách hợp đồng.',
            );

            return;
        }

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

    /*
     * =========================================
     * PRIVATE
     * =========================================
     */

    private getCurrentRole() {

        const currentUser =
            this.storageService
                .getCurrentUser();

        return resolveUserRole(
            currentUser,
        );
    }

    private getContractTypeErrorMessage(
        error:
            HttpErrorResponse,
        fallback:
            string,
    ): string {

        if (
            error.status ===
            401
        ) {
            return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
        }

        if (
            error.status ===
            403
        ) {
            return 'Bạn không có quyền quản lý loại hợp đồng.';
        }

        if (
            error.status ===
            404
        ) {
            return 'Không tìm thấy loại hợp đồng.';
        }

        if (
            error.status ===
            409
        ) {
            return (
                error.error
                    ?.message ??
                'Không thể xóa loại hợp đồng vì đang được sử dụng.'
            );
        }

        if (
            error.status ===
            0
        ) {
            return 'Không thể kết nối đến API loại hợp đồng.';
        }

        return (
            error.error
                ?.message ??
            fallback
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
        message:
            string,
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