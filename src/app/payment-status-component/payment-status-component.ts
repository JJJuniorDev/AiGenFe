import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserStateService } from '../services/UserStateService.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/AuthService.service';

@Component({
  selector: 'app-payment-status-component',
  imports: [CommonModule],
  templateUrl: './payment-status-component.html',
  styleUrl: './payment-status-component.css'
})
export class PaymentStatusComponent implements OnInit {
  status: 'success' | 'cancel' | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private userStateService: UserStateService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Leggi dalla query string o dal path
    const url = window.location.href;
    if (url.includes('/payment/success')) {
      this.status = 'success';
       this.handleSuccessfulPayment();
    } else if (url.includes('/payment/cancel')) {
      this.status = 'cancel';
    }
    
    if (this.status === 'success') {
      this.toastr.success('Crediti aggiunti con successo! 🎉');
      // Ricarica i dati utente per aggiornare i crediti
      this.userStateService.getUser();
    }
  }

   // ✅ AGGIUNGI QUESTO METODO
  private handleSuccessfulPayment() {
    this.toastr.info('Verifica aggiornamento crediti...');
    
    // ✅ FORZA IL RELOAD COMPLETO DELL'UTENTE
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userStateService.setUser(user);
        this.toastr.success(`Crediti aggiornati! Ora hai ${user.credits} crediti 🎉`);
        console.log('💰 Credits updated:', user.credits);
      },
      error: (error) => {
        console.error('Errore aggiornamento crediti:', error);
        this.toastr.info('I crediti potrebbero essere già stati aggiunti. Ricarica la pagina.');
      }
    });
  }

  goToGenerator() {
    this.router.navigate(['/generator']);
  }
}
