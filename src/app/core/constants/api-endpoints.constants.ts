export const API_ENDPOINTS = {
    auth: {
        login: '/api/auth/login',
    },

    // Nhân sự
    phongBan: '/api/phong-bans',
    phongBanById: (id: number) => `/api/phong-bans/${id}`,

    chucVu: '/api/chuc-vus',
    chucVuById: (id: number) => `/api/chuc-vus/${id}`,

    trinhDo: '/api/trinh-dos',
    trinhDoById: (id: number) => `/api/trinh-dos/${id}`,

    nhanVien: '/api/nhan-viens',
    nhanVienMe: '/api/nhan-viens/me',
    nhanVienById: (id: number) => `/api/nhan-viens/${id}`,

    // Hợp đồng
    loaiHopDong: '/api/loai-hop-dongs',
    loaiHopDongById: (id: number) => `/api/loai-hop-dongs/${id}`,

    hopDong: '/api/hop-dongs',
    hopDongMe: '/api/hop-dongs/me',
    hopDongById: (id: number) => `/api/hop-dongs/${id}`,

    // Chấm công
    loaiCa: '/api/loai-cas',
    loaiCaById: (id: number) => `/api/loai-cas/${id}`,

    chamCong: '/api/cham-congs',
    chamCongMe: '/api/cham-congs/me',
    chamCongById: (id: number) => `/api/cham-congs/${id}`,

    // Nghỉ phép
    loaiNghiPhep: '/api/loai-nghi-pheps',
    loaiNghiPhepById: (id: number) => `/api/loai-nghi-pheps/${id}`,

    nghiPhep: '/api/nghi-pheps',
    nghiPhepMe: '/api/nghi-pheps/me',
    nghiPhepById: (id: number) => `/api/nghi-pheps/${id}`,
    nghiPhepApprove: (id: number) => `/api/nghi-pheps/${id}/approve`,
    nghiPhepReject: (id: number) => `/api/nghi-pheps/${id}/reject`,

    // Lương - phụ cấp
    phuCap: '/api/phu-caps',
    phuCapById: (id: number) => `/api/phu-caps/${id}`,

    nhanVienPhuCap: '/api/nhan-vien-phu-caps',
    nhanVienPhuCapMe: '/api/nhan-vien-phu-caps/me',
    nhanVienPhuCapById: (maNV: number, maPC: number) =>
        `/api/nhan-vien-phu-caps/${maNV}/${maPC}`,

    bangLuong: '/api/bang-luongs',
    bangLuongMe: '/api/bang-luongs/me',
    bangLuongById: (id: number) => `/api/bang-luongs/${id}`,
    bangLuongTinhLuong: '/api/bang-luongs/tinh-luong',

    // Khen thưởng - kỷ luật
    khenThuongKyLuat: '/api/khen-thuong-ky-luats',
    khenThuongKyLuatMe: '/api/khen-thuong-ky-luats/me',
    khenThuongKyLuatById: (id: number) =>
        `/api/khen-thuong-ky-luats/${id}`,

    // Tài khoản - phân quyền
    quyen: '/api/quyens',
    quyenById: (id: number) => `/api/quyens/${id}`,

    taiKhoan: '/api/tai-khoans',
    taiKhoanById: (id: number) => `/api/tai-khoans/${id}`,

    // Import nhân viên Excel
    nhanVienImport: {
        preview: '/api/NhanVienImport/preview',
        import: '/api/NhanVienImport/import',
    },

    // Dashboard - thống kê
    thongKe: {
        tongQuan: '/api/thong-ke/tong-quan',
        quyLuong: '/api/thong-ke/quy-luong',
        chamCong: '/api/thong-ke/cham-cong',
        nghiPhep: '/api/thong-ke/nghi-phep',
        nhanVienTheoPhongBan:
            '/api/thong-ke/nhan-vien-theo-phong-ban',
        nhanVienTheoChucVu:
            '/api/thong-ke/nhan-vien-theo-chuc-vu',
        nhanVienTheoTrangThai:
            '/api/thong-ke/nhan-vien-theo-trang-thai',
        hopDongSapHetHan:
            '/api/thong-ke/hop-dong-sap-het-han',
    },

    // AI Assistant HRM
    ai: {
        ask: '/api/ai/ask',
    },
} as const;
