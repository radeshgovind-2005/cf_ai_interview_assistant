export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface MetaData {
    city: string;
    country: string;
}

export interface MessagePayload {
    message: string;
    meta: MetaData;
}