export interface LeaveDetail {
    maNP: number;
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;

    maLoaiNP: number;
    tenLoaiNP: string;

    tuNgay: string;
    denNgay: string;
    soNgay: number;

    lyDo: string | null;
    trangThai: string;

    nguoiDuyet: number | null;
    tenNguoiDuyet: string | null;
    chucVuNguoiDuyet: string | null;
}

export interface LeaveProcessStep {
    order: number;
    title: string;
    description: string;
    completed: boolean;
    active: boolean;
}

