import {
    KhenThuongKyLuat,
} from '../models/khen-thuong-ky-luat.model';

export interface RewardsDisciplineListItem
    extends KhenThuongKyLuat {
    hoTen: string;
    email: string | null;
    hinhAnh: string | null;
    maPB: number | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface RewardsDisciplineListStats {
    tongQuyetDinh: number;
    tongKhenThuong: number;
    tongKyLuat: number;
    tongSoTien: number;
}

export interface RewardsDisciplineDepartmentOption {
    maPB: number;
    tenPB: string;
}

