import {
    NghiPhepTrangThai,
} from '../../../core/constants/status.constants';

export interface LeaveListItem {
    maNP: number;
    maNV: number;
    hoTen: string;
    tenPB: string | null;

    maLoaiNP: number;
    tenLoaiNP: string;

    tuNgay: string;
    denNgay: string;
    soNgay: number;

    lyDo: string | null;
    trangThai: NghiPhepTrangThai;

    nguoiDuyet: number | null;
    tenNguoiDuyet: string | null;
}

export interface LeaveListStats {
    choDuyet: number;
    daDuyetHomNay: number;
    tongDonTrongThang: number;
    tongNgayNghi: number;
    tyLeVangMat: number;
    nhanVienDangNghi: number;
}

export interface LeaveDepartmentOption {
    maPB: number;
    tenPB: string;
}

export interface LeaveTypeOption {
    maLoaiNP: number;
    tenLoaiNP: string;
}

export interface LeaveSidebarItem {
    label: string;
    icon: string;
    route: string;
}