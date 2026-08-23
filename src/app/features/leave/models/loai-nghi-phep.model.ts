export interface LoaiNghiPhep {
    maLoaiNP: number;
    tenLoaiNP: string;
    moTa: string | null;
}

export interface CreateLoaiNghiPhepRequest {
    tenLoaiNP: string;
    moTa: string | null;
}

export type UpdateLoaiNghiPhepRequest =
    CreateLoaiNghiPhepRequest;