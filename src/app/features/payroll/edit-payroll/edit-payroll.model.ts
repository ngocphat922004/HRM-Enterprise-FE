export interface EditPayrollEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface EditPayrollForm {
    maNV: number | null;
    thang: number;
    nam: number;
    luongCoBan: number | null;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    soNgayCong: number | null;
}

export interface EditPayrollSummary {
    luongTheoNgayCong: number;
    tongKhoanCong: number;
    tongKhauTru: number;
    tongLuongDuKien: number;
}

export interface EditPayrollMonthOption {
    value: number;
    label: string;
}

export interface EditPayrollSidebarItem {
    label: string;
    icon: string;
    route: string;
}