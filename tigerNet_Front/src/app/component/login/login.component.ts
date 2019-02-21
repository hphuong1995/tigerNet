import { Component, OnInit } from '@angular/core';
import { UserService } from './../../user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/data.service';
import { HttpResponse } from '@angular/common/http';

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
  currentQuestion: any;

  submitBtn: string;
  wrongAnswer = false;

  constructor( private formBuilder : FormBuilder,
                private userService : UserService,
                private data: DataService,
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
    console.log("hit");
    if (this.loginForm.invalid) {
        console.log("invalid");
        return;
    }
    if(!this.loggedIn){
      this.loading = false;
      this.userService.login(this.f.username.value, this.f.password.value).subscribe(
        (res: HttpResponse<Object>) => {
                    this.data.csrf = res.headers.get("CSRF");
                    this.loginUser = res.body;
                    if(this.loginUser){
                      this.loading = false;
                      this.incorrect = false;
                      this.loggedIn = true;
                      this.currentQuestion = this.loginUser.loginQuestion;
                    }
                    else{
                      console.log("here");
                      this.incorrect = true;
                      this.loading = false;
                    }
      });
    }
    else{
      this.userService.answerQuestion(this.f.answer.value, this.loginUser.id, this.currentQuestion.id).subscribe(
          (data) => {
            var res : any;
            res = data;
            if(res.valid === true){
              localStorage.setItem('user', JSON.stringify(this.loginUser));
              this.router.navigate(['main']);
            }
            else{
              console.log("false");
              this.currentQuestion = res;
              this.wrongAnswer = true;
            }
        });
    }


  }
}
