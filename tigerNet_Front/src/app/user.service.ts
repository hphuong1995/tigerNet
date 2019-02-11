import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor( private http: HttpClient ) { }

  login(user: string, pass: string){
    var loginUser = { "username": user, "password": pass};
    return this.http.post('api/v1/login', JSON.stringify(loginUser));
  }

  answerQuestion(answer: string, userId: string, quesId: string){
    var ansQues = {"answer" : answer, "userId" : userId, "quesId": quesId};
    return this.http.post('api/v1/login',JSON.stringify(ansQues));
  }

  isAuthenticated(){
    if(JSON.parse(localStorage.getItem('user'))){
      return true;
    }
    return false;
  }

  getCurrentUser(){
    return JSON.parse(localStorage.getItem('user'));
  }

  isAdmAccount(){
    if(!this.isAuthenticated()){
      return false;
    }
    if(JSON.parse(localStorage.getItem('user')).isAdmin){
      return true;
    }
    return false;
  }

  logout(){
    localStorage.setItem('user', null);
  }
}
