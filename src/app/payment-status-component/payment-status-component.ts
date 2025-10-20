import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserStateService } from '../services/UserStateService.service';
import { CommonModule } from '@angular/common';

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
    private userStateService: UserStateService
  ) {}

  ngOnInit() {
    // Leggi dalla query string o dal path
    const url = window.location.href;
    if (url.includes('/payment/success')) {
      this.status = 'success';
    } else if (url.includes('/payment/cancel')) {
      this.status = 'cancel';
    }
    
    if (this.status === 'success') {
      this.toastr.success('Crediti aggiunti con successo! 🎉');
      // Ricarica i dati utente per aggiornare i crediti
      this.userStateService.getUser();
    }
  }

  goToGenerator() {
    this.router.navigate(['/generator']);
  }
}
