// src/app/model/BrandReferenceImage.model.ts
export interface BrandReferenceImage {
  id?: string;
  brandId: string;
  brandName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  imageName: string;
  description?: string;
  uploadDate: Date;
  tags: string[];
  styleCharacteristics?: {
    colors: string[];
    mood: string;
    composition: string;
    lighting: string;
  };
  weight: number; // 1-10 quanto questa immagine influenza la generazione
}