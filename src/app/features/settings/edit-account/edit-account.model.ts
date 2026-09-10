import {
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';
import {
    TaiKhoanChiTiet,
} from '../../accounts/models/tai-khoan.model';

export interface EditAccountData
    extends TaiKhoanChiTiet {
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface EditAccountEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
    daCoTaiKhoan: boolean;
}

export interface EditAccountRoleOption {
    maQuyen: number;
    tenQuyen: string;
    moTa: string | null;
}

export interface EditAccountForm {
    tenDangNhap: string;
    matKhau: string;
    xacNhanMatKhau: string;
    maNV: number | null;
    maQuyen: number | null;
    trangThai: TaiKhoanTrangThai | '';
}

