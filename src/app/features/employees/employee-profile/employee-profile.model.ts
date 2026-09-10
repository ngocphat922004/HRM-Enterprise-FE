import {
    HopDongTrangThai,
    NhanVienPhuCapTrangThai,
} from '../../../core/constants/status.constants';

export type EmployeeProfileTab =
    | 'personal'
    | 'work'
    | 'contract'
    | 'attendance'
    | 'salary'
    | 'history';

export interface EmployeeProfileTabItem {
    id: EmployeeProfileTab;
    label: string;
}

export interface EmployeeProfile {
    id: number;
    initials: string;
    avatarUrl: string;
    employeeCode: string;
    fullName: string;
    status: 'working' | 'probation' | 'on-leave' | 'resigned';
    statusLabel: string;
    position: string;
    department: string;
    joinDate: string;
    personalEmail: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    identityNumber: string;
    permanentAddress: string;
}

export interface EmployeeAttendanceHistoryItem {
    maCC: number;
    maCa: number;
    tenCa: string;
    ngayChamCong: string;
    gioVao: string;
    gioRa: string;
    soGioLam: number;
    trangThai: string;
    ghiChu: string | null;
}

export interface EmployeeLeaveHistoryItem {
    maNP: number;
    maLoaiNP: number;
    tenLoaiNP: string;
    tuNgay: string;
    denNgay: string;
    lyDo: string | null;
    trangThai: string;
    nguoiDuyet: number | null;
    nguoiDuyetLabel: string;
}

export interface EmployeePayrollHistoryItem {
    maLuong: number;
    thang: number;
    nam: number;
    luongCoBan: number;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    soNgayCong: number;
    tongLuong: number;
}

export interface EmployeeAllowanceHistoryItem {
    maPC: number;
    tenPC: string;
    soTien: number;
    moTa: string | null;
    ngayApDung: string;
    trangThai: NhanVienPhuCapTrangThai;
}

export type EmployeeProfileHistoryCategory =
    | 'employment'
    | 'contract'
    | 'leave'
    | 'allowance'
    | 'payroll'
    | 'reward'
    | 'discipline';

export interface EmployeeProfileHistoryItem {
    id: string;
    category: EmployeeProfileHistoryCategory;
    categoryLabel: string;
    dateLabel: string;
    sortValue: number;
    title: string;
    description: string;
    reference: string;
    amount: number | null;
}

export interface EmployeeContractHistoryItem {
    maHD: number;
    maNV: number;
    maLoaiHD: number;
    tenLoaiHD: string;
    ngayBatDau: string;
    ngayKetThuc: string | null;
    luongCoBan: number;
    trangThai: HopDongTrangThai;
    isCurrent: boolean;
    statusLabel: 'Còn hiệu lực' | 'Hết hạn';
}
