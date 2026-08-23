import {
    Quyen,
} from '../../accounts/models/quyen.model';

/**
 * Quyền kèm số tài khoản đang sử dụng.
 * soTaiKhoan là dữ liệu thống kê do Backend tổng hợp để hiển thị.
 */
export interface RoleListItem
    extends Quyen {
    soTaiKhoan: number;
}

export interface RoleListStats {
    tongQuyen: number;
    tongTaiKhoan: number;
    quyenDangSuDung: number;
    quyenChuaSuDung: number;
}

export interface RoleListSidebarItem {
    label: string;
    icon: string;
    route: string;
}
