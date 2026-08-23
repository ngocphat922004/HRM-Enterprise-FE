import { PhongBanTrangThai } from '../../../core/constants/status.constants';

export interface PhongBan {
    maPB: number;
    tenPB: string;
    moTa: string | null;
    trangThai: PhongBanTrangThai;
}

export interface CreatePhongBanRequest {
    tenPB: string;
    moTa: string | null;
    trangThai?: PhongBanTrangThai;
}

export interface UpdatePhongBanRequest {
    tenPB: string;
    moTa: string | null;
    trangThai: PhongBanTrangThai;
}