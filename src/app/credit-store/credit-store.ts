import { Component, OnInit } from '@angular/core';
import { CreditPackage } from '../model/CreditPackage.model';
import { CreditPackageService } from '../services/CreditPackage.service';
import { PaymentService } from '../services/PaymentService.service';
import { ToastrService } from 'ngx-toastr';
import { UserStateService } from '../services/UserStateService.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credit-store',
  imports: [CommonModule],
  templateUrl: './credit-store.html',
  styleUrl: './credit-store.css'
})
export class CreditStore implements OnInit {
  packages: CreditPackage[] = [];
  isProcessing = false;

  constructor(
    private creditPackageService: CreditPackageService,
    private paymentService: PaymentService,
    private toastr: ToastrService,
    private userStateService: UserStateService
  ) {}

  ngOnInit() {
    this.loadPackages();
  }

  loadPackages() {
    this.creditPackageService.getActivePackages().subscribe({
      next: (packages) => {
       // Aggiungi flag featured al pacchetto più popolare (es. il secondo)
        this.packages = packages.map((pkg, index) => ({
          ...pkg,
          featured: index === 1 // Il secondo pacchetto è featured
        }));
      },
      error: (error) => {
        console.error('Errore caricamento pacchetti:', error);
        this.toastr.error('Errore nel caricamento dei pacchetti');
      }
    });
  }

  buyPackage(pkg: CreditPackage) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    const request = {
      packageId: pkg.id,
      successUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`
    };

    this.paymentService.createCheckoutSession(request).subscribe({
      next: (response) => {
        // Reindirizza a Stripe Checkout
        window.location.href = response.checkoutUrl;
      },
      error: (error) => {
        console.error('Errore creazione checkout:', error);
         this.toastr.error('Errore durante l\'acquisto: ' + (error.error?.error || 'Riprova più tardi'));
        this.isProcessing = false;
      }
    });
  }
}