import { HopDongTrangThai } from '../../../core/constants/status.constants';

export interface HopDong {
    maHD: number;
    maNV: number;
    maLoaiHD: number;
    ngayBatDau: string;
    ngayKetThuc: string | null;
    luongCoBan: number;
    trangThai: HopDongTrangThai;
}

export interface CreateHopDongRequest {
    maNV: number;
    maLoaiHD: number;
    ngayBatDau: string;
    ngayKetThuc: string | null;
    luongCoBan: number;
    trangThai?: HopDongTrangThai;
}

export interface UpdateHopDongRequest {
    maNV: number;
    maLoaiHD: number;
    ngayBatDau: string;
    ngayKetThuc: string | null;
    luongCoBan: number;
    trangThai: HopDongTrangThai;
}