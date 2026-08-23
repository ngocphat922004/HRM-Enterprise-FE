import {
    KhenThuongKyLuat,
} from '../models/khen-thuong-ky-luat.model';

/**
 * Bản ghi dùng trên trang danh sách.
 * Thông tin nhân viên được Backend JOIN để hiển thị.
 */
export interface RewardsDisciplineListItem
    extends KhenThuongKyLuat {
    hoTen: string;
    email: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface RewardsDisciplineListStats {
    tongQuyetDinh: number;
    tongKhenThuong: number;
    tongKyLuat: number;
    tongSoTien: number;
}

export interface RewardsDisciplineDepartmentOption {
    maPB: number;
    tenPB: string;
}

export interface RewardsDisciplineSidebarItem {
    label: string;
    icon: string;
    route: string;
}
