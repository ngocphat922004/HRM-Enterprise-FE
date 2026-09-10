import {
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';

export type SettingsSection =
    | 'accounts'
    | 'roles';

export interface SettingsAccountListItem {
    maTK: number;
    tenDangNhap: string;
    maNV: number;
    hoTen: string;
    email: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
    maQuyen: number;
    tenQuyen: string;
    trangThai: string;
}

export interface SettingsRoleListItem {
    maQuyen: number;
    tenQuyen: string;
    moTa: string | null;
    soTaiKhoan: number;
}

export interface SettingsOverviewStats {
    tongTaiKhoan: number;
    taiKhoanHoatDong: number;
    taiKhoanBiKhoa: number;
    tongQuyen: number;
}

export interface SettingsRoleOption {
    maQuyen: number;
    tenQuyen: string;
}

export interface SettingsStatusOption {
    value: TaiKhoanTrangThai;
    label: string;
}

