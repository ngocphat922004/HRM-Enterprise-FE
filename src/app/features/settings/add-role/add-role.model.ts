import {
    CreateQuyenRequest,
} from '../../accounts/models/quyen.model';

export type AddRoleForm =
    CreateQuyenRequest;

export interface AddRoleSidebarItem {
    label: string;
    icon: string;
    route: string;
}
