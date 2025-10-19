import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Avatar } from "../model/Avatar.model";

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  
  constructor(private http: HttpClient) {}
  
  getAllAvatars(): Observable<Avatar[]> {
    return this.http.get<Avatar[]>('/api/avatars');
  }
  
  getAvatarsByCategory(category: string): Observable<Avatar[]> {
    return this.http.get<Avatar[]>(`/api/avatars/category/${category}`);
  }
  
  getAvatarById(id: number): Observable<Avatar> {
    return this.http.get<Avatar>(`/api/avatars/${id}`);
  }
  
  getAvatarParameters(id: number): Observable<any> {
    return this.http.get<any>(`/api/avatars/${id}/parameters`);
  }
}