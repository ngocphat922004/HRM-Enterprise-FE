import { inject } from '@angular/core';
import {
    CanActivateChildFn,
    Router,
    UrlTree,
} from '@angular/router';

import {
    LoginData,
} from '../models/login-response.model';

import {
    AuthService,
} from '../services/auth.service';

type RoleKey =
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
    'quản trị viên': 'admin',
    'admin': 'admin',
    'nhân viên nhân sự': 'hr',
    'nhân sự': 'hr',
    'kế toán': 'accountant',
    'trưởng phòng': 'manager',
    'trưởng nhóm': 'manager',
    'ban giám đốc': 'director',
    'giám đốc': 'director',
    'nhân viên': 'employee',
};

export const roleGuard: CanActivateChildFn = (
    route,
    state,
) => {
    const authService =
        inject(AuthService);

    const router =
        inject(Router);

    const currentUser =
        authService.getCurrentUser();

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

    const path =
        normalizePath(state.url);

    if (path === '/dashboard') {
        return true;
    }

    const role =
        resolveRole(currentUser);

    if (!role) {
        return router.createUrlTree(
            ['/dashboard'],
            {
                queryParams: {
                    accessDenied: 'true',
                },
            },
        );
    }

    const requestedTab =
        route.queryParamMap.get('tab');

    if (
        canAccess(
            path,
            role,
            currentUser,
            requestedTab,
        )
    ) {
        return true;
    }

    return createDefaultRoute(
        router,
        role,
        currentUser,
        true,
    );
};

function canAccess(
    path: string,
    role: RoleKey,
    currentUser: LoginData,
    requestedTab: string | null,
): boolean {
    if (path === '/employees/add') {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (
        /^\/employees\/\d+\/edit$/.test(
            path,
        )
    ) {
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

    const employeeDetailMatch =
        path.match(
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
            Number(
                employeeDetailMatch[1],
            ) === currentUser.maNV
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

    if (
        path.startsWith(
            '/departments',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (
        path.startsWith(
            '/positions',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (
        path.startsWith(
            '/qualifications',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (
        path.startsWith(
            '/contracts',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (
        path.startsWith(
            '/attendance',
        )
    ) {
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

    if (
        path.startsWith(
            '/leave',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'hr',
            'manager',
        );
    }

    if (
        path.startsWith(
            '/payroll',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'accountant',
        );
    }

    if (
        path.startsWith(
            '/rewards-discipline',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'hr',
        );
    }

    if (
        path.startsWith(
            '/reports',
        )
    ) {
        return isOneOf(
            role,
            'admin',
            'accountant',
            'director',
        );
    }

    if (
        path.startsWith(
            '/settings',
        )
    ) {
        return role === 'admin';
    }

    return false;
}

function createDefaultRoute(
    router: Router,
    role: RoleKey,
    currentUser: LoginData,
    accessDenied: boolean,
): UrlTree {
    const commands =
        role === 'employee' &&
            currentUser.maNV > 0
            ? [
                '/employees',
                currentUser.maNV,
            ]
            : ['/dashboard'];

    return router.createUrlTree(
        commands,
        {
            queryParams:
                accessDenied
                    ? {
                        accessDenied:
                            'true',
                    }
                    : undefined,
        },
    );
}

function resolveRole(
    user: LoginData,
): RoleKey | null {
    const normalizedRoleName =
        normalizeRoleName(
            user.tenQuyen,
        );

    if (normalizedRoleName) {
        const roleByName =
            ROLE_BY_NAME[
            normalizedRoleName
            ];

        if (roleByName) {
            return roleByName;
        }
    }

    const roleId =
        Number(user.maQuyen);

    return (
        Number.isInteger(roleId)
            ? ROLE_BY_ID[roleId]
            : undefined
    ) ?? null;
}

function normalizePath(
    url: string,
): string {
    const path =
        url
            .split('?')[0]
            .split('#')[0];

    if (
        path.length > 1 &&
        path.endsWith('/')
    ) {
        return path.slice(
            0,
            -1,
        );
    }

    return path;
}

function normalizeRoleName(
    value: unknown,
): string {
    return typeof value === 'string'
        ? value
            .trim()
            .toLocaleLowerCase(
                'vi-VN',
            )
        : '';
}

function isOneOf(
    role: RoleKey,
    ...allowedRoles: RoleKey[]
): boolean {
    return allowedRoles.includes(
        role,
    );
}
