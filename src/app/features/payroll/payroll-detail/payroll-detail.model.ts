import { BangLuong } from '../models/bang-luong.model';

export interface PayrollDetail
    extends BangLuong {
    hoTen: string;
    email: string | null;
    sdt: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface PayrollDetailSummary {
    tongKhoanCong: number;
    tongKhauTru: number;
    tongThucLinh: number;
}

