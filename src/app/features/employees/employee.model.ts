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
    departmentId: number | null;
    department: string;
    position: string;
    joinDate: string;
    status: EmployeeStatus;
    initials: string;
}

export interface EmployeeDepartmentOption {
    id: number;
    name: string;
}

export interface NewEmployeeForm {
    fullName: string;
    email: string;
    department: string;
    position: string;
    joinDate: string;
}
