export type PositionStaffingFilter =
    | ''
    | 'filled'
    | 'vacant';

export interface PositionListItem {
    maCV: number;
    tenCV: string;
    moTa: string | null;
    employeeCount: number;
}