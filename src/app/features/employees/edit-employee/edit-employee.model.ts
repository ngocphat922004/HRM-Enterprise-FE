export type EmployeeEditTab =
    | 'personal'
    | 'work'
    | 'salary'
    | 'documents'
    | 'rewards';

export interface EditEmployeeForm {
    id: number;
    employeeCode: string;
    fullName: string;
    status: 'working' | 'probation' | 'on-leave' | 'resigned';

    dateOfBirth: string;
    gender: string;
    personalEmail: string;
    phoneNumber: string;

    department: string;
    position: string;
    manager: string;

    baseSalary: number;
    salaryLevel: string;
    bankAccount: string;
    bankName: string;

    avatarPreview: string;
}

export interface EmployeeDocument {
    id: number;
    name: string;
    updatedAt: string;
    type: 'pdf' | 'image';
}

export interface EditEmployeeTab {
    id: EmployeeEditTab;
    label: string;
}