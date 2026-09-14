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
    maCV: number;
    tenCV: string;
    moTa: string | null;
}