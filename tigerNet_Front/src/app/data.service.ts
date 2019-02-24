import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Network } from './data/network';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public csrf: string;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<Object> {
    return this.http.get('api/v1/admin/users');
  }

  getNetwork(): Observable<HttpResponse<Network>> {
    return this.http.get<Network>('api/v1/network', { observe: 'response'});
  }
}
