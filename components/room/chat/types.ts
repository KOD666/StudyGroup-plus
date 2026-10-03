export interface InCallMessage {
  id: string;
  senderName: string;
  senderId?: string;
  text: string;
  time: string;
  isSelf: boolean;
  createdAt?: string;
}

export interface InCallChatContextValue {
  messages: InCallMessage[];
  sendMessage: (text: string) => Promise<void>;
  copyChatToClipboard: () => Promise<boolean>;
  downloadChat: (roomName?: string) => void;
  isLoadingHistory: boolean;
}
