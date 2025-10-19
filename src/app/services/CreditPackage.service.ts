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
  
  getActivePackages(): Observable<CreditPackage[]> {
    return this.http.get<CreditPackage[]>('/api/credit-packages');
  }
  
  purchasePackage(packageId: number): Observable<any> {
    return this.http.post(`/api/payments/purchase-package`, { packageId });
  }
}
