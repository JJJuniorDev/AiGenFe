import { Component, OnInit, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { routes } from './app.routes';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/AuthService.service';
import { AnalyticsComponent } from './analytics-component/analytics-component';
import { BirthdayMap } from "./birthday-map/birthday-map";

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, BirthdayMap],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('flotilla-ui');
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // ✅ PULIZIA AUTOMATICA ALL'AVVIO
    if (!this.authService.isLoggedIn()) {
      this.authService.logout();
    }
  }
}
