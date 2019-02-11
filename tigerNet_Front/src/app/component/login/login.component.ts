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
  loggedIn = false;
  loginUser :any;

  submitBtn: string;
  wrongAnswer = false;

  constructor( private formBuilder : FormBuilder,
                private userService : UserService,
                private router: Router) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      answer: [''],
    });
    this.submitBtn = "Login";

  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.incorrect = false;
    // stop here if form is invalid
    if (this.loginForm.invalid) {
        console.log("invalid");
        return;
    }
    if(!this.loggedIn){
      this.loading = false;
      this.userService.login(this.f.username.value, this.f.password.value).subscribe(
        (data,error) => {
                    this.loginUser = data;
                    if(this.loginUser){
                      this.loading = false;
                      this.incorrect = false;
                      this.loggedIn = true;
                    }
                    else{
                      console.log("here");
                      this.incorrect = true;
                      this.loading = false;
                    }
      });
    }
    else{
      this.userService.answerQuestion(this.f.answer.value, this.loginUser.id, this.loginUser.loginQuestion.id).subscribe(
          (data) => {
            var res : any;
            res = data;
            if(res.valid === true){
              localStorage.setItem('user', JSON.stringify(this.loginUser));
              this.router.navigate(['main']);
            }
            else{
              console.log("false");
              this.wrongAnswer = true;
            }
        });
    }


  }
}
