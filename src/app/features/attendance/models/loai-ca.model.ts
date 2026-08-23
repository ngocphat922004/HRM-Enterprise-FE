export interface LoaiCa {
    maCa: number;
    tenCa: string;
    gioBatDau: string;
    gioKetThuc: string;
    soGioQuyDinh: number;
}

export interface CreateLoaiCaRequest {
    tenCa: string;
    gioBatDau: string;
    gioKetThuc: string;
    soGioQuyDinh: number;
}

export type UpdateLoaiCaRequest =
    CreateLoaiCaRequest;