import { TrinhDo } from '../models/trinh-do.model';

export const TRINH_DO_MOCK_DELAY = 500;

export const TRINH_DO_MOCK_DATA:
    readonly TrinhDo[] = [
        {
            maTD: 1,
            tenTD: 'Trung học phổ thông',
        },
        {
            maTD: 2,
            tenTD: 'Trung cấp',
        },
        {
            maTD: 3,
            tenTD: 'Cao đẳng',
        },
        {
            maTD: 4,
            tenTD: 'Đại học',
        },
        {
            maTD: 5,
            tenTD: 'Thạc sĩ',
        },
        {
            maTD: 6,
            tenTD: 'Tiến sĩ',
        },
    ];