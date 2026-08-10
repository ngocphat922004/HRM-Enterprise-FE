import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import(
                './features/auth/pages/login/login.component'
            ).then(
                (module) => module.LoginComponent,
            ),
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import(
                './features/dashboard/dashboard.component'
            ).then(
                (module) =>
                    module.DashboardComponent,
            ),
    },
    {
        path: 'employees',
        loadComponent: () =>
            import(
                './features/employees/employee-list.component'
            ).then(
                (module) =>
                    module.EmployeeListComponent,
            ),
    },
    {
        path: 'employees/add',
        loadComponent: () =>
            import(
                './features/employees/add-employee/add-employee.component'
            ).then(
                (module) =>
                    module.AddEmployeeComponent,
            ),
    },
    {
        path: 'employees/:id/edit',
        loadComponent: () =>
            import(
                './features/employees/edit-employee/edit-employee.component'
            ).then(
                (module) =>
                    module.EditEmployeeComponent,
            ),
    },
    {
        path: 'employees/:id',
        loadComponent: () =>
            import(
                './features/employees/employee-profile/employee-profile.component'
            ).then((m) => m.EmployeeProfileComponent),
    },
    {
        path: 'departments',
        loadComponent: () =>
            import('./features/departments/department-list/department-list.component')
                .then(m => m.DepartmentListComponent),
    },
    {
        path: 'departments/:id/edit',
        loadComponent: () =>
            import('./features/departments/edit-department/edit-department.component')
                .then(m => m.EditDepartmentComponent),
    },
    {
        path: 'departments/:id',
        loadComponent: () =>
            import('./features/departments/department-detail/department-detail.component')
                .then(m => m.DepartmentDetailComponent),
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];