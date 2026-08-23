import { LoginRequest } from '../../../core/models/login-request.model';
import { LoginResponse } from '../../../core/models/login-response.model';

export interface AuthMockAccount {
    credentials: LoginRequest;
    response: LoginResponse;
}

export const AUTH_MOCK_DELAY = 800;

export const AUTH_MOCK_ACCOUNTS:
    readonly AuthMockAccount[] = [
        {
            credentials: {
                tenDangNhap: 'admin',
                matKhau: '123456',
            },
            response: {
                success: true,
                message: 'Đăng nhập thành công.',
                data: {
                    accessToken:
                        'mock-jwt-token-hrm-enterprise',
                    maTK: 1,
                    tenDangNhap: 'admin',
                    maNV: 1,
                    maQuyen: 1,
                    tenQuyen: 'Quản trị viên',
                },
            },
        },
    ];