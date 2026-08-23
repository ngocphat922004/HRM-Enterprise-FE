export interface AddLeaveEmployeeOption {
    maNV: number;
    hoTen: string;
    tenPB: string | null;
    email: string | null;
}

export interface AddLeaveTypeOption {
    maLoaiNP: number;
    tenLoaiNP: string;
    moTa: string | null;
}

export interface AddLeaveApprover {
    maNV: number;
    hoTen: string;
    chucVu: string | null;
}

export interface AddLeaveSummary {
    soNgayPhepCon: number;
    soNgayNghiDuKien: number;
}

export interface AddLeaveSidebarItem {
    label: string;
    icon: string;
    route: string;
}