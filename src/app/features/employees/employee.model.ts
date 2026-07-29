export type EmployeeStatus =
    | 'working'
    | 'probation'
    | 'on-leave'
    | 'resigned';

export interface Employee {
    id: number;
    fullName: string;
    email: string;
    employeeCode: string;
    department: string;
    position: string;
    joinDate: string;
    status: EmployeeStatus;
    initials: string;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}

export interface NewEmployeeForm {
    fullName: string;
    email: string;
    department: string;
    position: string;
    joinDate: string;
}