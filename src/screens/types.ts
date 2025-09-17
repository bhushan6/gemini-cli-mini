export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  fullContent?: string;
  timestamp: Date;
  isComplete: boolean;
}
