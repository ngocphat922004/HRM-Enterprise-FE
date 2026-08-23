import { KhenThuongKyLuatLoai } from '../../../core/constants/status.constants';

export interface KhenThuongKyLuat {
    maKTKL: number;
    maNV: number;
    loai: KhenThuongKyLuatLoai;
    lyDo: string | null;
    soTien: number;
    ngayQuyetDinh: string;
}

export interface CreateKhenThuongKyLuatRequest {
    maNV: number;
    loai: KhenThuongKyLuatLoai;
    lyDo: string | null;
    soTien: number;
    ngayQuyetDinh: string;
}

export type UpdateKhenThuongKyLuatRequest =
    CreateKhenThuongKyLuatRequest;