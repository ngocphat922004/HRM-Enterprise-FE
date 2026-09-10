import {
    TaiKhoanChiTiet,
} from '../../accounts/models/tai-khoan.model';

export interface AccountDetail
    extends TaiKhoanChiTiet {
    hoTen: string;
    email: string | null;
    sdt: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

