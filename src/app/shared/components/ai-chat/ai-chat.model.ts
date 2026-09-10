export interface AiQuestionRequest {
    question: string;
}

export interface AiChatMessage {
    role: 'user' | 'ai';
    content: string;
    time?: Date;
}

export interface AiResponse {
    answer?: string;
    message?: string;
}