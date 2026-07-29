export interface LoginResponse {
    accessToken: string;
    user: {
        id: number;
        fullName: string;
        email: string;
        role: 'Admin' | 'HR' | 'Manager' | 'Employee';
    };
}