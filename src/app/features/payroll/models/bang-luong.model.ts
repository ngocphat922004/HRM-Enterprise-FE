export interface BangLuong {
    maLuong: number;
    maNV: number;
    thang: number;
    nam: number;
    luongCoBan: number;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    soNgayCong: number;
    tongLuong: number;
}

export interface CreateBangLuongRequest {
    maNV: number;
    thang: number;
    nam: number;
    luongCoBan: number;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    soNgayCong: number;
    tongLuong: number;
}

export type UpdateBangLuongRequest =
    CreateBangLuongRequest;