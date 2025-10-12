export interface Testimonial {
  id?: string;
  userId?: string;
  inputText: string;
  socialPost: string;
  socialPostVersions: string[];
  headline: string;
  headlineVersions: string[];
  shortQuote: string;
  shortQuoteVersions: string[];
  callToAction: string;
  callToActionVersions: string[];
  exportedMd?: boolean;
  exportedPng?: boolean;
  platform?: string;
  createdAt?: string;
  postType?: string;
  tone?: number;  
  style?: number;
}
