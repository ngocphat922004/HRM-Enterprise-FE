export type DepartmentStatus =
    | 'active'
    | 'paused'
    | 'inactive';

export interface Department {
    id: number;
    code: string;
    name: string;
    location: string;
    managerName: string;
    managerTitle: string;
    managerInitials: string;
    employeeCount: number;
    capacity: number;
    status: DepartmentStatus;
}

