// services/PaymentService.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckoutRequest {
  packageId: number;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  packageName: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  
  private apiUrl = `${environment.apiUrl}/payments`;
  constructor(private http: HttpClient) {}

  createCheckoutSession(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/create-checkout-session`, request);
  }
}