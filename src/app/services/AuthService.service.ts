import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { AuthRequest } from '../model/AuthRequest.model';
import { AuthResponse } from '../model/AuthResponse.model';
import { User } from '../model/User.model';
import { UserStateService } from './UserStateService.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
 private readonly TOKEN_KEY = 'auth_token';

 // Observable per gestire lo stato di verifica email
  private emailVerificationRequired = new BehaviorSubject<boolean>(false);
  public emailVerificationRequired$ = this.emailVerificationRequired.asObservable();

  
  constructor(private http: HttpClient,
    private userStateService: UserStateService
  ) {}

  signup(req: AuthRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, req).pipe(
      tap(() => {
        // Mostra il messaggio di verifica email richiesta
        this.emailVerificationRequired.next(true);
      })
    );
  }

  login(req: AuthRequest): Observable<AuthResponse> {
   return this.http.post<AuthResponse>(`${this.baseUrl}/login`, req).pipe(
      tap(response => {
          // Se l'email non è verificata, mostra avviso
        if (!response.user.emailVerified) {
          this.emailVerificationRequired.next(true);
        }
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

isLoggedIn(): boolean { 
  const token = this.getToken();
  if (!token) return false;
  
  // ✅ VERIFICA SCADENZA
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      this.logout(); // Auto-pulizia
      return false;
    }
    return true;
  } catch {
    this.logout(); // Token malformato
    return false;
  }
}
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

   verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/verify-email?token=${token}`);
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-verification`, { email });
  }
}


