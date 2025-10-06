import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { AuthRequest } from '../model/AuthRequest.model';
import { AuthResponse } from '../model/AuthResponse.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
 private tokenKey = 'jwt';

  constructor(private http: HttpClient) {}

  signup(req: AuthRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, req);
  }

  login(req: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, req);
  }

saveToken(token: string) { localStorage.setItem(this.tokenKey, token); }
 
getToken(): string | null { return localStorage.getItem(this.tokenKey); }
 
logout() { localStorage.removeItem(this.tokenKey); }

}
