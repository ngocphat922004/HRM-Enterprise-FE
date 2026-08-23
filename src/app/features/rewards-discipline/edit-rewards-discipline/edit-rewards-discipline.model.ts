import { KhenThuongKyLuatLoai } from '../../../core/constants/status.constants';

export interface EditRewardsDisciplineEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface EditRewardsDisciplineForm {
    maNV: number | null;
    loai: KhenThuongKyLuatLoai | '';
    lyDo: string;
    soTien: number | null;
    ngayQuyetDinh: string;
}

export interface EditRewardsDisciplineSidebarItem {
    label: string;
    icon: string;
    route: string;
}
