export interface ChucVu {
    maCV: number;
    tenCV: string;
    moTa: string | null;
}

export interface CreateChucVuRequest {
    tenCV: string;
    moTa: string | null;
}

export interface UpdateChucVuRequest {
    tenCV: string;
    moTa: string | null;
}