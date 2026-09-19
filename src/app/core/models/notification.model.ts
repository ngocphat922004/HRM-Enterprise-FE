export interface ThongBao {
    maThongBao: number;
    tieuDe: string;
    noiDung: string;
    daDoc: boolean;
    ngayTao: string;
    duongDan: string;
}

export interface ThongBaoListResponse {
    success: boolean;
    message: string;
    data: ThongBao[];
}

export interface MarkThongBaoReadResponse {
    success: boolean;
    message: string;
}
