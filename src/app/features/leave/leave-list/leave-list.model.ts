export interface LeaveListItem {
    maNP: number;
    maNV: number;
    hoTen: string;
    maPB: number | null;
    tenPB: string | null;
    maLoaiNP: number;
    tenLoaiNP: string;
    tuNgay: string;
    denNgay: string;
    soNgay: number;
    lyDo: string | null;
    trangThai: string;
    nguoiDuyet: number | null;
    tenNguoiDuyet: string | null;
}

export interface LeaveListStats {
    choDuyet: number;
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
