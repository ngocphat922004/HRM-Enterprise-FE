export interface QualificationDetail {
    maTD: number;
    tenTD: string;
    employeeCount: number;
}

export interface QualificationEmployee {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
    tenCV: string | null;
}
