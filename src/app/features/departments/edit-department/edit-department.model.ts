import { PhongBanTrangThai } from '../../../core/constants/status.constants';

export interface DepartmentEditForm {
    maPB: number;
    tenPB: string;
    moTa: string;
    trangThai: PhongBanTrangThai;
}
