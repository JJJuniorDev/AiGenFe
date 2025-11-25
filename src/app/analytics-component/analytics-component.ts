import { Component, OnInit } from '@angular/core';
import {inject} from '@vercel/analytics';
@Component({
  selector: 'app-analytics-component',
  imports: [],
  templateUrl: './analytics-component.html',
  styleUrl: './analytics-component.css'
})
export class AnalyticsComponent implements OnInit {
  ngOnInit() {
    // Inizializza Vercel Analytics
    inject();
  }
}
