import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page';
import { Generator } from './generator/generator';
import { PaymentStatusComponent } from './payment-status-component/payment-status-component';
import { CreditStore } from './credit-store/credit-store';
import { ArchiveComponent } from './archive-component/archive-component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
   { path: 'generator', component: Generator },
    {path: 'archive', component: ArchiveComponent},
     { path: 'payment/success', component: PaymentStatusComponent },
  { path: 'payment/cancel', component: PaymentStatusComponent },
  { path: 'credits/store', component: CreditStore },
  { path: '**', redirectTo: '' }
];