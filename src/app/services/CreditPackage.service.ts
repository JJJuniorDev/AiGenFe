import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreditPackage } from "../model/CreditPackage.model";
import { environment } from "../../environments/environment";

// credit-package.service.ts
@Injectable({
  providedIn: 'root'
})
export class CreditPackageService {
  
  constructor(private http: HttpClient) {}
  
    private apiUrl = `${environment.apiUrl}/credit-packages`;
    
   getActivePackages(): Observable<CreditPackage[]> {
    return this.http.get<CreditPackage[]>(`${this.apiUrl}/active`);
  }
  
purchasePackage(packageId: number): Observable<any> {
    // ✅ CORREGGI L'URL - usa create-checkout-session
     return this.http.post(`${environment.apiUrl}/payments/create-checkout-session`, { 
      packageId 
    });
  }
}
