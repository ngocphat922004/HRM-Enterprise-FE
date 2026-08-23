import {
    HopDongTrangThai,
} from '../../../core/constants/status.constants';

export interface AddContractForm {
    maNV: number | null;
    maLoaiHD: number | null;
    ngayBatDau: string;
    ngayKetThuc: string;
    luongCoBan: number | null;
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