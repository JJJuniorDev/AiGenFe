import { BehaviorSubject, distinctUntilChanged, shareReplay } from "rxjs";
import { User } from "../model/User.model";
import { Injectable } from "@angular/core";

// user-state.service.ts
@Injectable({ providedIn: 'root' })
export class UserStateService {
  private currentUser = new BehaviorSubject<User | null>(null);
 public currentUser$ = this.currentUser.asObservable().pipe(
    // ✅ AGGIUNGI DISTINCT UNTIL CHANGED
    distinctUntilChanged((prev, curr) => 
      JSON.stringify(prev) === JSON.stringify(curr)
    ),
    shareReplay(1)
  );
  
  private readonly USER_PREFIX = 'user_data_';
  private readonly TOKEN_KEY = 'auth_token';

  setUser(user: User): void {
    // Salva user con prefisso basato sull'ID utente
     const userDataKey = this.getUserDataKey(user.id);
     localStorage.setItem(userDataKey, JSON.stringify(user));
    const currentUser = this.currentUser.value;
    if (!this.isUserEqual(currentUser, user)) {
      this.currentUser.next(user);
    }
    console.log('👤 User salvato con chiave:', userDataKey);
  }

  private isUserEqual(user1: User | null, user2: User | null): boolean {
    if (user1 === user2) return true;
    if (!user1 || !user2) return false;
    return user1.id === user2.id && 
           user1.email === user2.email && 
           user1.credits === user2.credits;
  }

  getUser(): User | null {
    // 1. Cerca l'user corrente dal token
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.clearCurrentUserData();
      return null;
    }

    try {
      // 2. Decodifica il token per ottenere l'ID utente
      const userId = this.getUserIdFromToken(token);
      if (!userId) {
        this.clearCurrentUserData();
        return null;
      }
 // 3. Recupera l'user specifico per quell'ID
        const userDataKey = this.getUserDataKey(userId);
      const userData = localStorage.getItem(userDataKey);
      
      if (userData) {
        const user = JSON.parse(userData) as User;
      //  this.currentUser.next(user);
        return user;
      }
    } catch (error) {
      console.error('Errore nel recupero user:', error);
    }

    return null;
  }

   // ✅ IMPORTANTE: Pulisce solo i dati dell'utente CORRENTE
  clearCurrentUserData(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      const userId = this.getUserIdFromToken(token);
      if (userId) {
        // Rimuove SOLO i dati di questo utente
        const userDataKey = this.getUserDataKey(userId);
        localStorage.removeItem(userDataKey);
        console.log('🗑️ Rimossi dati utente:', userDataKey);
      }
    }
    
    // Rimuove il token
    localStorage.removeItem(this.TOKEN_KEY);
    
    this.currentUser.next(null);
  }

  // ✅ Metodo per salvare dati specifici dell'utente
  setUserData<T>(key: string, data: T): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return;

    const userId = this.getUserIdFromToken(token);
    if (userId) {
      const storageKey = `${this.USER_PREFIX}${userId}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }

  // ✅ Metodo per recuperare dati specifici dell'utente
  getUserData<T>(key: string): T | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;

    const userId = this.getUserIdFromToken(token);
    if (userId) {
      const storageKey = `${this.USER_PREFIX}${userId}_${key}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  private getUserDataKey(userId: string): string {
    return `${this.USER_PREFIX}${userId}_current`;
  }

  private getUserIdFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || null;
    } catch {
      return null;
    }
  }
}

