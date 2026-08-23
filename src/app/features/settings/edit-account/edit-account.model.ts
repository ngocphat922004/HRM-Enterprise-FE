import {
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';
import {
    TaiKhoanChiTiet,
} from '../../accounts/models/tai-khoan.model';

/**
 * Dữ liệu tài khoản được Backend trả về khi mở trang chỉnh sửa.
 */
export interface EditAccountData
    extends TaiKhoanChiTiet {
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

/**
 * Nhân viên có thể liên kết với tài khoản.
 */
export interface EditAccountEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
    daCoTaiKhoan: boolean;
}

/**
 * Quyền tài khoản được tải từ Backend.
 */
export interface EditAccountRoleOption {
    maQuyen: number;
    tenQuyen: string;
    moTa: string | null;
}

/**
 * Các trường được phép cập nhật theo UpdateTaiKhoanRequest.
 */
export interface EditAccountForm {
    tenDangNhap: string;
    maNV: number | null;
    maQuyen: number | null;
    trangThai: TaiKhoanTrangThai;
}

export interface EditAccountSidebarItem {
    label: string;
    icon: string;
    route: string;
}
