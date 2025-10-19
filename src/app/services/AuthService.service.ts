import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuthRequest } from '../model/AuthRequest.model';
import { AuthResponse } from '../model/AuthResponse.model';
import { User } from '../model/User.model';
import { UserStateService } from './UserStateService.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
 private readonly TOKEN_KEY = 'auth_token';

  constructor(private http: HttpClient,
    private userStateService: UserStateService
  ) {}

  signup(req: AuthRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, req);
  }

  login(req: AuthRequest): Observable<AuthResponse> {
   return this.http.post<AuthResponse>(`${this.baseUrl}/login`, req).pipe(
      tap(response => {
        // Salva il token quando ricevi la risposta
        this.saveToken(response.token);
         this.userStateService.setUser(response.user);
            // Salva eventuali dati iniziali per questo utente
        this.initializeUserData(response.user);
      })
    );
  }

 saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token); // Assicurati che sia 'auth_token'
  }

getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY,);
    return token;
  }
 
logout() {
   localStorage.removeItem(this.TOKEN_KEY);
    // 2. Pulisci lo stato dell'user
    this.userStateService.clearCurrentUserData();
   }

isLoggedIn(): boolean { return this.getToken() !== null; }

getCurrentUser(): Observable<User> {
    console.log('👤 Iniziando chiamata a /api/users/me');
    return this.http.get<User>('/api/users/me').pipe(
      tap(user => console.log('✅ Utente ricevuto:', user)),
      catchError(error => {
        console.error('❌ Errore in getCurrentUser:', error);
        return throwError(() => error);
      })
    );
  }

  private initializeUserData(user: User): void {
    // Inizializza dati specifici per questo utente
    this.userStateService.setUserData('last_login', new Date().toISOString());
    this.userStateService.setUserData('preferences', {
      theme: 'dark',
      language: 'it'
    });
  }
}


