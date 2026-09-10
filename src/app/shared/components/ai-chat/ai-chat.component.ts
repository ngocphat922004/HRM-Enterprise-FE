import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AiChatMessage, AiResponse } from './ai-chat.model';
import { AiChatService } from './ai-chat.service';

@Component({
    selector: 'app-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-chat.component.html',
    styleUrl: './ai-chat.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatComponent {
    message = '';
    loading = false;
    messages: AiChatMessage[] = [];

    constructor(
        private readonly aiService: AiChatService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    sendMessage(): void {
        const question = this.message.trim();

        if (!question || this.loading) {
            return;
        }

        this.messages = [
            ...this.messages,
            {
                role: 'user',
                content: question,
                time: new Date(),
            },
        ];
        this.message = '';
        this.loading = true;
        this.changeDetectorRef.markForCheck();

        this.aiService
            .ask(question)
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (response) => {
                    const answer = this.extractAnswer(response);

                    this.appendAiMessage(
                        answer || 'Chưa nhận được nội dung trả lời. Vui lòng thử lại.',
                    );
                },
                error: () => {
                    this.appendAiMessage(
                        'Không thể nhận phản hồi từ trợ lý lúc này. Vui lòng thử lại sau.',
                    );
                },
            });
    }

    private appendAiMessage(content: string): void {
        this.messages = [
            ...this.messages,
            {
                role: 'ai',
                content,
                time: new Date(),
            },
        ];
        this.changeDetectorRef.markForCheck();
    }

    private extractAnswer(response: AiResponse | string): string {
        if (typeof response === 'string') {
            return response.trim();
        }

        return (
            response.answer?.trim() ||
            response.message?.trim() ||
            ''
        );
    }
}
