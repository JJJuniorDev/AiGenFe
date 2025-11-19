import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpInterceptorFn, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
const TOKEN_KEY = 'auth_token';

 
export const authInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
 const token = localStorage.getItem(TOKEN_KEY);
 
  if (token) {
     try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return throwError(() => new Error('Token scaduto'));
      }
    } catch {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return throwError(() => new Error('Token invalido'));
    }
    
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(cloned).pipe(
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          console.warn('🔐 Errore autenticazione, trigger logout');
          // Dispatcia evento per sincronizzare il logout
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};

