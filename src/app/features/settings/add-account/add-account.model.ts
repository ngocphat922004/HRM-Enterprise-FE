import {
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';

export interface AddAccountEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
    daCoTaiKhoan: boolean;
}

export interface AddAccountRoleOption {
    maQuyen: number;
    tenQuyen: string;
    moTa: string | null;
}

export interface AddAccountForm {
    tenDangNhap: string;
    matKhau: string;
    xacNhanMatKhau: string;
    maNV: number | null;
    maQuyen: number | null;
    trangThai: TaiKhoanTrangThai;
}

export interface AddAccountPasswordRule {
    label: string;
    passed: boolean;
}

