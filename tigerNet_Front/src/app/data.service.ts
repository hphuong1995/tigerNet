import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Network } from './data/network';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public csrf: string;

  public selectedPatterns = [];
  public selectedLink = [];
  public selectedNodes = [];


  public cy : any;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<Object> {
    return this.http.get('api/v1/admin/users');
  }

  unblockUser(userId: string) : Observable<Object> {
    return this.http.put('api/v1/admin/users/' + userId, {});
  }

  getNetwork(): Observable<HttpResponse<Network>> {
    return this.http.get<Network>('api/v1/network', { observe: 'response'});
  }

  addPattern(connectorNodes : string[]){
    return this.http.post('api/v1/admin/patterns', JSON.stringify(connectorNodes));
  }

  addNode(reqObject : any){
    //console.log(reqObject.pattern.id);
    return this.http.post('api/v1/admin/patterns/' + reqObject.pattern.id + "/nodes", JSON.stringify(reqObject));
  }

  addNewConnection( reqObject : any){
    return this.http.post('api/v1/admin/connections', JSON.stringify({nodes: reqObject}));
  }
}
