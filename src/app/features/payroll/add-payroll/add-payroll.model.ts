export interface AddPayrollEmployeeOption {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
}

export interface AddPayrollForm {
    maNV: number | null;
    thang: number;
    nam: number;
}

export interface AddPayrollMonthOption {
    value: number;
    label: string;
}
