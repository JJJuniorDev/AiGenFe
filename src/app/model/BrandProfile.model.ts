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
  preferredCTAs: string[];
  positioning?: string;
  missionStatement?: string;
  visionStatement?:string;
  brandArchetype?: string;
  preferredWords?: string[];
  competitiveDifferentials?: string;
  industryCategory?: string;
  voiceDescription?: string;
    brandStyle?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: string;
    buttonStyle?: 'filled' | 'outline' | 'ghost';
    shadowLevel?: 'none' | 'light' | 'medium' | 'heavy';
    animationStyle?: 'none' | 'subtle' | 'modern';
  };
}