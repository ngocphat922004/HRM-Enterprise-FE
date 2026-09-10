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

export interface AddLeaveSummary {
    soNgayNghiDuKien: number;
}
