import { ChamCongTrangThai } from '../../../core/constants/status.constants';

export interface ChamCong {
    maCC: number;
    maNV: number;
    maCa: number;
    ngayChamCong: string;
    gioVao: string | null;
    gioRa: string | null;
    soGioLam: number;
    trangThai: ChamCongTrangThai;
    ghiChu: string | null;
}

export interface CreateChamCongRequest {
    maNV: number;
    maCa: number;
    ngayChamCong: string;
    gioVao: string | null;
    gioRa: string | null;
    soGioLam?: number;
    trangThai?: ChamCongTrangThai;
    ghiChu: string | null;
}

export interface UpdateChamCongRequest {
    maNV: number;
    maCa: number;
    ngayChamCong: string;
    gioVao: string | null;
    gioRa: string | null;
    soGioLam: number;
    trangThai: ChamCongTrangThai;
    ghiChu: string | null;
}