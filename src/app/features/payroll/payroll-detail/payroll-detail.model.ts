import { BangLuong } from '../models/bang-luong.model';

/**
 * Dữ liệu chi tiết một bản ghi bảng lương.
 * Các trường thông tin nhân viên được Backend JOIN để phục vụ hiển thị.
 */
export interface PayrollDetail
    extends BangLuong {
    hoTen: string;
    email: string | null;
    sdt: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

/**
 * Các số liệu tổng hợp chỉ dùng để trình bày trên giao diện.
 * Backend vẫn là nơi kiểm tra và quyết định kết quả tính lương.
 */
export interface PayrollDetailSummary {
    tongKhoanCong: number;
    tongKhauTru: number;
    tongThucLinh: number;
}

export interface PayrollDetailSidebarItem {
    label: string;
    icon: string;
    route: string;
}