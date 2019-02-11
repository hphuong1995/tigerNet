import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { MainComponent } from './component/main/main.component';


const routes: Routes = [{path: '', component: LoginComponent},
                        {path: 'main', component: MainComponent},
                        ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
