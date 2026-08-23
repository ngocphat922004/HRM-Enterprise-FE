import { NghiPhepTrangThai } from '../../../core/constants/status.constants';

export interface NghiPhep {
    maNP: number;
    maNV: number;
    maLoaiNP: number;
    tuNgay: string;
    denNgay: string;
    lyDo: string | null;
    trangThai: NghiPhepTrangThai;
    nguoiDuyet: number | null;
}

export interface CreateNghiPhepRequest {
    maNV: number;
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

export interface XuLyNghiPhepRequest {
    nguoiDuyet: number;
}
