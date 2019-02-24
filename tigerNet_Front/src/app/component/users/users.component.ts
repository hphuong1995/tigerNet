import { Component, OnInit } from '@angular/core';
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
    this.dataService.getAllUsers().subscribe(data => {
      this.users = data;
    });
  }

  unblockUser(userId: string) {
    console.log("here");
    this.dataService.unblockUser(userId).subscribe(data =>{
      this.users = data;
    });
  }

}
