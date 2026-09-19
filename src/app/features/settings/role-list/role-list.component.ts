import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
    finalize,
    forkJoin,
} from 'rxjs';

import {
    resolveUserRole,
    RoleKey,
} from '../../../core/guards/role.guard';

import { StorageService } from '../../../core/services/storage.service';
import { QuyenService } from '../../accounts/services/quyen.service';
import { TaiKhoanService } from '../../accounts/services/tai-khoan.service';

import {
    RoleListItem,
    RoleListStats,
} from './role-list.model';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './role-list.component.html',
    styleUrl: './role-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleListComponent implements OnInit, OnDestroy {
    roles: RoleListItem[] = [];
    searchTerm = '';
    isLoading = false;
    errorMessage = '';
    toastMessage = '';
    currentPage = 1;

    readonly pageSize = 10;

    private currentRole: RoleKey | null = null;
    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly router: Router,
        private readonly quyenService: QuyenService,
        private readonly taiKhoanService: TaiKhoanService,
        private readonly storageService: StorageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.currentRole = resolveUserRole(
            this.storageService.getCurrentUser(),
        );

        this.loadPermissions();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get canViewRoles(): boolean {
        return this.isAdmin;
    }

    get canViewAccounts(): boolean {
        return this.isAdmin;
    }

    private get isAdmin(): boolean {
        return this.currentRole === 'admin';
    }

    get filteredRoles(): RoleListItem[] {
        const keyword = this.searchTerm
            .trim()
            .toLocaleLowerCase('vi');

        if (!keyword) {
            return this.roles;
        }

        return this.roles.filter((role) =>
            role.tenQuyen
                .toLocaleLowerCase('vi')
                .includes(keyword) ||
            (role.moTa ?? '')
                .toLocaleLowerCase('vi')
                .includes(keyword) ||
            this.formatRoleCode(role.maQuyen)
                .toLocaleLowerCase('vi')
                .includes(keyword),
        );
    }

    get pagedRoles(): RoleListItem[] {
        const startIndex =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredRoles.slice(
            startIndex,
            startIndex + this.pageSize,
        );
    }

    get stats(): RoleListStats {
        return this.roles.reduce<RoleListStats>(
            (result, role) => ({
                tongQuyen:
                    result.tongQuyen + 1,

                tongTaiKhoan:
                    result.tongTaiKhoan +
                    role.soTaiKhoan,

                quyenDangSuDung:
                    result.quyenDangSuDung +
                    (role.soTaiKhoan > 0 ? 1 : 0),

                quyenChuaSuDung:
                    result.quyenChuaSuDung +
                    (role.soTaiKhoan === 0 ? 1 : 0),
            }),
            {
                tongQuyen: 0,
                tongTaiKhoan: 0,
                quyenDangSuDung: 0,
                quyenChuaSuDung: 0,
            },
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredRoles.length /
                this.pageSize,
            ),
        );
    }

    get visiblePageNumbers(): number[] {
        const pageCount = 5;

        let startPage = Math.max(
            1,
            this.currentPage -
            Math.floor(pageCount / 2),
        );

        const endPage = Math.min(
            this.totalPages,
            startPage + pageCount - 1,
        );

        startPage = Math.max(
            1,
            endPage - pageCount + 1,
        );

        return Array.from(
            {
                length:
                    endPage -
                    startPage +
                    1,
            },
            (_, index) =>
                startPage + index,
        );
    }

    get startItem(): number {
        if (this.filteredRoles.length === 0) {
            return 0;
        }

        return (
            (this.currentPage - 1) *
            this.pageSize +
            1
        );
    }

    get endItem(): number {
        return Math.min(
            this.currentPage *
            this.pageSize,
            this.filteredRoles.length,
        );
    }

    applySearch(): void {
        this.currentPage = 1;
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.currentPage = 1;
    }

    goToPage(page: number): void {
        if (
            page < 1 ||
            page > this.totalPages
        ) {
            return;
        }

        this.currentPage = page;
    }

    viewRole(role: RoleListItem): void {
        if (
            !this.canViewRoles ||
            this.isLoading
        ) {
            return;
        }

        void this.router.navigate([
            '/settings/roles',
            role.maQuyen,
        ]);
    }

    retry(): void {
        if (this.isLoading) {
            return;
        }

        this.loadPermissions();
    }

    formatRoleCode(maQuyen: number): string {
        return `Q-${String(maQuyen).padStart(3, '0')}`;
    }

    private loadPermissions(): void {
        this.isLoading = true;
        this.errorMessage = '';

        if (!this.isAdmin) {
            this.roles = [];
            this.isLoading = false;
            this.errorMessage =
                'Chỉ Quản trị viên được phép xem danh sách quyền.';

            this.changeDetectorRef.markForCheck();
            return;
        }

        this.loadRoles();
    }

    private loadRoles(): void {
        if (!this.canViewRoles) {
            this.roles = [];
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            roles: this.quyenService.getAll(),
            accounts: this.taiKhoanService.getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ roles, accounts }) => {
                    this.roles = roles
                        .map((role) => ({
                            maQuyen: role.maQuyen,
                            tenQuyen: role.tenQuyen,
                            moTa: role.moTa ?? null,
                            soTaiKhoan: accounts.filter(
                                (account) =>
                                    account.maQuyen ===
                                    role.maQuyen,
                            ).length,
                        }))
                        .sort(
                            (a, b) =>
                                a.maQuyen - b.maQuyen,
                        );

                    this.currentPage = 1;
                    this.changeDetectorRef.markForCheck();
                },

                error: (error: HttpErrorResponse) => {
                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải danh sách quyền.',
                        );

                    this.showToast(this.errorMessage);
                },
            });
    }

    private getApiErrorMessage(
        error: HttpErrorResponse,
        fallback: string,
    ): string {
        const backendMessage =
            typeof error.error?.message === 'string'
                ? error.error.message
                : '';

        if (backendMessage) {
            return backendMessage;
        }

        const backendErrors = error.error?.errors;

        if (
            backendErrors &&
            typeof backendErrors === 'object'
        ) {
            const messages = Object.values(
                backendErrors as Record<
                    string,
                    unknown
                >,
            )
                .flatMap((value) => {
                    if (Array.isArray(value)) {
                        return value.map((item) =>
                            String(item),
                        );
                    }

                    return [String(value)];
                })
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join(' ');
            }
        }

        switch (error.status) {
            case 0:
                return 'Không thể kết nối đến hệ thống.';

            case 400:
                return 'Yêu cầu tải dữ liệu quyền không hợp lệ.';

            case 401:
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';

            case 403:
                return 'Bạn không có quyền xem dữ liệu quyền.';

            case 404:
                return 'Không tìm thấy dữ liệu quyền.';

            default:
                return fallback;
        }
    }

    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        this.toastTimer = setTimeout(() => {
            if (this.toastMessage === message) {
                this.toastMessage = '';
                this.toastTimer = null;
                this.changeDetectorRef.markForCheck();
            }
        }, 3500);
    }
}
