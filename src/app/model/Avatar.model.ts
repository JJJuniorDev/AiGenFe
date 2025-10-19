import { ToneType } from "../services/BrandProfileService.service";

export interface Avatar {
  id: number;
  name: string;
  description: string;
  icon: string;
  defaultEmotion: number;
  defaultCreativity: number;
  defaultFormality: number;
  defaultUrgency: number;
  defaultLength: number;
  defaultTone: ToneType;
  category: string;
  biography: string;
  characteristicPhrases: string[];
}

export interface AvatarSelection {
  avatarId: number;
  brandProfileId?: number;
  customEmotion?: number;
  customCreativity?: number;
  customFormality?: number;
  customUrgency?: number;
  customLength?: number;
}