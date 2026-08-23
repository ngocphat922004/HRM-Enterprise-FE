import { ChamCongTrangThai } from '../../../core/constants/status.constants';

export interface AttendanceOverviewStats {
    tongNhanVien: number;
    coMat: number;
    diMuon: number;
    vangKhongPhep: number;
    lamThemGio: number;
    tyLeDungGio: number;
    tongGioLamThem: number;
}

export interface AttendanceTrendItem {
    ngay: string;
    nhanNgay: string;
    dungGio: number;
    diMuon: number;
    vang: number;
}

export interface AttendanceAttentionItem {
    maCC: number | null;
    maNV: number;
    hoTen: string;
    tenPB: string | null;
    ngayChamCong: string;
    gioVao: string | null;
    gioRa: string | null;
    soGioLam: number;
    trangThai: ChamCongTrangThai;
}

export interface AttendanceDepartmentOption {
    maPB: number;
    tenPB: string;
}

export interface AttendanceSidebarItem {
    label: string;
    icon: string;
    route: string;
}