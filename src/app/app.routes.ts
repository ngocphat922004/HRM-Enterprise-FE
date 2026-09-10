import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
            import(
                './features/auth/pages/login/login.component'
            ).then(
                (component) =>
                    component.LoginComponent,
            ),
    },
    {
        path: '',
        canActivateChild: [authGuard, roleGuard],
        loadComponent: () =>
            import(
                './shared/layout/main-layout/main-layout.component'
            ).then(
                (component) =>
                    component.MainLayoutComponent,
            ),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import(
                        './features/dashboard/dashboard.component'
                    ).then(
                        (component) =>
                            component.DashboardComponent,
                    ),
            },
            {
                path: 'employees',
                loadComponent: () =>
                    import(
                        './features/employees/employee-list.component'
                    ).then(
                        (component) =>
                            component.EmployeeListComponent,
                    ),
            },
            {
                path: 'employees/add',
                loadComponent: () =>
                    import(
                        './features/employees/add-employee/add-employee.component'
                    ).then(
                        (component) =>
                            component.AddEmployeeComponent,
                    ),
            },
            {
                path: 'employees/:id/edit',
                loadComponent: () =>
                    import(
                        './features/employees/edit-employee/edit-employee.component'
                    ).then(
                        (component) =>
                            component.EditEmployeeComponent,
                    ),
            },
            {
                path: 'employees/:id',
                loadComponent: () =>
                    import(
                        './features/employees/employee-profile/employee-profile.component'
                    ).then(
                        (component) =>
                            component.EmployeeProfileComponent,
                    ),
            },
            {
                path: 'departments',
                loadComponent: () =>
                    import(
                        './features/departments/department-list/department-list.component'
                    ).then(
                        (component) =>
                            component.DepartmentListComponent,
                    ),
            },
            {
                path: 'departments/add',
                loadComponent: () =>
                    import(
                        './features/departments/edit-department/edit-department.component'
                    ).then(
                        (component) =>
                            component.EditDepartmentComponent,
                    ),
            },
            {
                path: 'departments/:id/edit',
                loadComponent: () =>
                    import(
                        './features/departments/edit-department/edit-department.component'
                    ).then(
                        (component) =>
                            component.EditDepartmentComponent,
                    ),
            },
            {
                path: 'departments/:id',
                loadComponent: () =>
                    import(
                        './features/departments/department-detail/department-detail.component'
                    ).then(
                        (component) =>
                            component.DepartmentDetailComponent,
                    ),
            },
            {
                path: 'positions',
                loadComponent: () =>
                    import(
                        './features/employees/position-list/position-list.component'
                    ).then(
                        (component) =>
                            component.PositionListComponent,
                    ),
            },
            {
                path: 'positions/add',
                loadComponent: () =>
                    import(
                        './features/employees/add-position/add-position.component'
                    ).then(
                        (component) =>
                            component.AddPositionComponent,
                    ),
            },
            {
                path: 'positions/:id/edit',
                loadComponent: () =>
                    import(
                        './features/employees/edit-position/edit-position.component'
                    ).then(
                        (component) =>
                            component.EditPositionComponent,
                    ),
            },
            {
                path: 'positions/:id',
                loadComponent: () =>
                    import(
                        './features/employees/position-detail/position-detail.component'
                    ).then(
                        (component) =>
                            component.PositionDetailComponent,
                    ),
            },
            {
                path: 'qualifications',
                loadComponent: () =>
                    import(
                        './features/employees/qualification-list/qualification-list.component'
                    ).then(
                        (component) =>
                            component.QualificationListComponent,
                    ),
            },
            {
                path: 'qualifications/add',
                loadComponent: () =>
                    import(
                        './features/employees/add-qualification/add-qualification.component'
                    ).then(
                        (component) =>
                            component.AddQualificationComponent,
                    ),
            },
            {
                path: 'qualifications/:id/edit',
                loadComponent: () =>
                    import(
                        './features/employees/edit-qualification/edit-qualification.component'
                    ).then(
                        (component) =>
                            component.EditQualificationComponent,
                    ),
            },
            {
                path: 'qualifications/:id',
                loadComponent: () =>
                    import(
                        './features/employees/qualification-detail/qualification-detail.component'
                    ).then(
                        (component) =>
                            component.QualificationDetailComponent,
                    ),
            },
            {
                path: 'contracts',
                loadComponent: () =>
                    import(
                        './features/contracts/contract-list/contract-list.component'
                    ).then(
                        (component) =>
                            component.ContractListComponent,
                    ),
            },
            {
                path: 'contracts/add',
                loadComponent: () =>
                    import(
                        './features/contracts/add-contract/add-contract.component'
                    ).then(
                        (component) =>
                            component.AddContractComponent,
                    ),
            },
            {
                path: 'contracts/:id/edit',
                loadComponent: () =>
                    import(
                        './features/contracts/edit-contract/edit-contract.component'
                    ).then(
                        (component) =>
                            component.EditContractComponent,
                    ),
            },
            {
                path: 'contracts/:id',
                loadComponent: () =>
                    import(
                        './features/contracts/contract-detail/contract-detail.component'
                    ).then(
                        (component) =>
                            component.ContractDetailComponent,
                    ),
            },
            {
                path: 'attendance/overview',
                loadComponent: () =>
                    import(
                        './features/attendance/attendance-overview/attendance-overview.component'
                    ).then(
                        (component) =>
                            component.AttendanceOverviewComponent,
                    ),
            },
            {
                path: 'attendance',
                loadComponent: () =>
                    import(
                        './features/attendance/attendance-list/attendance-list.component'
                    ).then(
                        (component) =>
                            component.AttendanceListComponent,
                    ),
            },
            {
                path: 'leave/add',
                loadComponent: () =>
                    import(
                        './features/leave/add-leave/add-leave.component'
                    ).then(
                        (component) =>
                            component.AddLeaveComponent,
                    ),
            },
            {
                path: 'leave/:id',
                loadComponent: () =>
                    import(
                        './features/leave/leave-detail/leave-detail.component'
                    ).then(
                        (component) =>
                            component.LeaveDetailComponent,
                    ),
            },
            {
                path: 'leave',
                loadComponent: () =>
                    import(
                        './features/leave/leave-list/leave-list.component'
                    ).then(
                        (component) =>
                            component.LeaveListComponent,
                    ),
            },
            {
                path: 'payroll/add',
                loadComponent: () =>
                    import(
                        './features/payroll/add-payroll/add-payroll.component'
                    ).then(
                        (component) =>
                            component.AddPayrollComponent,
                    ),
            },
            {
                path: 'payroll/:id/edit',
                loadComponent: () =>
                    import(
                        './features/payroll/edit-payroll/edit-payroll.component'
                    ).then(
                        (component) =>
                            component.EditPayrollComponent,
                    ),
            },
            {
                path: 'payroll/:id',
                loadComponent: () =>
                    import(
                        './features/payroll/payroll-detail/payroll-detail.component'
                    ).then(
                        (component) =>
                            component.PayrollDetailComponent,
                    ),
            },
            {
                path: 'payroll',
                loadComponent: () =>
                    import(
                        './features/payroll/payroll-list/payroll-list.component'
                    ).then(
                        (component) =>
                            component.PayrollListComponent,
                    ),
            },
            {
                path: 'rewards-discipline/add',
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/add-rewards-discipline/add-rewards-discipline.component'
                    ).then(
                        (component) =>
                            component.AddRewardsDisciplineComponent,
                    ),
            },
            {
                path: 'rewards-discipline/:id/edit',
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/edit-rewards-discipline/edit-rewards-discipline.component'
                    ).then(
                        (component) =>
                            component.EditRewardsDisciplineComponent,
                    ),
            },
            {
                path: 'rewards-discipline/:id',
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/rewards-discipline-detail/rewards-discipline-detail.component'
                    ).then(
                        (component) =>
                            component.RewardsDisciplineDetailComponent,
                    ),
            },
            {
                path: 'rewards-discipline',
                loadComponent: () =>
                    import(
                        './features/rewards-discipline/rewards-discipline-list/rewards-discipline-list.component'
                    ).then(
                        (component) =>
                            component.RewardsDisciplineListComponent,
                    ),
            },
            {
                path: 'reports',
                loadComponent: () =>
                    import(
                        './features/reports/reports-overview/reports-overview.component'
                    ).then(
                        (component) =>
                            component.ReportsOverviewComponent,
                    ),
            },
            {
                path: 'settings',
                children: [
                    {
                        path: 'accounts',
                        pathMatch: 'full',
                        loadComponent: () =>
                            import(
                                './features/settings/settings-overview/settings-overview.component'
                            ).then(
                                (component) =>
                                    component.SettingsOverviewComponent,
                            ),
                    },
                    {
                        path: 'accounts/add',
                        loadComponent: () =>
                            import(
                                './features/settings/add-account/add-account.component'
                            ).then(
                                (component) =>
                                    component.AddAccountComponent,
                            ),
                    },
                    {
                        path: 'accounts/:id/edit',
                        loadComponent: () =>
                            import(
                                './features/settings/edit-account/edit-account.component'
                            ).then(
                                (component) =>
                                    component.EditAccountComponent,
                            ),
                    },
                    {
                        path: 'accounts/:id',
                        loadComponent: () =>
                            import(
                                './features/settings/account-detail/account-detail.component'
                            ).then(
                                (component) =>
                                    component.AccountDetailComponent,
                            ),
                    },
                    {
                        path: 'roles/add',
                        loadComponent: () =>
                            import(
                                './features/settings/add-role/add-role.component'
                            ).then(
                                (component) =>
                                    component.AddRoleComponent,
                            ),
                    },
                    {
                        path: 'roles/:id/edit',
                        loadComponent: () =>
                            import(
                                './features/settings/edit-role/edit-role.component'
                            ).then(
                                (component) =>
                                    component.EditRoleComponent,
                            ),
                    },
                    {
                        path: 'roles/:id',
                        loadComponent: () =>
                            import(
                                './features/settings/role-detail/role-detail.component'
                            ).then(
                                (component) =>
                                    component.RoleDetailComponent,
                            ),
                    },
                    {
                        path: 'roles',
                        loadComponent: () =>
                            import(
                                './features/settings/role-list/role-list.component'
                            ).then(
                                (component) =>
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
                                (component) =>
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