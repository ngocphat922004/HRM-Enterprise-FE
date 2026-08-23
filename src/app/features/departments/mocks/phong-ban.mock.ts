import { PHONG_BAN_TRANG_THAI } from '../../../core/constants/status.constants';
import { PhongBan } from '../models/phong-ban.model';

export const PHONG_BAN_MOCK_DELAY = 500;

export const PHONG_BAN_MOCK_DATA:
    readonly PhongBan[] = [
        {
            maPB: 1,
            tenPB: 'Phòng Công nghệ Thông tin',
            moTa:
                'Quản lý và vận hành hệ thống công nghệ thông tin.',
            trangThai:
                PHONG_BAN_TRANG_THAI.DANG_HOAT_DONG,
        },
        {
            maPB: 2,
            tenPB: 'Phòng Nhân sự',
            moTa:
                'Quản lý nhân sự, tuyển dụng và đào tạo.',
            trangThai:
                PHONG_BAN_TRANG_THAI.DANG_HOAT_DONG,
        },
        {
            maPB: 3,
            tenPB: 'Phòng Kế toán',
            moTa:
                'Quản lý tài chính, kế toán và tiền lương.',
            trangThai:
                PHONG_BAN_TRANG_THAI.DANG_HOAT_DONG,
        },
        {
            maPB: 4,
            tenPB: 'Phòng Kinh doanh',
            moTa:
                'Phụ trách hoạt động kinh doanh và khách hàng.',
            trangThai:
                PHONG_BAN_TRANG_THAI.NGUNG_HOAT_DONG,
        },
    ];