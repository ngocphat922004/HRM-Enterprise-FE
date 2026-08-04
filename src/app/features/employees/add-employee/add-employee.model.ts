export type Gender = 'male' | 'female' | 'other';

export interface PersonalInformationForm {
    fullName: string;
    employeeCode: string;
    dateOfBirth: string;
    gender: Gender | '';
    nationality: string;
    identityNumber: string;
    permanentAddress: string;
    phoneNumber: string;
    personalEmail: string;
    avatarPreview: string;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}

export interface FormTab {
    id: 'personal' | 'work' | 'salary' | 'account';
    label: string;
    icon: string;
}