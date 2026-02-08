export interface AnnouncementData {
  _id: string;
  text: string;
  useMobileTTS: boolean;
  audioUrl?: string;
  message?: string;
  timestamp: string;
  elevenLabsError?: string;
}

export interface AnnouncementResponse {
  clientId: string;
  status: 'received' | 'error';
  usedTTS?: boolean;
  error?: string;
  timestamp: string;
}
