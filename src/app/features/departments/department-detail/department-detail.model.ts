export type DepartmentEmployeeStatus =
    | 'working'
    | 'probation'
    | 'leave';

export interface DepartmentDetail {
    id: number;
    name: string;
    code: string;
    managerName: string;
    managerInitials: string;
    establishedDate: string;
    description: string;
}

export interface DepartmentEmployee {
    id: number;
    fullName: string;
    email: string;
    position: string;
    joinDate: string;
    status: DepartmentEmployeeStatus;
    initials: string;
}

export interface DepartmentActivity {
    id: number;
    title: string;
    time: string;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}
