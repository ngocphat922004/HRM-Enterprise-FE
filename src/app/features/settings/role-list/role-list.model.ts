import {
    Quyen,
} from '../../accounts/models/quyen.model';

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

