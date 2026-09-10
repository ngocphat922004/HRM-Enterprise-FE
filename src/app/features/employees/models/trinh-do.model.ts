export interface TrinhDo {
    maTD: number;
    tenTD: string;
}

export interface CreateTrinhDoRequest {
    tenTD: string;
}

export type UpdateTrinhDoRequest = CreateTrinhDoRequest;
