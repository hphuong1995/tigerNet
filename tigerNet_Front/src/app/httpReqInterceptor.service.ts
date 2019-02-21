import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/data.service'

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {

    constructor(private data: DataService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
        let csrf = this.data.csrf;
        if(csrf) {
            request = request.clone({
                withCredentials: true,
                setHeaders: { 'CSRF': csrf }
            });
        } else {
            request = request.clone({
                withCredentials: true
            });
        }
        request = request.clone({
          setHeaders:{'Content-Type': 'application/json'}
        });
        return next.handle( request );
    }
}
