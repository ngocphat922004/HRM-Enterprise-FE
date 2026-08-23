export const API_ENDPOINTS = {
    auth: {
        login: '/api/auth/login',
    },

    phongBan: '/api/phong-bans',
    chucVu: '/api/chuc-vus',
    trinhDo: '/api/trinh-dos',
    nhanVien: '/api/nhan-viens',
    loaiHopDong: '/api/loai-hop-dongs',
    hopDong: '/api/hop-dongs',
    loaiCa: '/api/loai-cas',
    chamCong: '/api/cham-congs',
    loaiNghiPhep: '/api/loai-nghi-pheps',
    nghiPhep: '/api/nghi-pheps',
    phuCap: '/api/phu-caps',
    nhanVienPhuCap:
        '/api/nhan-vien-phu-caps',
    bangLuong: '/api/bang-luongs',
    khenThuongKyLuat:
        '/api/khen-thuong-ky-luats',
    quyen: '/api/quyens',
    taiKhoan: '/api/tai-khoans',
} as const;