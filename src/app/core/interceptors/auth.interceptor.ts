import {
    HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { StorageService } from '../services/storage.service';

export const authInterceptor:
    HttpInterceptorFn = (
        request,
        next,
    ) => {
        const storageService =
            inject(StorageService);

        const token =
            storageService.getToken();

        const isApiRequest =
            request.url.startsWith(
                environment.apiBaseUrl,
            ) ||
            request.url.startsWith('/api/');

        if (!token || !isApiRequest) {
            return next(request);
        }

        const authenticatedRequest =
            request.clone({
                setHeaders: {
                    Authorization:
                        `Bearer ${token}`,
                },
            });

        return next(
            authenticatedRequest,
        );
    };