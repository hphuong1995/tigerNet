import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/data.service'
import { CookieService } from 'ngx-cookie-service';

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {

    constructor(private data: DataService, private cookieService: CookieService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
        let csrf = this.cookieService.get('X-CSRF');
        if(csrf) {
            request = request.clone({
                withCredentials: true,
                setHeaders: { 'X-CSRF': csrf }
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
