import {
    HopDongTrangThai,
} from '../../../core/constants/status.constants';

export interface ContractListItem {
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

export interface ContractTypeOption {
    maLoaiHD: number;
    tenLoaiHD: string;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}