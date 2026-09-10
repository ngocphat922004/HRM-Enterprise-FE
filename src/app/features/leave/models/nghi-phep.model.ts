import { NghiPhepTrangThai } from '../../../core/constants/status.constants';

export interface NghiPhep {
    maNP: number;
    maNV: number;
    maLoaiNP: number;
    tuNgay: string;
    denNgay: string;
    lyDo: string | null;
    trangThai: string;
    nguoiDuyet: number | null;
}

export interface CreateNghiPhepRequest {
    maLoaiNP: number;
    tuNgay: string;
    denNgay: string;
    lyDo: string | null;
}

export interface UpdateNghiPhepRequest {
    maNV: number;
    maLoaiNP: number;
    tuNgay: string;
    denNgay: string;
    lyDo: string | null;
    trangThai: NghiPhepTrangThai;
    nguoiDuyet: number | null;
}
