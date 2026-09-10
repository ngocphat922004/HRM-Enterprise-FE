import {
    HttpErrorResponse,
    HttpInterceptorFn,
} from '@angular/common/http';

import {
    inject,
} from '@angular/core';

import {
    Router,
} from '@angular/router';

import {
    catchError,
    throwError,
} from 'rxjs';

import {
    API_ENDPOINTS,
} from '../constants/api-endpoints.constants';

import {
    StorageService,
} from '../services/storage.service';


let isRedirectingToLogin =
    false;


export const apiErrorInterceptor:
    HttpInterceptorFn = (
        request,
        next,
    ) => {

        const router =
            inject(Router);


        const storageService =
            inject(StorageService);


        return next(request)
            .pipe(
                catchError(
                    (
                        error:
                            unknown,
                    ) => {

                        if (
                            error instanceof
                            HttpErrorResponse &&
                            error.status === 401 &&
                            !isLoginRequest(
                                request.url,
                            )
                        ) {
                            storageService
                                .clearAuthSession();


                            redirectToLogin(
                                router,
                            );
                        }


                        return throwError(
                            () =>
                                error,
                        );
                    },
                ),
            );
    };


/* =========================
   KIỂM TRA API ĐĂNG NHẬP
========================= */

function isLoginRequest(
    url:
        string,
): boolean {

    const urlWithoutQuery =
        url.split('?')[0];


    return urlWithoutQuery
        .endsWith(
            API_ENDPOINTS.auth.login,
        );
}


/* =========================
   CHUYỂN VỀ TRANG ĐĂNG NHẬP
========================= */

function redirectToLogin(
    router:
        Router,
): void {

    if (
        isRedirectingToLogin ||
        router.url === '/login' ||
        router.url.startsWith('/login?')
    ) {
        return;
    }


    isRedirectingToLogin =
        true;


    const returnUrl =
        getSafeReturnUrl(
            router.url,
        );


    const navigation =
        returnUrl
            ? router.navigate(
                [
                    '/login',
                ],
                {
                    queryParams: {
                        returnUrl,
                    },
                },
            )

            : router.navigate(
                [
                    '/login',
                ],
            );


    void navigation.finally(
        () => {
            isRedirectingToLogin =
                false;
        },
    );
}


/* =========================
   CHUẨN HÓA RETURN URL
========================= */

function getSafeReturnUrl(
    url:
        string,
): string | null {

    if (
        !url ||
        url === '/' ||
        !url.startsWith('/') ||
        url.startsWith('//') ||
        url === '/login' ||
        url.startsWith('/login?')
    ) {
        return null;
    }


    return url;
}