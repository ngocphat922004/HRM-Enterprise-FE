import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  provideClientHydration,
} from '@angular/platform-browser';
import {
  provideRouter,
} from '@angular/router';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig:
  ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,
    }),

    provideRouter(routes),

    provideClientHydration(),

    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
        apiErrorInterceptor,
      ]),
    ),
  ],
};