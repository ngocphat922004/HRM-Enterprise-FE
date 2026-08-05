export type EmployeeProfileTab =
    | 'personal'
    | 'work'
    | 'contract'
    | 'attendance'
    | 'salary'
    | 'history';

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}

export interface EmployeeProfileTabItem {
    id: EmployeeProfileTab;
    label: string;
}

export interface EmergencyContact {
    name: string;
    relationship: string;
    phoneNumber: string;
}

export interface EmployeeProfile {
    id: number;
    initials: string;
    avatarUrl: string;
    employeeCode: string;
    fullName: string;
    status: 'working' | 'probation' | 'on-leave' | 'resigned';
    statusLabel: string;
    position: string;
    department: string;
    companyEmail: string;
    personalEmail: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    identityNumber: string;
    ethnicity: string;
    religion: string;
    nationality: string;
    permanentAddress: string;
    temporaryAddress: string;
    emergencyContact: EmergencyContact;
}
