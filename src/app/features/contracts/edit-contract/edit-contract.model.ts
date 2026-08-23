import {
    HopDongTrangThai,
} from '../../../core/constants/status.constants';

export interface EditContractForm {
    maHD: number;
    maNV: number | null;
    maLoaiHD: number | null;
    ngayBatDau: string;
    ngayKetThuc: string;
    luongCoBan: number | null;
    trangThai: HopDongTrangThai;
}

export interface ContractNavigationData {
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

export interface EmployeeOption {
    maNV: number;
    hoTen: string;
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