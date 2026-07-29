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
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];