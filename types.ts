
export enum SenderType {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: SenderType;
  timestamp: string;
  metadata?: Record<string, any>; // For potential future use, e.g., sources
}

export interface SheetInfo {
  name: string;
  rows: number;
  cols: number;
}