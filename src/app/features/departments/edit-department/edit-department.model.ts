export type DepartmentEditStatus =
    | 'active'
    | 'paused';

export interface DepartmentEditForm {
    id: number;
    name: string;
    code: string;
    managerId: number;
    establishedDate: string;
    description: string;
    location: string;
    status: DepartmentEditStatus;
}

export interface DepartmentManager {
    id: number;
    name: string;
}

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}
