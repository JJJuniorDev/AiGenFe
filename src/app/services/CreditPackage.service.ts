import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreditPackage } from "../model/CreditPackage.model";

// credit-package.service.ts
@Injectable({
  providedIn: 'root'
})
export class CreditPackageService {
  
  constructor(private http: HttpClient) {}
  
   private apiUrl = 'http://localhost:8080/api/credit-packages';

   getActivePackages(): Observable<CreditPackage[]> {
    return this.http.get<CreditPackage[]>(`${this.apiUrl}/active`);
  }
  
  purchasePackage(packageId: number): Observable<any> {
    return this.http.post(`/api/payments/purchase-package`, { packageId });
  }
}
