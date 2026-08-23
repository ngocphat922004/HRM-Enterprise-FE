export type ApiValidationErrors = Record<string, string[]>;

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: ApiValidationErrors;
}