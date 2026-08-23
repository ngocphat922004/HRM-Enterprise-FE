export const PHONG_BAN_TRANG_THAI = {
    DANG_HOAT_DONG: 'Đang hoạt động',
    NGUNG_HOAT_DONG: 'Ngừng hoạt động',
} as const;

export type PhongBanTrangThai =
    (typeof PHONG_BAN_TRANG_THAI)[
    keyof typeof PHONG_BAN_TRANG_THAI
    ];

export const NHAN_VIEN_TRANG_THAI = {
    DANG_LAM_VIEC: 'Đang làm việc',
    TAM_NGHI: 'Tạm nghỉ',
    DA_NGHI_VIEC: 'Đã nghỉ việc',
} as const;

export type NhanVienTrangThai =
    (typeof NHAN_VIEN_TRANG_THAI)[
    keyof typeof NHAN_VIEN_TRANG_THAI
    ];

export const HOP_DONG_TRANG_THAI = {
    CON_HIEU_LUC: 'Còn hiệu lực',
    HET_HIEU_LUC: 'Hết hiệu lực',
} as const;

export type HopDongTrangThai =
    (typeof HOP_DONG_TRANG_THAI)[
    keyof typeof HOP_DONG_TRANG_THAI
    ];

export const CHAM_CONG_TRANG_THAI = {
    CHUA_XAC_DINH: 'Chưa xác định',
    DU_CONG: 'Đủ công',
    DI_TRE: 'Đi trễ',
    VE_SOM: 'Về sớm',
    VANG_CO_PHEP: 'Vắng có phép',
    VANG_KHONG_PHEP: 'Vắng không phép',
    NGHI_PHEP: 'Nghỉ phép',
} as const;

export type ChamCongTrangThai =
    (typeof CHAM_CONG_TRANG_THAI)[
    keyof typeof CHAM_CONG_TRANG_THAI
    ];

export const NGHI_PHEP_TRANG_THAI = {
    CHO_DUYET: 'Chờ duyệt',
    DA_DUYET: 'Đã duyệt',
    TU_CHOI: 'Từ chối',
} as const;

export type NghiPhepTrangThai =
    (typeof NGHI_PHEP_TRANG_THAI)[
    keyof typeof NGHI_PHEP_TRANG_THAI
    ];

export const NHAN_VIEN_PHU_CAP_TRANG_THAI = {
    DANG_AP_DUNG: 'Đang áp dụng',
    NGUNG_AP_DUNG: 'Ngừng áp dụng',
} as const;

export type NhanVienPhuCapTrangThai =
    (typeof NHAN_VIEN_PHU_CAP_TRANG_THAI)[
    keyof typeof NHAN_VIEN_PHU_CAP_TRANG_THAI
    ];

export const KHEN_THUONG_KY_LUAT_LOAI = {
    KHEN_THUONG: 'Khen thưởng',
    KY_LUAT: 'Kỷ luật',
} as const;

export type KhenThuongKyLuatLoai =
    (typeof KHEN_THUONG_KY_LUAT_LOAI)[
    keyof typeof KHEN_THUONG_KY_LUAT_LOAI
    ];

export const TAI_KHOAN_TRANG_THAI = {
    HOAT_DONG: 'Hoạt động',
    BI_KHOA: 'Bị khóa',
    NGUNG_HOAT_DONG: 'Ngừng hoạt động',
} as const;

export type TaiKhoanTrangThai =
    (typeof TAI_KHOAN_TRANG_THAI)[
    keyof typeof TAI_KHOAN_TRANG_THAI
    ];