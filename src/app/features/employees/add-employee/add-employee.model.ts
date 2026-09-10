export type Gender = 'male' | 'female' | 'other';

export interface PersonalInformationForm {
    fullName: string;
    employeeCode: string;
    dateOfBirth: string;
    gender: Gender | '';
    identityNumber: string;
    permanentAddress: string;
    phoneNumber: string;
    personalEmail: string;
    avatarPreview: string;
}

export interface WorkInformationForm {
    maPB: number | null;
    maCV: number | null;
    maTD: number | null;
    ngayVaoLam: string;
}

export interface SalaryInformationForm {
    selectedAllowanceIds: number[];
    allowanceStartDate: string;
}

export interface AccountInformationForm {
    createAccount: boolean;
    username: string;
    password: string;
    confirmPassword: string;
    maQuyen: number | null;
    status: string;
}

export interface FormTab {
    id: 'personal' | 'work' | 'salary' | 'account';
    label: string;
    icon: string;
}
