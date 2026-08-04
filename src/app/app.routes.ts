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
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];