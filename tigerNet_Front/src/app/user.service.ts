import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor( private http: HttpClient ) { }

  login(user: string, pass: string): Observable<HttpResponse<Object>> {
    var loginUser = { "username": user, "password": pass};
    return this.http.post('api/v1/login', JSON.stringify(loginUser), { observe : 'response' });
  }

  answerQuestion(answer: string, userId: string, quesId: string): Observable<Object> {
    //var ansQues = {"answer" : answer, "userId" : userId, "quesId": quesId};
    var ansQues = { "answer" : answer };
    //return this.http.post('api/v1/login/',JSON.stringify(ansQues));
    return this.http.post('api/v1/login/question',JSON.stringify(ansQues));
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
