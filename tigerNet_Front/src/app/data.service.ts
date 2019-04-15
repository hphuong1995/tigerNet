import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Network } from './data/network';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public csrf: string;

  public selectedPatterns: string[] = [];
  public selectedLink: string[] = [];
  public selectedNodes: string[] = [];
  public selectedDomains: string[] = [];

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

  addPattern(reqObj : any){
    console.log(reqObj);
    return this.http.post('api/v1/admin/patterns', JSON.stringify(reqObj));
  }

  addNode(reqObject : {pattern: string, nodes: string[], conNode: string, currentNodeNum: number}): Observable<HttpResponse<Network>> {
    //console.log(reqObject.pattern.id);
    return this.http.post<Network>('api/v1/admin/patterns/' + reqObject.pattern + "/nodes",
      JSON.stringify(reqObject), { observe: 'response'});
  }

  addNewConnection( reqObject : any){
    return this.http.post('api/v1/admin/connections', JSON.stringify({nodes: reqObject}));
  }

  deleteConnection( reqObject :any){
    return this.http.delete('api/v1/admin/connections?id=' + reqObject[0] + '&targetId=' + reqObject[1]);
  }

  deleteNode( reqObject : any){
    if(reqObject.id && reqObject.targetId)
      return this.http.delete('api/v1/admin/nodes?nid=' + reqObject.node + '&id=' + reqObject.id + '&targetId=' + reqObject.targetId);
    else if(reqObject.pid)
      return this.http.delete('api/v1/admin/nodes?nid=' + reqObject.node + '&pid=' + reqObject.pid);
    else
      return this.http.delete('api/v1/admin/nodes?nid=' + reqObject.node);
  }

  deletePattern(reqId : string){
    return this.http.delete('api/v1/admin/patterns?pid=' + reqId);
  }

  deleteDomain( reqId : string){
    return this.http.delete('api/v1/admin/domains?did=' + reqId);
  }

  addDomain( reqObj : any){
    return this.http.post('api/v1/admin/domains', JSON.stringify(reqObj));
  }

  activeNode( reqId : string, status : boolean){
    return this.http.put('api/v1/nodes/' + reqId + '?active=' + status, {active : status});
  }

  sendMessage( reqObj : any){
    return this.http.post('api/v1/messages', JSON.stringify(reqObj));
  }

  viewNode( reqStr :string){
    return this.http.get('api/v1/nodes/' + reqStr);
  }

  deleteMess( messId : string){
    return this.http.delete('api/v1/messages?mid=' + messId);
  }
}
