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
}

export interface EditPayrollMonthOption {
    value: number;
    label: string;
}
