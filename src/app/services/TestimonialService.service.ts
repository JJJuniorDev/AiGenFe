import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { AuthService } from './AuthService.service';
import { Testimonial } from '../model/Testimonial.model';
import { TestimonialRequest } from '../model/TestimonialRequest.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TestimonialService {
  private baseUrl = `${environment.apiUrl}/testimonial`;
  constructor(private http: HttpClient, private authService: AuthService) {}

  generate(testimonial: TestimonialRequest): Observable<Testimonial> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<Testimonial>(`${this.baseUrl}/generate`, testimonial, { headers });
  }
}
