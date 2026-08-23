import {
    Quyen,
    UpdateQuyenRequest,
} from '../../accounts/models/quyen.model';

export interface EditRoleData
    extends Quyen {
    soTaiKhoan: number;
}

export type EditRoleForm =
    UpdateQuyenRequest;

export interface EditRoleSidebarItem {
    label: string;
    icon: string;
    route: string;
}

