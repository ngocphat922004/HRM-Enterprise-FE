export interface PositionDetail {
    maCV: number;
    tenCV: string;
    moTa: string | null;
    heSoPhuCap: number;
    employeeCount: number;
}

export interface PositionEmployee {
    maNV: number;
    hoTen: string;
    email: string | null;
    tenPB: string | null;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}