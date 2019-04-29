import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { DataService } from './../../data.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users : any;

  constructor( private dataService : DataService ) { }

  ngOnInit() {
    this.dataService.getAllUsers().subscribe((res: HttpResponse<Object>) => {
      if(!res.ok) {
        alert(res.body);
        return;
      }
      this.users = res.body;
    }, (err: any) => {
      alert(err.error);
      return;
    });
  }

  unblockUser(userId: string) {
    console.log("here");
    this.dataService.unblockUser(userId).subscribe((res: HttpResponse<Object>) => {
      if(!res.ok) {
        alert(res.body);
        return;
      }
      this.users = res.body;
    }, (err: any) => {
      alert(err.error);
      return;
    });
  }

}
