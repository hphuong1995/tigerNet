import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { NavComponent } from './component/nav/nav.component';
import { WelcomeComponent } from './component/welcome/welcome.component';
import { MainComponent } from './component/main/main.component';

import { CSRFInterceptor } from './httpReqInterceptor.service'

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { PatternsComponent } from './component/patterns/patterns.component';
import { NodesComponent } from './component/nodes/nodes.component';
import { UsersComponent } from './component/users/users.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavComponent,
    WelcomeComponent,
    MainComponent,
    PatternsComponent,
    NodesComponent,
    UsersComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    CSRFInterceptor,
    CookieService,
    { provide: HTTP_INTERCEPTORS, useClass: CSRFInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
