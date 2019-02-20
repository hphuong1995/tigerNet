import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { MainComponent } from './component/main/main.component';
import { PatternsComponent } from './component/patterns/patterns.component';
import { NodesComponent } from './component/nodes/nodes.component';
import { UsersComponent } from './component/users/users.component';


const routes: Routes = [{path: '', component: LoginComponent},
                        {path: 'main', component: MainComponent},
                        {path: 'patterns', component: PatternsComponent},
                        {path: 'nodes', component: NodesComponent},
                        {path: 'admin/users', component: UsersComponent}
                        ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
