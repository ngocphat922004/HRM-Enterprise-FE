export type PositionStaffingFilter =
    | ''
    | 'filled'
    | 'vacant';

export type PositionAllowanceFilter =
    | ''
    | 'with'
    | 'without';

export interface PositionListItem {
    maCV: number;
    tenCV: string;
    moTa: string | null;
    heSoPhuCap: number;
    employeeCount: number;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}