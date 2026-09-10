import {
    HopDongTrangThai,
} from '../../../core/constants/status.constants';

export interface ContractDetail {
    maHD: number;
    maNV: number;
    tenNV: string;
    maLoaiHD: number;
    tenLoaiHD: string;
    ngayBatDau: string;
    ngayKetThuc: string | null;
    luongCoBan: number;
    trangThai: HopDongTrangThai;
}
