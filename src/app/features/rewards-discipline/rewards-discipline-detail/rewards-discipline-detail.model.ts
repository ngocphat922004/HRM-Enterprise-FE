import {
    KhenThuongKyLuat,
} from '../models/khen-thuong-ky-luat.model';

export interface RewardsDisciplineDetail
    extends KhenThuongKyLuat {
    hoTen: string;
    email: string | null;
    sdt: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

