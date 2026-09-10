import {
    KhenThuongKyLuatLoai,
} from '../../../core/constants/status.constants';

export interface AddRewardsDisciplineEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface AddRewardsDisciplineForm {
    maNV: number | null;
    loai: KhenThuongKyLuatLoai | '';
    lyDo: string;
    soTien: number | null;
    ngayQuyetDinh: string;
}

