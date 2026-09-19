import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';

import { LoginData } from '../models/login-response.model';
import { AuthService } from '../services/auth.service';

export type RoleKey =
    | 'admin'
    | 'hr'
    | 'accountant'
    | 'manager'
    | 'director'
    | 'employee';

const ROLE_BY_ID: Record<number, RoleKey> = {
    1: 'admin',
    2: 'hr',
    3: 'accountant',
    4: 'manager',
    5: 'director',
    6: 'employee',
};

const ROLE_ID_BY_KEY: Record<RoleKey, number> = {
    admin: 1,
    hr: 2,
    accountant: 3,
    manager: 4,
    director: 5,
    employee: 6,
};

const ROLE_BY_NAME: Record<string, RoleKey> = {
    admin: 'admin',
    administrator: 'admin',
    'role admin': 'admin',
    'quan tri vien': 'admin',
    'quan tri he thong': 'admin',
    'system administrator': 'admin',

    hr: 'hr',
    'human resources': 'hr',
    'hr manager': 'hr',
    'nhan su': 'hr',
    'nhan vien nhan su': 'hr',
    'quan ly nhan su': 'hr',

    accountant: 'accountant',
    'ke toan': 'accountant',
    'nhan vien ke toan': 'accountant',

    manager: 'manager',
    'truong phong': 'manager',
    'truong nhom': 'manager',
    'quan ly phong ban': 'manager',

    director: 'director',
    'ban giam doc': 'director',
    'giam doc': 'director',
    'board of directors': 'director',

    employee: 'employee',
    'nhan vien': 'employee',
};

export const roleGuard: CanActivateChildFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
        return router.createUrlTree(['/login'], {
            queryParams: {
                returnUrl: state.url,
            },
        });
    }

    if (!resolveUserRole(currentUser)) {
        authService.clearSession();

        return router.createUrlTree(['/login'], {
            queryParams: {
                returnUrl: state.url,
            },
        });
    }

    if (!isAllowedByRouteMetadata(currentUser, route.data?.['roles'])) {
        return createDefaultRoute(router, currentUser, true);
    }

    const path = normalizePath(state.url);
    const requestedTab = getQueryParam(state.url, 'tab');

    if (canUserAccessPath(currentUser, path, requestedTab)) {
        return true;
    }

    return createDefaultRoute(router, currentUser, true);
};

export function canUserAccessPath(
    currentUser: LoginData,
    rawPath: string,
    requestedTab: string | null = null,
): boolean {
    const path = normalizePath(rawPath);
    const role = resolveUserRole(currentUser);

    if (!role) {
        return false;
    }

    if (path === '/dashboard') {
        return isOneOf(
            role,
            'admin',
            'hr',
            'accountant',
            'manager',
            'director',
        );
    }

    if (path === '/employees/add') {
        return canManageEmployees(role);
    }

    if (/^\/employees\/\d+\/edit$/.test(path)) {
        if (canManageEmployees(role)) {
            return true;
        }

        return role === 'accountant' && requestedTab === 'allowances';
    }

    const employeeDetailMatch = path.match(/^\/employees\/(\d+)$/);

    if (employeeDetailMatch) {
        const employeeId = Number(employeeDetailMatch[1]);

        if (canViewEmployeeDirectory(role)) {
            return true;
        }

        return (
            role === 'employee' &&
            isOwnEmployeeProfile(currentUser, employeeId)
        );
    }

    if (path === '/employees') {
        return canViewEmployeeDirectory(role);
    }

    if (path === '/departments/add') {
        return canManageOrganization(role);
    }

    if (/^\/departments\/\d+\/edit$/.test(path)) {
        return canManageOrganization(role);
    }

    if (path === '/departments' || /^\/departments\/\d+$/.test(path)) {
        return canViewOrganization(role);
    }

    if (path === '/positions/add') {
        return canManageOrganization(role);
    }

    if (/^\/positions\/\d+\/edit$/.test(path)) {
        return canManageOrganization(role);
    }

    if (path === '/positions' || /^\/positions\/\d+$/.test(path)) {
        return canViewOrganization(role);
    }

    if (path === '/qualifications/add') {
        return canManageOrganization(role);
    }

    if (/^\/qualifications\/\d+\/edit$/.test(path)) {
        return canManageOrganization(role);
    }

    if (
        path === '/qualifications' ||
        /^\/qualifications\/\d+$/.test(path)
    ) {
        return canViewOrganization(role);
    }

    if (path === '/contracts/add') {
        return canManageContracts(role);
    }

    if (/^\/contracts\/\d+\/edit$/.test(path)) {
        return canManageContracts(role);
    }

    if (path === '/contracts' || /^\/contracts\/\d+$/.test(path)) {
        return canViewContracts(role);
    }

    if (path === '/attendance/overview' || path === '/attendance') {
        return canViewAttendance(role);
    }

    if (path.startsWith('/attendance')) {
        return false;
    }

    if (path === '/leave/add') {
        return (
            canCreateLeave(role) &&
            toPositiveInteger(currentUser.maNV) !== null
        );
    }

    if (path === '/leave' || /^\/leave\/\d+$/.test(path)) {
        return canViewLeave(role);
    }

    if (path.startsWith('/leave')) {
        return false;
    }

    if (path === '/payroll/add') {
        return canManagePayroll(role);
    }

    if (/^\/payroll\/\d+\/edit$/.test(path)) {
        return canManagePayroll(role);
    }

    if (path === '/payroll' || /^\/payroll\/\d+$/.test(path)) {
        return canViewPayroll(role);
    }

    if (path === '/rewards-discipline/add') {
        return canManageRewards(role);
    }

    if (/^\/rewards-discipline\/\d+\/edit$/.test(path)) {
        return canManageRewards(role);
    }

    if (
        path === '/rewards-discipline' ||
        /^\/rewards-discipline\/\d+$/.test(path)
    ) {
        return canViewRewards(role);
    }

    if (path.startsWith('/reports')) {
        return canViewReports(role);
    }

    if (path.startsWith('/settings')) {
        return canManageSettings(role);
    }

    return false;
}

