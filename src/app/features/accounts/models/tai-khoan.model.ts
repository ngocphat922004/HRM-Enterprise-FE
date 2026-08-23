import { TaiKhoanTrangThai } from '../../../core/constants/status.constants';

export interface TaiKhoan {
    maTK: number;
    tenDangNhap: string;
    maNV: number;
    maQuyen: number;
    trangThai: TaiKhoanTrangThai;
}

export interface TaiKhoanChiTiet
    extends TaiKhoan {
    tenQuyen: string;
}

export interface CreateTaiKhoanRequest {
    tenDangNhap: string;
    matKhau: string;
    maNV: number;
    maQuyen: number;
    trangThai?: TaiKhoanTrangThai;
}

export interface UpdateTaiKhoanRequest {
    tenDangNhap: string;
    maNV: number;
    maQuyen: number;
    trangThai: TaiKhoanTrangThai;
}