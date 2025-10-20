export interface CreditPackage {
 id: number;
  name: string;
  description: string;
  credits: number;
  price: number;
  active: boolean;
  stripePriceId?: string;
}