export interface PhuCap {
    maPC: number;
    tenPC: string;
    soTien: number;
    moTa: string | null;
}

export interface CreatePhuCapRequest {
    tenPC: string;
    soTien: number;
    moTa: string | null;
}

export type UpdatePhuCapRequest =
    CreatePhuCapRequest;