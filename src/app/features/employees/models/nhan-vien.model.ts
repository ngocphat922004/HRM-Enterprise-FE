import { NhanVienTrangThai } from '../../../core/constants/status.constants';

export interface NhanVien {
    maNV: number;
    hoTen: string;
    gioiTinh: string;
    ngaySinh: string;
    cccd: string | null;
    diaChi: string;
    sdt: string | null;
    email: string | null;
    ngayVaoLam: string;
    hinhAnh: string | null;
    maPB: number | null;
    maCV: number | null;
    maTD: number | null;
    trangThai: NhanVienTrangThai;
}

export interface NhanVienChiTiet
    extends NhanVien {
    tenPB: string | null;
    tenCV: string | null;
    tenTD: string | null;
}

export interface CreateNhanVienRequest {
    hoTen: string;
    gioiTinh: string;
    ngaySinh: string;
    cccd: string | null;
    diaChi: string;
    sdt: string | null;
    email: string | null;
    ngayVaoLam: string;
    hinhAnh: string | null;
    maPB: number | null;
    maCV: number | null;
    maTD: number | null;
    trangThai?: NhanVienTrangThai;
}

export interface UpdateNhanVienRequest {
    hoTen: string;
    gioiTinh: string;
    ngaySinh: string;
    cccd: string | null;
    diaChi: string;
    sdt: string | null;
    email: string | null;
    ngayVaoLam: string;
    hinhAnh: string | null;
    maPB: number | null;
    maCV: number | null;
    maTD: number | null;
    trangThai: NhanVienTrangThai;
}