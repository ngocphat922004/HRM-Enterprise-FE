export const MA_QUYEN = {
    QUAN_TRI_VIEN: 1,
    NHAN_VIEN_NHAN_SU: 2,
    KE_TOAN: 3,
    TRUONG_PHONG: 4,
    BAN_GIAM_DOC: 5,
    NHAN_VIEN: 6,
} as const;

export type MaQuyen =
    (typeof MA_QUYEN)[
    keyof typeof MA_QUYEN
    ];

export const TEN_QUYEN = {
    QUAN_TRI_VIEN: 'Quản trị viên',
    NHAN_VIEN_NHAN_SU:
        'Nhân viên nhân sự',
    KE_TOAN: 'Kế toán',
    TRUONG_PHONG: 'Trưởng phòng',
    BAN_GIAM_DOC: 'Ban giám đốc',
    NHAN_VIEN: 'Nhân viên',
} as const;

export type TenQuyen =
    (typeof TEN_QUYEN)[
    keyof typeof TEN_QUYEN
    ];