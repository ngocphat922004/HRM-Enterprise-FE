export interface LoaiHopDong {
    maLoaiHD: number;
    tenLoaiHD: string;
    moTa: string | null;
}

export interface CreateLoaiHopDongRequest {
    tenLoaiHD: string;
    moTa: string | null;
}

export type UpdateLoaiHopDongRequest =
    CreateLoaiHopDongRequest;