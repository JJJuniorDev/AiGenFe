
// email-verification.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/AuthService.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-email-verification',
  template: `
    <div class="verification-container">
      <div class="verification-card" *ngIf="!verificationCompleted">
        <div class="loading-spinner" *ngIf="verifying">
          <div class="spinner"></div>
          <h2>Verifica in corso...</h2>
        </div>
        
        <div class="success-message" *ngIf="verificationSuccess">
          <div class="success-icon">✅</div>
          <h1>Email Verificata!</h1>
          <p>La tua email è stata verificata con successo.</p>
          <p>Hai ricevuto <strong>5 crediti gratuiti</strong>! 🎉</p>
          <button class="btn-primary" (click)="goToLogin()">
            Accedi al Tuo Account
          </button>
          <button class="btn-secondary" (click)="goToHome()">
            Torna alla Home
          </button>
        </div>
        
        <div class="error-message" *ngIf="verificationError">
          <div class="error-icon">❌</div>
          <h1>Verifica Fallita</h1>
          <p>Il link di verifica non è valido o è scaduto.</p>
          <button class="btn-primary" (click)="goToHome()">
            Torna alla Home
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./email-verification.css']
})
export class EmailVerificationComponent implements OnInit {
  verifying = true;
  verificationSuccess = false;
  verificationError = false;
  verificationCompleted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.verifyEmail();
  }

  verifyEmail() {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.verificationError = true;
      this.verifying = false;
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.verificationSuccess = true;
        this.verifying = false;
        this.toastr.success('Email verificata! Hai ricevuto 5 crediti gratuiti.', 'Verifica Completata');
      },
      error: () => {
        this.verificationError = true;
        this.verifying = false;
        this.toastr.error('Link di verifica non valido o scaduto.', 'Verifica Fallita');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}