export interface Quyen {
    maQuyen: number;
    tenQuyen: string;
    moTa: string | null;
}

export interface CreateQuyenRequest {
    tenQuyen: string;
    moTa: string | null;
}

export type UpdateQuyenRequest =
    CreateQuyenRequest;