import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public csrf: string;

  constructor(private http: HttpClient) { }

  getAllUsers(){
    return this.http.get('api/v1/admin/users');
  }
}
