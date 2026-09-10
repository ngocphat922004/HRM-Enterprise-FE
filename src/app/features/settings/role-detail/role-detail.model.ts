import {
    Quyen,
} from '../../accounts/models/quyen.model';
import {
    TaiKhoan,
} from '../../accounts/models/tai-khoan.model';

export interface RoleDetailAccountItem
    extends TaiKhoan {
    hoTen: string;
    email: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

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

