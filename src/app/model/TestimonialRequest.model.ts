export interface TestimonialRequest {
  inputText: string;
  platform: string;
  selectedPostType: string;
  emotion: number;
  creativity: number;
  formality: number;
  urgency: number;
  length: number;
  brandProfileId?: string;
    avatarId?: number; // ✅ NUOVO
  avatarParameters?: { // ✅ NUOVO - per override
      emotion?: number;
    creativity?: number;
    formality?: number;
    urgency?: number;
    length?: number;
  };
}
