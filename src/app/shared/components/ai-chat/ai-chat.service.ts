import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { AiQuestionRequest, AiResponse } from './ai-chat.model';

@Injectable({
    providedIn: 'root',
})
export class AiChatService {
    private readonly apiUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.ai.ask}`;

    constructor(
        private readonly http: HttpClient,
    ) { }

    ask(question: string): Observable<AiResponse | string> {
        const body: AiQuestionRequest = {
            question,
        };

        return this.http.post<AiResponse | string>(
            this.apiUrl,
            body,
        );
    }
}
