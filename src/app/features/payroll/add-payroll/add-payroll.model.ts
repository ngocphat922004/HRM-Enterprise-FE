export interface AddPayrollEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
    luongCoBanHopDong: number | null;
}

export interface AddPayrollForm {
    maNV: number | null;
    thang: number;
    nam: number;

    luongCoBan: number | null;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    soNgayCong: number | null;
}

export interface AddPayrollSummary {
    luongTheoNgayCong: number;
    tongKhoanCong: number;
    tongKhauTru: number;
    tongLuongDuKien: number;
}

export interface AddPayrollMonthOption {
    value: number;
    label: string;
}

export interface AddPayrollSidebarItem {
    label: string;
    icon: string;
    route: string;
}