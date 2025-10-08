export interface TestimonialRequest {
  inputText: string;
  platform: string;
  postType: string;
  emotion: number;
  creativity: number;
  formality: number;
  urgency: number;
  length: number;
  brandProfileId?: string;
}
