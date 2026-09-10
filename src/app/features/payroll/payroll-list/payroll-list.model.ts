export interface PayrollListItem {
    maLuong: number;
    maNV: number;

    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;

    thang: number;
    nam: number;

    luongCoBan: number;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    soNgayCong: number;
    tongLuong: number;
}

export interface PayrollListStats {
    tongNhanVien: number;
    tongLuongCoBan: number;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    tongThucLinh: number;
}

export interface PayrollDepartmentOption {
    maPB: number;
    tenPB: string;
}

export interface PayrollMonthOption {
    value: number;
    label: string;
}

