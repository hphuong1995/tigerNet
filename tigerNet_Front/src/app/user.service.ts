import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor( private http: HttpClient ) { }

  login(user: string, pass: string){
    var loginUser = { "username": user, "password": pass};
    return this.http.post('api/v1/login', JSON.stringify(loginUser),{headers:{'Content-Type': 'application/json'}});
  }
}
