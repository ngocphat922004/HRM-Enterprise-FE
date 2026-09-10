import { DOCUMENT, CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Inject,
    OnInit,
    Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MA_QUYEN } from '../../../core/constants/role.constants';
import { StorageService } from '../../../core/services/storage.service';
import { Quyen } from '../../../features/accounts/models/quyen.model';
import { QuyenService } from '../../../features/accounts/services/quyen.service';
import { NhanVien } from '../../../features/employees/models/nhan-vien.model';
import { NhanVienService } from '../../../features/employees/services/nhan-vien.service';
import { AiChatComponent } from '../ai-chat/ai-chat.component';

@Component({
    selector: 'app-header-user',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, AiChatComponent],
    templateUrl: './header-user.component.html',
    styleUrl: './header-user.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderUserComponent implements OnInit {
    @Output() readonly sidebarToggle = new EventEmitter<void>();

    searchTerm = '';
    isMenuOpen = false;
    isAiChatOpen = false;
    isNotificationOpen = false;
    isDarkMode = false;
    isLoading = true;
    loadError = '';

    employee: NhanVien | null = null;
    role: Quyen | null = null;
    employeeId: number | null = null;
    currentRoleId = 0;

    displayName = '';
    roleName = '';
    username = '';
    avatarUrl = '';
    initials = 'TK';

    get canSearchEmployees(): boolean {
        return [
            MA_QUYEN.QUAN_TRI_VIEN,
            MA_QUYEN.NHAN_VIEN_NHAN_SU,
            MA_QUYEN.TRUONG_PHONG,
        ].includes(this.currentRoleId as 1 | 2 | 4);
    }

    get canAddEmployee(): boolean {
        return [
            MA_QUYEN.QUAN_TRI_VIEN,
            MA_QUYEN.NHAN_VIEN_NHAN_SU,
        ].includes(this.currentRoleId as 1 | 2);
    }

    get canOpenSettings(): boolean {
        return this.currentRoleId === MA_QUYEN.QUAN_TRI_VIEN;
    }

    constructor(
        private readonly router: Router,
        private readonly storageService: StorageService,
        private readonly nhanVienService: NhanVienService,
        private readonly quyenService: QuyenService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly elementRef: ElementRef<HTMLElement>,
        @Inject(DOCUMENT) private readonly document: Document,
    ) { }

    ngOnInit(): void {
        this.restoreTheme();
        this.loadCurrentUser();
    }

    openSidebar(): void {
        this.sidebarToggle.emit();
    }

    submitSearch(): void {
        const search = this.searchTerm.trim();

        void this.router.navigate(['/employees'], {
            queryParams: search ? { search } : {},
        });
    }

    toggleMenu(event: Event): void {
        event.stopPropagation();
        this.isMenuOpen = !this.isMenuOpen;
        this.isNotificationOpen = false;
    }

    toggleAiChat(event: Event): void {
        event.stopPropagation();
        this.isAiChatOpen = !this.isAiChatOpen;
        this.isMenuOpen = false;
        this.isNotificationOpen = false;
    }

    toggleNotifications(event: Event): void {
        event.stopPropagation();
        this.isNotificationOpen = !this.isNotificationOpen;
        this.isMenuOpen = false;
    }

    toggleDarkMode(): void {
        this.isDarkMode = !this.isDarkMode;
        this.document.documentElement.classList.toggle(
            'dark-theme',
            this.isDarkMode,
        );

        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'hrm_theme',
                this.isDarkMode ? 'dark' : 'light',
            );
        }
    }

    goToProfile(): void {
        this.closePopups();

        if (this.employeeId) {
            void this.router.navigate([
                '/employees',
                this.employeeId,
            ]);
            return;
        }

        void this.router.navigate(['/employees']);
    }

    goToSettings(): void {
        this.closePopups();

        if (!this.canOpenSettings) {
            return;
        }

        void this.router.navigate(['/settings']);
    }

    logout(): void {
        this.closePopups();
        this.storageService.clearAuthSession();
        void this.router.navigate(['/login']);
    }

    handleImageError(): void {
        this.avatarUrl = '';
        this.changeDetectorRef.markForCheck();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target;

        if (
            target instanceof Node &&
            !this.elementRef.nativeElement.contains(target)
        ) {
            this.closePopups();
        }
    }

    @HostListener('document:keydown.escape')
    closePopups(): void {
        this.isMenuOpen = false;
        this.isNotificationOpen = false;
        this.isAiChatOpen = false;
    }

    private loadCurrentUser(): void {
        const currentUser =
            this.storageService.getCurrentUser();

        this.username =
            currentUser?.tenDangNhap?.trim() || '';

        this.currentRoleId =
            Number(currentUser?.maQuyen) > 0
                ? Number(currentUser?.maQuyen)
                : 0;

        this.roleName =
            currentUser?.tenQuyen?.trim() || '';

        this.employeeId =
            Number(currentUser?.maNV) > 0
                ? Number(currentUser?.maNV)
                : null;

        this.displayName = this.username;
        this.initials =
            this.createInitials(
                this.displayName,
            );

        const employee$ =
            this.nhanVienService
                .getMe()
                .pipe(
                    catchError(
                        () => of(null),
                    ),
                );

        const role$ =
            Number(currentUser?.maQuyen) > 0
                ? this.quyenService
                    .getById(
                        Number(
                            currentUser?.maQuyen,
                        ),
                    )
                    .pipe(
                        catchError(
                            () => of(null),
                        ),
                    )
                : of(null);

        forkJoin({
            employee: employee$,
            role: role$,
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    employee,
                    role,
                }) => {
                    this.employee =
                        employee;

                    this.role =
                        role;

                    if (
                        employee &&
                        Number(employee.maNV) > 0
                    ) {
                        this.employeeId =
                            Number(
                                employee.maNV,
                            );
                    }

                    this.displayName =
                        employee?.hoTen?.trim() ||
                        this.username;

                    this.roleName =
                        role?.tenQuyen?.trim() ||
                        this.roleName;

                    this.avatarUrl =
                        this.normalizeImageUrl(
                            employee?.hinhAnh ??
                            null,
                        );

                    this.initials =
                        this.createInitials(
                            this.displayName,
                        );

                    if (
                        !employee &&
                        !currentUser
                    ) {
                        this.loadError =
                            'Không thể tải thông tin người dùng hiện tại.';
                    } else {
                        this.loadError = '';
                    }
                },
            });
    }

    private normalizeImageUrl(
        value: string | null,
    ): string {
        if (!value) {
            return '';
        }

        if (
            /^(https?:|data:|blob:)/i.test(
                value,
            )
        ) {
            return value;
        }

        return (
            environment.apiBaseUrl.replace(
                /\/$/,
                '',
            ) +
            '/' +
            value.replace(
                /^\//,
                '',
            )
        );
    }

    private createInitials(
        value: string,
    ): string {
        const words =
            value
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (words.length === 0) {
            return 'TK';
        }

        if (words.length === 1) {
            return words[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return words
            .slice(-2)
            .map(
                (word) =>
                    word.charAt(0),
            )
            .join('')
            .toUpperCase();
    }

    private restoreTheme(): void {
        if (
            typeof window ===
            'undefined'
        ) {
            return;
        }

        this.isDarkMode =
            localStorage.getItem(
                'hrm_theme',
            ) === 'dark';

        this.document.documentElement.classList.toggle(
            'dark-theme',
            this.isDarkMode,
        );
    }
}