export function resolveUserRole(user: LoginData | null): RoleKey | null {
    if (!user) {
        return null;
    }

    const roleId = toPositiveInteger(user.maQuyen);

    if (roleId !== null && ROLE_BY_ID[roleId]) {
        return ROLE_BY_ID[roleId];
    }

    const normalizedRoleName = normalizeRoleName(user.tenQuyen);

    if (!normalizedRoleName) {
        return null;
    }

    return ROLE_BY_NAME[normalizedRoleName] ?? null;
}

export function canManageEmployees(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr');
}

export function canViewEmployeeDirectory(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'accountant', 'manager', 'director');
}

export function canManageOrganization(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr');
}

export function canViewOrganization(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'accountant', 'manager', 'director');
}

export function canManageContracts(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr');
}

export function canViewContracts(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(
        role,
        'admin',
        'hr',
        'accountant',
        'manager',
        'director',
        'employee',
    );
}

export function canManagePayroll(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'accountant');
}

export function canViewPayroll(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'accountant', 'director', 'employee');
}

export function canManageRewards(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr');
}

export function canViewRewards(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(
        role,
        'admin',
        'hr',
        'accountant',
        'manager',
        'director',
        'employee',
    );
}


export function canViewAttendance(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(
        role,
        'admin',
        'hr',
        'accountant',
        'manager',
        'director',
        'employee',
    );
}

export function canManageAttendance(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'accountant');
}

export function canViewShiftTypes(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(
        role,
        'admin',
        'hr',
        'accountant',
        'manager',
        'director',
    );
}

export function canManageShiftTypes(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'accountant');
}

export function canViewLeave(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(
        role,
        'admin',
        'hr',
        'accountant',
        'manager',
        'director',
        'employee',
    );
}

export function canCreateLeave(role: RoleKey | null): boolean {
    return role === 'employee';
}

export function canApproveLeave(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'manager');
}

export function canDeleteLeave(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr');
}

export function canViewLeaveTypes(role: RoleKey | null): boolean {
    return canViewLeave(role);
}

export function canManageLeaveTypes(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr');
}

export function canViewAllowances(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(
        role,
        'admin',
        'hr',
        'accountant',
        'manager',
        'director',
        'employee',
    );
}

export function canManageAllowances(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'accountant');
}

export function canViewReports(role: RoleKey | null): boolean {
    if (!role) {
        return false;
    }

    return isOneOf(role, 'admin', 'hr', 'accountant', 'manager', 'director');
}

export function canUseAi(role: RoleKey | null): boolean {
    return canViewReports(role);
}

export function canManageSettings(role: RoleKey | null): boolean {
    return role === 'admin';
}

export function isOwnEmployeeProfile(
    currentUser: LoginData | null,
    employeeId: number,
): boolean {
    if (!currentUser || !Number.isInteger(employeeId) || employeeId <= 0) {
        return false;
    }

    const currentEmployeeId = toPositiveInteger(currentUser.maNV);

    return currentEmployeeId !== null && currentEmployeeId === employeeId;
}

function isAllowedByRouteMetadata(
    currentUser: LoginData,
    configuredRoles: unknown,
): boolean {
    const allowedRoleIds = normalizeConfiguredRoleIds(configuredRoles);

    if (allowedRoleIds.length === 0) {
        return true;
    }

    const currentRoleId = resolveUserRoleId(currentUser);

    return currentRoleId !== null && allowedRoleIds.includes(currentRoleId);
}

function normalizeConfiguredRoleIds(value: unknown): number[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((roleId) => toPositiveInteger(roleId))
        .filter((roleId): roleId is number => roleId !== null);
}

function resolveUserRoleId(user: LoginData): number | null {
    const roleId = toPositiveInteger(user.maQuyen);

    if (roleId !== null && ROLE_BY_ID[roleId]) {
        return roleId;
    }

    const role = resolveUserRole(user);

    return role ? ROLE_ID_BY_KEY[role] : null;
}

function createDefaultRoute(
    router: Router,
    currentUser: LoginData,
    accessDenied: boolean,
): UrlTree {
    const role = resolveUserRole(currentUser);
    const employeeId = toPositiveInteger(currentUser.maNV);

    const commands =
        role === 'employee'
            ? employeeId !== null
                ? ['/employees', employeeId]
                : ['/attendance/overview']
            : ['/dashboard'];

    return router.createUrlTree(commands, {
        queryParams: accessDenied
            ? {
                accessDenied: 'true',
            }
            : undefined,
    });
}

function normalizePath(url: string): string {
    const path = url.split('?')[0].split('#')[0];

    if (path.length > 1 && path.endsWith('/')) {
        return path.slice(0, -1);
    }

    return path;
}

function normalizeRoleName(value: unknown): string {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('vi-VN')
        .replace(/đ/g, 'd')
        .replace(/[_\-.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function toPositiveInteger(value: unknown): number | null {
    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue > 0
        ? numberValue
        : null;
}

function getQueryParam(url: string, key: string): string | null {
    const queryIndex = url.indexOf('?');

    if (queryIndex < 0) {
        return null;
    }

    const query = url.slice(queryIndex + 1).split('#')[0];

    return new URLSearchParams(query).get(key);
}

function isOneOf(role: RoleKey, ...allowedRoles: RoleKey[]): boolean {
    return allowedRoles.includes(role);
}
