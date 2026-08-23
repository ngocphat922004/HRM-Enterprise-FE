import {
    HttpErrorResponse,
    HttpInterceptorFn,
} from '@angular/common/http';
import {
    catchError,
    throwError,
} from 'rxjs';

export const apiErrorInterceptor:
    HttpInterceptorFn = (
        request,
        next,
    ) =>
        next(request).pipe(
            catchError((error: unknown) => {
                if (
                    !(
                        error instanceof
                        HttpErrorResponse
                    )
                ) {
                    return throwError(
                        () => error,
                    );
                }

                return throwError(
                    () =>
                        new Error(
                            resolveApiErrorMessage(
                                error,
                            ),
                        ),
                );
            }),
        );

function resolveApiErrorMessage(
    error: HttpErrorResponse,
): string {
    const responseBody: unknown =
        error.error;

    if (
        typeof responseBody ===
        'object' &&
        responseBody !== null &&
        'message' in responseBody
    ) {
        const message = (
            responseBody as {
                message?: unknown;
            }
        ).message;

        if (
            typeof message === 'string' &&
            message.trim()
        ) {
            return message;
        }
    }

    const messages:
        Record<number, string> = {
        0: 'Không thể kết nối đến máy chủ.',
        400: 'Dữ liệu gửi lên không hợp lệ.',
        401: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
        403: 'Bạn không có quyền thực hiện chức năng này.',
        404: 'Không tìm thấy dữ liệu yêu cầu.',
        409: 'Dữ liệu đã tồn tại hoặc đang bị xung đột.',
        500: 'Đã xảy ra lỗi hệ thống.',
    };

    return (
        messages[error.status] ??
        'Đã xảy ra lỗi khi xử lý yêu cầu.'
    );
}