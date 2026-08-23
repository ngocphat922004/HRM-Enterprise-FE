import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import(
                './features/auth/pages/login/login.component'
            ).then(
                (component) =>
                    component.LoginComponent,
            ),
    },

    // Dashboard
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

    // Nhân viên
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

    // Phòng ban
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

    // Chức vụ
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

    // Hợp đồng
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

    // Chấm công
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

    // Nghỉ phép
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

    // Bảng lương
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

    // Khen thưởng, kỷ luật
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

    // Báo cáo tổng hợp
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

    // Cài đặt tài khoản và quyền
    {
        path: 'settings/accounts/add',
        loadComponent: () =>
            import(
                './features/settings/add-account/add-account.component'
            ).then(
                (component) =>
                    component.AddAccountComponent,
            ),
    },
    {
        path: 'settings/accounts/:id/edit',
        loadComponent: () =>
            import(
                './features/settings/edit-account/edit-account.component'
            ).then(
                (component) =>
                    component.EditAccountComponent,
            ),
    },
    {
        path: 'settings/accounts/:id',
        loadComponent: () =>
            import(
                './features/settings/account-detail/account-detail.component'
            ).then(
                (component) =>
                    component.AccountDetailComponent,
            ),
    },
    {
        path: 'settings/roles/add',
        loadComponent: () =>
            import(
                './features/settings/add-role/add-role.component'
            ).then(
                (component) =>
                    component.AddRoleComponent,
            ),
    },
    {
        path: 'settings/roles/:id/edit',
        loadComponent: () =>
            import(
                './features/settings/edit-role/edit-role.component'
            ).then(
                (component) =>
                    component.EditRoleComponent,
            ),
    },
    {
        path: 'settings/roles/:id',
        loadComponent: () =>
            import(
                './features/settings/role-detail/role-detail.component'
            ).then(
                (component) =>
                    component.RoleDetailComponent,
            ),
    },
    {
        path: 'settings/roles',
        loadComponent: () =>
            import(
                './features/settings/role-list/role-list.component'
            ).then(
                (component) =>
                    component.RoleListComponent,
            ),
    },
    {
        path: 'settings',
        loadComponent: () =>
            import(
                './features/settings/settings-overview/settings-overview.component'
            ).then(
                (component) =>
                    component.SettingsOverviewComponent,
            ),
    },

    // Điều hướng mặc định
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },

    // Không tìm thấy đường dẫn
    {
        path: '**',
        redirectTo: 'login',
    },
];
