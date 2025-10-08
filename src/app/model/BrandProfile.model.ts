export interface BrandProfile {
  id?: string;
  brandName: string;
  tone: string;
  preferredKeywords: string[];
  avoidedWords: string[];
  brandDescription: string;
  targetAudience: string;
  brandValues: string;
  tagline: string;
  defaultHashtags: string[];
  visualStyle?: string;
  colorPalette?: string;
}