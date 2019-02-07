import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { NavComponent } from './component/nav/nav.component';
import { WelcomeComponent } from './component/welcome/welcome.component';
import { MainComponent } from './component/main/main.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavComponent,
    WelcomeComponent,
    MainComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }