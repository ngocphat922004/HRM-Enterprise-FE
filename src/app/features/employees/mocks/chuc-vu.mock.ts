import { ChucVu } from '../models/chuc-vu.model';

export const CHUC_VU_MOCK_DELAY = 500;

export const CHUC_VU_MOCK_DATA:
    readonly ChucVu[] = [
        {
            maCV: 1,
            tenCV: 'Giám đốc',
            moTa:
                'Quản lý và điều hành hoạt động của doanh nghiệp.',
            heSoPhuCap: 1,
        },
        {
            maCV: 2,
            tenCV: 'Trưởng phòng',
            moTa:
                'Quản lý và điều phối công việc của phòng ban.',
            heSoPhuCap: 0.5,
        },
        {
            maCV: 3,
            tenCV: 'Chuyên viên',
            moTa:
                'Thực hiện các công việc chuyên môn.',
            heSoPhuCap: 0.2,
        },
        {
            maCV: 4,
            tenCV: 'Nhân viên',
            moTa:
                'Thực hiện công việc theo sự phân công.',
            heSoPhuCap: 0,
        },
        {
            maCV: 5,
            tenCV: 'Thực tập sinh',
            moTa:
                'Hỗ trợ công việc và tham gia đào tạo thực tế.',
            heSoPhuCap: 0,
        },
    ];