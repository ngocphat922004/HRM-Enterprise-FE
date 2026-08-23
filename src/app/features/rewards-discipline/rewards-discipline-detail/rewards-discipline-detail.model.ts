import {
    KhenThuongKyLuat,
} from '../models/khen-thuong-ky-luat.model';

/**
 * Chi tiết quyết định kèm thông tin nhân viên phục vụ hiển thị.
 */
export interface RewardsDisciplineDetail
    extends KhenThuongKyLuat {
    hoTen: string;
    email: string | null;
    sdt: string | null;
    hinhAnh: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface RewardsDisciplineDetailSidebarItem {
    label: string;
    icon: string;
    route: string;
}
