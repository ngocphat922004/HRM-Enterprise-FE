import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

const ADMIN = 1;
const HR = 2;
const ACCOUNTANT = 3;
const MANAGER = 4;
const DIRECTOR = 5;
const EMPLOYEE = 6;

const ALL_ROLES = [
    ADMIN,
    HR,
    ACCOUNTANT,
    MANAGER,
    DIRECTOR,
    EMPLOYEE,
];

const MANAGEMENT_VIEW_ROLES = [
    ADMIN,
    HR,
    ACCOUNTANT,
    MANAGER,
    DIRECTOR,
];

const EMPLOYEE_EDIT_ROLES = [
    ADMIN,
    HR,
    ACCOUNTANT,
];

const HR_MANAGEMENT_ROLES = [
    ADMIN,
    HR,
];

const LEAVE_CREATE_ROLES = [
    EMPLOYEE,
];

const PAYROLL_VIEW_ROLES = [
    ADMIN,
    HR,
    ACCOUNTANT,
    DIRECTOR,
    EMPLOYEE,
];

const PAYROLL_MANAGEMENT_ROLES = [
    ADMIN,
    ACCOUNTANT,
];

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: 'login',
        canActivate: [
            guestGuard,
        ],
        loadComponent: () =>
            import(
                './features/auth/pages/login/login.component'
            ).then(
                (
                    component,
                ) =>
                    component.LoginComponent,
            ),
    },
    {
        path: '',
        canActivateChild: [
            authGuard,
        ],
        loadComponent: () =>
            import(
                './shared/layout/main-layout/main-layout.component'
            ).then(
                (
                    component,
                ) =>
                    component.MainLayoutComponent,
            ),
        children: [
            {
                path: 'dashboard',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/dashboard/dashboard.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.DashboardComponent,
                    ),
            },
            {
                path: 'employees',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/employee-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EmployeeListComponent,
                    ),
            },
            {
                path: 'employees/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/add-employee/add-employee.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AddEmployeeComponent,
                    ),
            },
            {
                path: 'employees/:id/edit',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        EMPLOYEE_EDIT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/edit-employee/edit-employee.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditEmployeeComponent,
                    ),
            },
            {
                path: 'employees/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/employee-profile/employee-profile.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EmployeeProfileComponent,
                    ),
            },
            {
                path: 'departments',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/departments/department-list/department-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.DepartmentListComponent,
                    ),
            },
            {
                path: 'departments/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/departments/edit-department/edit-department.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditDepartmentComponent,
                    ),
            },
            {
                path: 'departments/:id/edit',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/departments/edit-department/edit-department.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditDepartmentComponent,
                    ),
            },
            {
                path: 'departments/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/departments/department-detail/department-detail.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.DepartmentDetailComponent,
                    ),
            },
            {
                path: 'positions',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/position-list/position-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.PositionListComponent,
                    ),
            },
            {
                path: 'positions/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/add-position/add-position.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AddPositionComponent,
                    ),
            },
            {
                path: 'positions/:id/edit',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/edit-position/edit-position.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditPositionComponent,
                    ),
            },
            {
                path: 'positions/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/position-detail/position-detail.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.PositionDetailComponent,
                    ),
            },
            {
                path: 'qualifications',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/qualification-list/qualification-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.QualificationListComponent,
                    ),
            },
            {
                path: 'qualifications/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/add-qualification/add-qualification.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AddQualificationComponent,
                    ),
            },
            {
                path: 'qualifications/:id/edit',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/edit-qualification/edit-qualification.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditQualificationComponent,
                    ),
            },
            {
                path: 'qualifications/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/employees/qualification-detail/qualification-detail.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.QualificationDetailComponent,
                    ),
            },
            {
                path: 'contracts',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/contracts/contract-list/contract-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.ContractListComponent,
                    ),
            },
            {
                path: 'contracts/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/contracts/add-contract/add-contract.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AddContractComponent,
                    ),
            },
            {
                path: 'contracts/:id/edit',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/contracts/edit-contract/edit-contract.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditContractComponent,
                    ),
            },
            {
                path: 'contracts/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/contracts/contract-detail/contract-detail.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.ContractDetailComponent,
                    ),
            },
            {
                path: 'attendance/overview',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/attendance/attendance-overview/attendance-overview.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AttendanceOverviewComponent,
                    ),
            },
            {
                path: 'attendance',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/attendance/attendance-list/attendance-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AttendanceListComponent,
                    ),
            },
            {
                path: 'leave/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        LEAVE_CREATE_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/leave/add-leave/add-leave.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AddLeaveComponent,
                    ),
            },
            {
                path: 'leave/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/leave/leave-detail/leave-detail.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.LeaveDetailComponent,
                    ),
            },
            {
                path: 'leave',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/leave/leave-list/leave-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.LeaveListComponent,
                    ),
            },
            {
                path: 'payroll/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        PAYROLL_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/payroll/add-payroll/add-payroll.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AddPayrollComponent,
                    ),
            },
            {
                path: 'payroll/:id/edit',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        PAYROLL_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/payroll/edit-payroll/edit-payroll.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditPayrollComponent,
                    ),
            },
            {
                path: 'payroll/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        PAYROLL_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/payroll/payroll-detail/payroll-detail.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.PayrollDetailComponent,
                    ),
            },
            {
                path: 'payroll',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        PAYROLL_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/payroll/payroll-list/payroll-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.PayrollListComponent,
                    ),
            },
            {
                path: 'rewards-discipline/add',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/add-rewards-discipline/add-rewards-discipline.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.AddRewardsDisciplineComponent,
                    ),
            },
            {
                path: 'rewards-discipline/:id/edit',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        HR_MANAGEMENT_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/edit-rewards-discipline/edit-rewards-discipline.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.EditRewardsDisciplineComponent,
                    ),
            },
            {
                path: 'rewards-discipline/:id',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/rewards-discipline-detail/rewards-discipline-detail.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.RewardsDisciplineDetailComponent,
                    ),
            },
            {
                path: 'rewards-discipline',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        ALL_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/rewards-discipline-list/rewards-discipline-list.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.RewardsDisciplineListComponent,
                    ),
            },
            {
                path: 'reports',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles:
                        MANAGEMENT_VIEW_ROLES,
                },
                loadComponent: () =>
                    import(
                        './features/reports/reports-overview/reports-overview.component'
                    ).then(
                        (
                            component,
                        ) =>
                            component.ReportsOverviewComponent,
                    ),
            },
            {
                path: 'settings',
                canActivate: [
                    roleGuard,
                ],
                data: {
                    roles: [
                        ADMIN,
                    ],
                },
                children: [
                    {
                        path: 'accounts',
                        pathMatch: 'full',
                        loadComponent: () =>
                            import(
                                './features/settings/settings-overview/settings-overview.component'
                            ).then(
                                (
                                    component,
                                ) =>
                                    component.SettingsOverviewComponent,
                            ),
                    },
                    {
                        path: 'accounts/add',
                        loadComponent: () =>
                            import(
                                './features/settings/add-account/add-account.component'
                            ).then(
                                (
                                    component,
                                ) =>
                                    component.AddAccountComponent,
                            ),
                    },
                    {
                        path: 'accounts/:id/edit',
                        loadComponent: () =>
                            import(
                                './features/settings/edit-account/edit-account.component'
                            ).then(
                                (
                                    component,
                                ) =>
                                    component.EditAccountComponent,
                            ),
                    },
                    {
                        path: 'accounts/:id',
                        loadComponent: () =>
                            import(
                                './features/settings/account-detail/account-detail.component'
                            ).then(
                                (
                                    component,
                                ) =>
                                    component.AccountDetailComponent,
                            ),
                    },
                    {
                        path: 'roles/:id',
                        loadComponent: () =>
                            import(
                                './features/settings/role-detail/role-detail.component'
                            ).then(
                                (
                                    component,
                                ) =>
                                    component.RoleDetailComponent,
                            ),
                    },
                    {
                        path: 'roles',
                        loadComponent: () =>
                            import(
                                './features/settings/role-list/role-list.component'
                            ).then(
                                (
                                    component,
                                ) =>
                                    component.RoleListComponent,
                            ),
                    },
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: () =>
                            import(
                                './features/settings/settings-overview/settings-overview.component'
                            ).then(
                                (
                                    component,
                                ) =>
                                    component.SettingsOverviewComponent,
                            ),
                    },
                ],
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];