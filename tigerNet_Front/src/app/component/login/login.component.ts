import { Component, OnInit } from '@angular/core';
import { UserService } from './../../user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  public flag:boolean=false;

  loginForm: FormGroup;
  loading = false;
  submitted = false;
  incorrect = false;

  constructor( private formBuilder : FormBuilder,
                private userService : UserService,
                private router: Router) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      question: ['', Validators.required],
      answer: ['', Validators.required],
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.incorrect = false;
    // stop here if form is invalid
    //if (this.loginForm.invalid) {
      //  return;
  //  }
    this.loading = false;
    var user: any;
    this.userService.login(this.f.username.value, this.f.password.value).subscribe(
      (data) => { user = data;
                  if(user){
                    this.loading = false;
                    this.incorrect = false;
                    localStorage.setItem('user', JSON.stringify(user));
                  }
                  else{
                    this.incorrect = true;
                    this.loading = false;
                  }
    });

  }
}
