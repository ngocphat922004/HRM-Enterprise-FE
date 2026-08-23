export interface ChucVu {
    maCV: number;
    tenCV: string;
    moTa: string | null;
    heSoPhuCap: number;
}

export interface CreateChucVuRequest {
    tenCV: string;
    moTa: string | null;
    heSoPhuCap?: number;
}

export interface UpdateChucVuRequest {
    tenCV: string;
    moTa: string | null;
    heSoPhuCap: number;
}