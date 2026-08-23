import {
    Quyen,
} from '../../accounts/models/quyen.model';
import {
    TaiKhoan,
} from '../../accounts/models/tai-khoan.model';

/**
 * Tài khoản đang sử dụng quyền, kèm thông tin nhân viên để hiển thị.
 */
export interface RoleDetailAccountItem
    extends TaiKhoan {
    hoTen: string;
    email: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

/**
 * Dữ liệu chi tiết quyền và các tài khoản liên kết.
 */
export interface RoleDetail
    extends Quyen {
    soTaiKhoan: number;
    taiKhoanSuDung:
    RoleDetailAccountItem[];
}

export interface RoleDetailSummary {
    tongTaiKhoan: number;
    dangHoatDong: number;
    biKhoa: number;
    ngungHoatDong: number;
}

export interface RoleDetailSidebarItem {
    label: string;
    icon: string;
    route: string;
}
