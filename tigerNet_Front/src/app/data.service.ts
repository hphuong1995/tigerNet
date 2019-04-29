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

  getAllUsers(): Observable<HttpResponse<Object>> {
    return this.http.get('api/v1/admin/users', { observe: 'response'});
  }

  unblockUser(userId: string): Observable<HttpResponse<Object>> {
    return this.http.put('api/v1/admin/users/' + userId, {}, { observe: 'response'});
  }

  getNetwork(): Observable<HttpResponse<Network>> {
    return this.http.get<Network>('api/v1/network', { observe: 'response'});
  }

  addPattern(reqObj : any): Observable<HttpResponse<Network>> {
    // console.log(reqObj);
    return this.http.post<Network>('api/v1/admin/patterns', JSON.stringify(reqObj), { observe: 'response'});
  }

  addNode(reqObject : {pattern: string, nodes: string[], conNode: string, currentNodeNum: number}): Observable<HttpResponse<Network>> {
    //console.log(reqObject.pattern.id);
    return this.http.post<Network>('api/v1/admin/patterns/' + reqObject.pattern + "/nodes",
      JSON.stringify(reqObject), { observe: 'response'});
  }

  addNewConnection( reqObject : any): Observable<HttpResponse<Network>> {
    return this.http.post<Network>('api/v1/admin/connections', JSON.stringify({nodes: reqObject}), { observe: 'response'});
  }

  deleteConnection( reqObject :any): Observable<HttpResponse<Network>> {
    return this.http.delete<Network>('api/v1/admin/connections?id=' + reqObject[0] + '&targetId=' + reqObject[1], { observe: 'response'});
  }

  deleteNode( reqObject : any): Observable<HttpResponse<Network>> {
    if(reqObject.id && reqObject.targetId)
      return this.http.delete<Network>('api/v1/admin/nodes?nid=' + reqObject.node + '&id=' + reqObject.id + '&targetId=' + reqObject.targetId, { observe: 'response'});
    else if(reqObject.pid)
      return this.http.delete<Network>('api/v1/admin/nodes?nid=' + reqObject.node + '&pid=' + reqObject.pid, { observe: 'response'});
    else
      return this.http.delete<Network>('api/v1/admin/nodes?nid=' + reqObject.node, { observe: 'response'});
  }

  deletePattern(reqId : string): Observable<HttpResponse<Network>> {
    return this.http.delete<Network>('api/v1/admin/patterns?pid=' + reqId, { observe: 'response'});
  }

  deleteDomain( reqId : string): Observable<HttpResponse<Network>> {
    return this.http.delete<Network>('api/v1/admin/domains?did=' + reqId, { observe: 'response'});
  }

  addDomain( reqObj : any): Observable<HttpResponse<Network>> {
    return this.http.post<Network>('api/v1/admin/domains', JSON.stringify(reqObj), { observe: 'response'});
  }

  activeNode( reqId : string, status : boolean): Observable<HttpResponse<Object>> {
    return this.http.put('api/v1/nodes/' + reqId + '?active=' + status, {active : status}, { observe: 'response'});
  }

  sendMessage( reqObj : any): Observable<HttpResponse<Object>> {
    return this.http.post('api/v1/messages', JSON.stringify(reqObj), { observe: 'response'});
  }

  viewNode( reqStr :string): Observable<HttpResponse<Object>> {
    return this.http.get('api/v1/nodes/' + reqStr, { observe: 'response'});
  }

  deleteMess( messId : string, nid : string): Observable<HttpResponse<Object>> {
    console.log(messId + " " + nid);
    return this.http.delete('api/v1/messages?mid=' + messId + '&nid=' + nid, { observe: 'response'});
  }
}
