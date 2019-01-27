import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth.service';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})


export class AdminComponent implements OnInit {


  constructor(@Inject(AuthService) public auth: AuthService) {
	auth.handleAuthentication();
  }


  ngOnInit() {
	if (localStorage.getItem('isLoggedIn') === 'true') {
		this.auth.renewTokens();
	}
  }
}
