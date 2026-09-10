import { NhanVienPhuCapTrangThai } from '../../../core/constants/status.constants';

export type EmployeeEditTab = 'personal' | 'work' | 'allowances';

export interface EditEmployeeForm {
    id: number;
    employeeCode: string;
    fullName: string;
    status: 'working' | 'on-leave' | 'resigned';
    dateOfBirth: string;
    gender: string;
    identityNumber: string;
    permanentAddress: string;
    personalEmail: string;
    phoneNumber: string;
    avatarPreview: string;
    maPB: number | null;
    maCV: number | null;
    maTD: number | null;
    joinDate: string;
}

export interface EditEmployeeTab {
    id: EmployeeEditTab;
    label: string;
}

export interface EditEmployeeAllowanceItem {
    maPC: number;
    tenPC: string;
    soTien: number;
    moTa: string | null;
    ngayApDung: string;
    trangThai: NhanVienPhuCapTrangThai;
}

export interface EditEmployeeAllowanceForm {
    maPC: number | null;
    ngayApDung: string;
    trangThai: NhanVienPhuCapTrangThai;
}
