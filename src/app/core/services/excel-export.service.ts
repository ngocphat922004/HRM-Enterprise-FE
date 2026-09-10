import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
    providedIn: 'root',
})
export class ExcelExportService {
    exportToExcel(
        data: object[],
        fileName: string,
        sheetName: string = 'Sheet1',
    ): void {
        if (!data.length) {
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet['!cols'] = this.calculateColumnWidths(data);

        const workbook: XLSX.WorkBook = {
            Sheets: {
                [sheetName]: worksheet,
            },
            SheetNames: [sheetName],
        };

        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
        });

        this.saveFile(
            excelBuffer,
            `${fileName}.xlsx`,
        );
    }

    exportWithHeaders(
        data: object[],
        headers: Record<string, string>,
        fileName: string,
        sheetName: string = 'Sheet1',
    ): void {
        const mappedData = data.map((item) => {
            const source = item as Record<string, unknown>;
            const row: Record<string, unknown> = {};

            Object.keys(headers).forEach((key) => {
                row[headers[key]] = source[key];
            });

            return row;
        });

        this.exportToExcel(
            mappedData,
            fileName,
            sheetName,
        );
    }

    private calculateColumnWidths(
        data: object[],
    ): XLSX.ColInfo[] {
        const rows = data as Record<string, unknown>[];
        const keys = Object.keys(rows[0] ?? {});

        return keys.map((key) => {
            const maxLength = Math.max(
                key.length,
                ...rows.map((row) => String(row[key] ?? '').length),
            );

            return {
                wch: Math.min(Math.max(maxLength + 2, 12), 40),
            };
        });
    }

    private saveFile(
        buffer: ArrayBuffer,
        fileName: string,
    ): void {
        const blob = new Blob(
            [buffer],
            {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        );

        saveAs(blob, fileName);
    }
}
