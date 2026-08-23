import {
    ChamCongTrangThai,
} from '../../../core/constants/status.constants';

export interface AttendanceCell {
    maCC: number | null;
    ngayChamCong: string;
    day: number;
    maCa: number | null;
    tenCa: string | null;
    gioVao: string | null;
    gioRa: string | null;
    soGioLam: number;
    trangThai: ChamCongTrangThai;
    ghiChu: string | null;
}

export interface AttendanceEmployeeRow {
    maNV: number;
    hoTen: string;
    maPB: number | null;
    tenPB: string | null;
    cells: AttendanceCell[];
}

export interface DepartmentOption {
    maPB: number;
    tenPB: string;
}

export interface AttendanceLegend {
    code: string;
    label: string;
    status: ChamCongTrangThai;
    className: string;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}