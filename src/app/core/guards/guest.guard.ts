import {
    inject,
} from '@angular/core';

import {
    CanActivateFn,
    Router,
} from '@angular/router';

import {
    AuthService,
} from '../services/auth.service';


/* =========================
   CHẶN TRANG DÀNH CHO KHÁCH
========================= */

export const guestGuard:
    CanActivateFn = () => {

        const authService =
            inject(AuthService);


        const router =
            inject(Router);


        if (
            !authService.isAuthenticated()
        ) {
            return true;
        }


        return router.createUrlTree(
            [
                '/dashboard',
            ],
        );
    };