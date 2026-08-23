import { ApiResponse } from './api-response.model';

export interface LoginData {
    accessToken: string;
    maTK: number;
    tenDangNhap: string;
    maNV: number;
    maQuyen: number;
    tenQuyen: string;
}

export type LoginResponse = ApiResponse<LoginData>;