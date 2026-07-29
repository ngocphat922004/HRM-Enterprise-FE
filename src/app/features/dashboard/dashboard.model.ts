export type StatTheme =
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

export interface DashboardStat {
    title: string;
    value: string;
    description: string;
    icon: string;
    theme: StatTheme;
}

export interface EmployeeItem {
    name: string;
    position: string;
    employeeCode: string;
    initials: string;
}

export type LeaveStatus =
    | 'pending'
    | 'approved'
    | 'rejected';

export interface LeaveRequestItem {
    id: number;
    employeeName: string;
    leaveType: string;
    numberOfDays: number;
    initials: string;
    status: LeaveStatus;
}

export interface ExpiringContractItem {
    employeeName: string;
    expiryDate: string;
    remainingDays: number;
}

export interface DepartmentRatio {
    name: string;
    value: number;
    className: string;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}