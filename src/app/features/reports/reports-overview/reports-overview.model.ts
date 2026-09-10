export interface ReportsOverviewFilter {
    thang: number | null;
    nam: number;
    maPB: number | null;
}

export interface ReportsOverviewStats {
    tongNhanVien: number;
    nhanVienDangLam: number;
    tongPhongBan: number;
    tongQuyLuong: number;
    tyLeChamCong: number;
    donNghiChoDuyet: number;
}

export interface ReportsPayrollSummary {
    tongLuongCoBan: number;
    tongPhuCap: number;
    tongThuong: number;
    tongKhauTru: number;
    tongThucLinh: number;
}

export interface ReportsDecisionSummary {
    tongKhenThuong: number;
    tongKyLuat: number;
    tongTienKhenThuong: number;
    tongTienKyLuat: number;
}

export interface ReportsDepartmentRow {
    maPB: number;
    tenPB: string;
    tongNhanVien: number;
    nhanVienDangLam: number;
    tongNgayCong: number;
    tongThucLinh: number;
}

export interface ReportsMonthlyPoint {
    thang: number;
    nam: number;
    tongNhanVien: number;
    tongNgayCong: number;
    tongNghiPhep: number;
    tongThucLinh: number;
}

export interface ReportsDepartmentOption {
    maPB: number;
    tenPB: string;
}

export interface ReportsMonthOption {
    value: number;
    label: string;
}

