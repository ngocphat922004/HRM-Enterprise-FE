import { inject } from '@angular/core';
import {
    CanActivateChildFn,
    Router,
    UrlTree,
} from '@angular/router';
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

export const roleGuard: CanActivateChildFn = (
    _route,
    state,
) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
        return router.createUrlTree(
            ['/login'],
            {
                queryParams: {
                    returnUrl: state.url,
                },
            },
        );
    }

    const path = normalizePath(state.url);

    if (path === '/dashboard') {
        return true;
    }

    const requestedTab = getQueryParam(
        state.url,
        'tab',
    );

    if (
        canUserAccessPath(
            currentUser,
            path,
            requestedTab,
        )
    ) {
        return true;
    }

    return createDefaultRoute(
        router,
        currentUser,
        true,
    );
};

export function canUserAccessPath(
    currentUser: LoginData,
    rawPath: string,
    requestedTab: string | null = null,
): boolean {
    const path = normalizePath(rawPath);

    if (path === '/dashboard') {
        return true;
    }

    const role = resolveUserRole(currentUser);

    if (!role) {
        return false;
    }

    if (path === '/employees/add') {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (/^\/employees\/\d+\/edit$/.test(path)) {
        if (
            isOneOf(
                role,
                'admin',
                'hr',
            )
        ) {
            return true;
        }

        return (
            role === 'accountant' &&
            requestedTab === 'allowances'
        );
    }

    const employeeDetailMatch = path.match(
        /^\/employees\/(\d+)$/,
    );

    if (employeeDetailMatch) {
        if (
            isOneOf(
                role,
                'admin',
                'hr',
                'manager',
            )
        ) {
            return true;
        }

        return (
            role === 'employee' &&
            Number(employeeDetailMatch[1]) ===
            toPositiveInteger(currentUser.maNV)
        );
    }

    if (path === '/employees') {
        return isOneOf(
            role,
            'admin',
            'hr',
            'manager',
        );
    }

    if (path.startsWith('/departments')) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (path.startsWith('/positions')) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (path.startsWith('/qualifications')) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (path.startsWith('/contracts')) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (path.startsWith('/attendance')) {
        return isOneOf(
            role,
            'admin',
            'accountant',
            'manager',
            'employee',
        );
    }

    if (path === '/leave/add') {
        return true;
    }

    if (path.startsWith('/leave')) {
        return isOneOf(
            role,
            'admin',
            'hr',
            'manager',
        );
    }

    if (path.startsWith('/payroll')) {
        return isOneOf(
            role,
            'admin',
            'accountant',
        );
    }

    if (path.startsWith('/rewards-discipline')) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (path.startsWith('/reports')) {
        return isOneOf(
            role,
            'admin',
            'accountant',
            'director',
        );
    }

    if (path.startsWith('/settings')) {
        return role === 'admin';
    }

    return false;
}

export function resolveUserRole(
    user: LoginData | null,
): RoleKey | null {
    if (!user) {
        return null;
    }

    const roleId = toPositiveInteger(
        user.maQuyen,
    );

    if (roleId && ROLE_BY_ID[roleId]) {
        return ROLE_BY_ID[roleId];
    }

    const normalizedRoleName = normalizeRoleName(
        user.tenQuyen,
    );

    if (!normalizedRoleName) {
        return null;
    }

    return ROLE_BY_NAME[normalizedRoleName] ?? null;
}

function createDefaultRoute(
    router: Router,
    currentUser: LoginData,
    accessDenied: boolean,
): UrlTree {
    const role = resolveUserRole(currentUser);
    const employeeId = toPositiveInteger(
        currentUser.maNV,
    );

    const commands =
        role === 'employee' && employeeId
            ? ['/employees', employeeId]
            : ['/dashboard'];

    return router.createUrlTree(
        commands,
        {
            queryParams: accessDenied
                ? {
                    accessDenied: 'true',
                }
                : undefined,
        },
    );
}

function normalizePath(
    url: string,
): string {
    const path = url
        .split('?')[0]
        .split('#')[0];

    if (
        path.length > 1 &&
        path.endsWith('/')
    ) {
        return path.slice(0, -1);
    }

    return path;
}

function normalizeRoleName(
    value: unknown,
): string {
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

function toPositiveInteger(
    value: unknown,
): number | null {
    const numberValue = Number(value);

    return (
        Number.isInteger(numberValue) &&
        numberValue > 0
    )
        ? numberValue
        : null;
}

function getQueryParam(
    url: string,
    key: string,
): string | null {
    const queryIndex = url.indexOf('?');

    if (queryIndex < 0) {
        return null;
    }

    const query = url
        .slice(queryIndex + 1)
        .split('#')[0];

    return new URLSearchParams(query).get(key);
}

function isOneOf(
    role: RoleKey,
    ...allowedRoles: RoleKey[]
): boolean {
    return allowedRoles.includes(role);
}
