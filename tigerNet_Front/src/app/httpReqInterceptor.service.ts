import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {

    constructor( private cookieService: CookieService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
        let csrf = this.cookieService.get('XSRF-TOKEN');
        if(csrf) {
            request = request.clone({
                withCredentials: true,
                setHeaders: { 'X-XSRF-TOKEN': csrf }
            });
        } else {
            request = request.clone({
                withCredentials: true
            });
        }
        return next.handle( request );
    }
}