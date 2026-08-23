import { NhanVienPhuCapTrangThai } from '../../../core/constants/status.constants';

export interface NhanVienPhuCap {
    maNV: number;
    maPC: number;
    ngayApDung: string;
    trangThai: NhanVienPhuCapTrangThai;
}

export interface CreateNhanVienPhuCapRequest {
    maNV: number;
    maPC: number;
    ngayApDung: string;
    trangThai?: NhanVienPhuCapTrangThai;
}

export interface UpdateNhanVienPhuCapRequest {
    ngayApDung: string;
    trangThai: NhanVienPhuCapTrangThai;
}