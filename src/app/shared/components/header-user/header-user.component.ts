import {
    CommonModule,
    DOCUMENT,
} from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

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

import {
    FormsModule,
} from '@angular/forms';

import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    catchError,
    finalize,
    of,
} from 'rxjs';

import {
    environment,
} from '../../../../environments/environment';

import {
    canManageEmployees,
    canManageSettings,
    canUseAi,
    canViewEmployeeDirectory,
    resolveUserRole,
} from '../../../core/guards/role.guard';

import {
    ThongBao,
} from '../../../core/models/notification.model';

import {
    NotificationService,
} from '../../../core/services/notification.service';


import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    NhanVien,
} from '../../../features/employees/models/nhan-vien.model';

import {
    NhanVienService,
} from '../../../features/employees/services/nhan-vien.service';

import {
    AiChatComponent,
} from '../ai-chat/ai-chat.component';

@Component({
    selector:
        'app-header-user',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        AiChatComponent,
    ],

    templateUrl:
        './header-user.component.html',

    styleUrl:
        './header-user.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class HeaderUserComponent
    implements OnInit {

    @Output()
    readonly sidebarToggle =
        new EventEmitter<void>();

    searchTerm =
        '';

    isMenuOpen =
        false;

    isAiChatOpen =
        false;

    isNotificationOpen =
        false;

    isDarkMode =
        false;

    isLoading =
        true;

    loadError =
        '';

    isNotificationLoading =
        false;

    notificationError =
        '';

    notifications:
        ThongBao[] =
        [];

    employee:
        NhanVien | null =
        null;

    employeeId:
        number | null =
        null;

    currentRoleId =
        0;

    displayName =
        '';

    roleName =
        '';

    username =
        '';

    avatarUrl =
        '';

    initials =
        'TK';

    private notificationsLoaded =
        false;

    /*
     * =========================================
     * PERMISSION
     * =========================================
     */

    get canSearchEmployees():
        boolean {

        return canViewEmployeeDirectory(
            this.getCurrentRole(),
        );
    }

    get canAddEmployee():
        boolean {

        return canManageEmployees(
            this.getCurrentRole(),
        );
    }

    get canOpenSettings():
        boolean {

        return canManageSettings(
            this.getCurrentRole(),
        );
    }

    get canOpenAi():
        boolean {

        return canUseAi(
            this.getCurrentRole(),
        );
    }

    /*
     * Notification là API /me,
     * dùng cho mọi tài khoản đã đăng nhập hợp lệ.
     */
    get canOpenNotifications():
        boolean {

        return (
            this.getCurrentRole() !==
            null
        );
    }

    get unreadNotificationCount():
        number {

        return this.notifications
            .filter(
                notification =>
                    !notification.daDoc,
            )
            .length;
    }

    get hasUnreadNotifications():
        boolean {

        return (
            this.unreadNotificationCount >
            0
        );
    }

    constructor(
        private readonly router:
            Router,

        private readonly notificationService:
            NotificationService,

        private readonly storageService:
            StorageService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,

        private readonly elementRef:
            ElementRef<HTMLElement>,

        @Inject(DOCUMENT)
        private readonly document:
            Document,
    ) { }

    ngOnInit():
        void {

        this.restoreTheme();

        this.loadCurrentUser();

        if (
            this.canOpenNotifications &&
            !this.notificationsLoaded &&
            !this.isNotificationLoading
        ) {
            this.loadNotifications();
        }
    }

    /*
     * =========================================
     * SIDEBAR
     * =========================================
     */

    openSidebar():
        void {

        this.sidebarToggle
            .emit();
    }

    /*
     * =========================================
     * SEARCH
     * =========================================
     */

    submitSearch():
        void {

        if (
            !this.canSearchEmployees
        ) {
            return;
        }

        const search =
            this.searchTerm
                .trim();

        void this.router
            .navigate(
                [
                    '/employees',
                ],
                {
                    queryParams:
                        search
                            ? {
                                search,
                            }
                            : {},
                },
            );
    }

    /*
     * =========================================
     * PROFILE MENU
     * =========================================
     */

    toggleMenu(
        event:
            Event,
    ): void {

        event.stopPropagation();

        this.isMenuOpen =
            !this.isMenuOpen;

        this.isNotificationOpen =
            false;

        this.isAiChatOpen =
            false;
    }

    /*
     * =========================================
     * AI
     * =========================================
     */

    toggleAiChat(
        event:
            Event,
    ): void {

        event.stopPropagation();

        if (
            !this.canOpenAi
        ) {
            this.isAiChatOpen =
                false;

            return;
        }

        this.isAiChatOpen =
            !this.isAiChatOpen;

        this.isMenuOpen =
            false;

        this.isNotificationOpen =
            false;
    }

    /*
     * =========================================
     * NOTIFICATIONS
     * =========================================
     */

    toggleNotifications(
        event:
            Event,
    ): void {

        event.stopPropagation();

        if (
            !this.canOpenNotifications
        ) {
            this.isNotificationOpen =
                false;

            return;
        }

        this.isNotificationOpen =
            !this.isNotificationOpen;

        this.isMenuOpen =
            false;

        this.isAiChatOpen =
            false;

        if (
            this.isNotificationOpen &&
            !this.notificationsLoaded &&
            !this.isNotificationLoading
        ) {
            this.loadNotifications();
        }
    }

    retryNotifications():
        void {

        if (
            !this.canOpenNotifications ||
            this.isNotificationLoading
        ) {
            return;
        }

        this.notificationsLoaded =
            false;

        this.loadNotifications();
    }

    openNotification(
        notification:
            ThongBao,
    ): void {

        if (
            !this.canOpenNotifications
        ) {
            return;
        }

        if (
            notification.daDoc
        ) {
            return;
        }

        if (
            !Number.isInteger(
                notification.maThongBao,
            ) ||
            notification.maThongBao <=
            0
        ) {
            return;
        }

        const notificationId =
            notification.maThongBao;

        this.notificationService
            .markAsRead(
                notificationId,
            )
            .subscribe({
                next: () => {

                    this.notifications =
                        this.notifications
                            .map(
                                item =>
                                    item.maThongBao ===
                                        notificationId
                                        ? {
                                            ...item,
                                            daDoc: true,
                                        }
                                        : item,
                            );

                    this.notificationError =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'MARK NOTIFICATION AS READ ERROR:',
                        error,
                    );

                    this.notificationError =
                        this.getNotificationErrorMessage(
                            error,
                            'Không thể đánh dấu thông báo đã đọc.',
                        );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    private loadNotifications():
        void {

        if (
            !this.canOpenNotifications ||
            this.isNotificationLoading
        ) {
            return;
        }

        this.isNotificationLoading =
            true;

        this.notificationError =
            '';

        this.notificationService
            .getMine()
            .pipe(
                finalize(
                    () => {

                        this.isNotificationLoading =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    notifications:
                        ThongBao[],
                ) => {

                    this.notifications =
                        notifications;

                    this.notificationsLoaded =
                        true;

                    this.notificationError =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD NOTIFICATIONS ERROR:',
                        error,
                    );

                    this.notificationsLoaded =
                        false;

                    this.notificationError =
                        this.getNotificationErrorMessage(
                            error,
                            'Không thể tải danh sách thông báo.',
                        );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    private isRecord(
        value:
            unknown,
    ): value is
        Record<
            string,
            unknown
        > {

        return (
            value !==
            null &&
            typeof value ===
            'object' &&
            !Array.isArray(
                value,
            )
        );
    }

    private getNotificationErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

        const backendMessage =
            this.isRecord(
                error.error,
            ) &&
                typeof error.error[
                'message'
                ] ===
                'string'
                ? error.error[
                    'message'
                ].trim()
                : '';

        if (
            backendMessage
        ) {
            return backendMessage;
        }

        switch (
        error.status
        ) {
            case 0:
                return (
                    'Không thể kết nối đến hệ thống thông báo.'
                );

            case 401:
                return (
                    'Phiên đăng nhập đã hết hạn.'
                );

            case 403:
                return (
                    'Bạn không có quyền xem thông báo.'
                );

            case 404:
                return (
                    'Không tìm thấy thông báo.'
                );

            default:
                return fallback;
        }
    }

    /*
     * =========================================
     * THEME
     * =========================================
     */

    toggleDarkMode():
        void {

        this.isDarkMode =
            !this.isDarkMode;

        this.document
            .documentElement
            .classList
            .toggle(
                'dark-theme',
                this.isDarkMode,
            );

        if (
            typeof window !==
            'undefined'
        ) {
            localStorage
                .setItem(
                    'hrm_theme',
                    this.isDarkMode
                        ? 'dark'
                        : 'light',
                );
        }
    }

    /*
     * =========================================
     * PROFILE
     * =========================================
     */

    goToProfile():
        void {

        const employeeId =
            this.employeeId ??
            this.storageService
                .getCurrentEmployeeId();

        if (
            employeeId !==
            null &&
            Number.isInteger(
                employeeId,
            ) &&
            employeeId >
            0
        ) {
            this.closePopups();

            void this.router
                .navigate([
                    '/employees',
                    employeeId,
                ]);

            return;
        }

        /*
         * Không chuyển người dùng sang danh sách nhân viên
         * hoặc Dashboard khi tài khoản chưa xác định được
         * maNV. Đây là luồng "Hồ sơ cá nhân", nên cần báo
         * đúng nguyên nhân thay vì điều hướng sang một màn
         * hình khác không tương ứng.
         */
        this.loadError =
            'Tài khoản hiện tại chưa được liên kết với hồ sơ nhân viên hợp lệ.';

        this.isMenuOpen =
            true;

        this.changeDetectorRef
            .markForCheck();
    }

    goToSettings():
        void {

        this.closePopups();

        if (
            !this.canOpenSettings
        ) {
            return;
        }

        void this.router
            .navigate([
                '/settings',
            ]);
    }

    /*
     * =========================================
     * LOGOUT
     * =========================================
     */

    logout():
        void {

        this.closePopups();

        this.storageService
            .clearAuthSession();

        void this.router
            .navigate([
                '/login',
            ]);
    }

    /*
     * =========================================
     * AVATAR
     * =========================================
     */

    handleImageError():
        void {

        this.avatarUrl =
            '';

        this.changeDetectorRef
            .markForCheck();
    }

    /*
     * =========================================
     * CLOSE POPUPS
     * =========================================
     */

    @HostListener(
        'document:click',
        [
            '$event',
        ],
    )
    onDocumentClick(
        event:
            MouseEvent,
    ): void {

        const target =
            event.target;

        if (
            target instanceof Node &&
            !this.elementRef
                .nativeElement
                .contains(
                    target,
                )
        ) {
            this.closePopups();
        }
    }

    @HostListener(
        'document:keydown.escape',
    )
    closePopups():
        void {

        this.isMenuOpen =
            false;

        this.isNotificationOpen =
            false;

        this.isAiChatOpen =
            false;
    }

    /*
     * =========================================
     * CURRENT USER
     * =========================================
     */

    private loadCurrentUser():
        void {

        const currentUser =
            this.storageService
                .getCurrentUser();

        if (
            !currentUser
        ) {
            this.isLoading =
                false;

            this.loadError =
                'Không tìm thấy phiên đăng nhập.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.username =
            currentUser
                .tenDangNhap
                ?.trim() ||
            '';

        this.currentRoleId =
            this.storageService
                .getCurrentRoleId() ??
            0;

        this.roleName =
            currentUser
                .tenQuyen
                ?.trim() ||
            this.getFallbackRoleName(
                this.currentRoleId,
            );

        this.employeeId =
            this.storageService
                .getCurrentEmployeeId();

        this.displayName =
            this.username;

        this.initials =
            this.createInitials(
                this.displayName,
            );

        this.isLoading =
            true;

        this.loadError =
            '';

        /*
         * Tải notification bằng API /me
         * sau khi đã xác định được user/role.
         */
        if (
            this.canOpenNotifications
        ) {
            this.loadNotifications();
        }

        this.nhanVienService
            .getMe()
            .pipe(
                catchError(
                    error => {

                        console.error(
                            'HEADER - GET CURRENT EMPLOYEE ERROR:',
                            error,
                        );

                        return of(
                            null,
                        );
                    },
                ),

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
                    employee,
                ) => {

                    this.employee =
                        employee;

                    if (
                        employee &&
                        Number(
                            employee.maNV,
                        ) >
                        0
                    ) {
                        this.employeeId =
                            Number(
                                employee.maNV,
                            );
                    }

                    this.displayName =
                        employee
                            ?.hoTen
                            ?.trim() ||
                        this.username ||
                        'Tài khoản';

                    this.avatarUrl =
                        this.normalizeImageUrl(
                            employee
                                ?.hinhAnh ??
                            null,
                        );

                    this.initials =
                        this.createInitials(
                            this.displayName,
                        );

                    this.loadError =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    /*
     * =========================================
     * ROLE
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

    /*
     * =========================================
     * ROLE LABEL
     * =========================================
     */

    private getFallbackRoleName(
        roleId:
            number,
    ): string {

        switch (
        roleId
        ) {
            case 1:
                return (
                    'Quản trị viên'
                );

            case 2:
                return (
                    'Nhân viên nhân sự'
                );

            case 3:
                return (
                    'Kế toán'
                );

            case 4:
                return (
                    'Trưởng phòng'
                );

            case 5:
                return (
                    'Ban giám đốc'
                );

            case 6:
                return (
                    'Nhân viên'
                );

            default:
                return '';
        }
    }

    /*
     * =========================================
     * URL
     * =========================================
     */

    private get apiBaseUrl():
        string {

        return environment
            .apiBaseUrl
            .replace(
                /\/$/,
                '',
            );
    }

    private normalizeImageUrl(
        value:
            string | null,
    ): string {

        if (
            !value
        ) {
            return '';
        }

        if (
            /^(https?:|data:|blob:)/i
                .test(
                    value,
                )
        ) {
            return value;
        }

        return (
            this.apiBaseUrl +
            '/' +
            value.replace(
                /^\//,
                '',
            )
        );
    }

    /*
     * =========================================
     * INITIALS
     * =========================================
     */

    private createInitials(
        value:
            string,
    ): string {

        const words =
            value
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
            return 'TK';
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
                word =>
                    word.charAt(
                        0,
                    ),
            )
            .join(
                '',
            )
            .toUpperCase();
    }

    /*
     * =========================================
     * RESTORE THEME
     * =========================================
     */

    private restoreTheme():
        void {

        if (
            typeof window ===
            'undefined'
        ) {
            return;
        }

        this.isDarkMode =
            localStorage
                .getItem(
                    'hrm_theme',
                ) ===
            'dark';

        this.document
            .documentElement
            .classList
            .toggle(
                'dark-theme',
                this.isDarkMode,
            );
    }
}