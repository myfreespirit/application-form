import { Component, Inject, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { DataService } from '../services/data.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss']
})

export class EntryComponent implements OnInit {
  rounds: any;
  userAddress: string;
  title = 'EXRT Distribution Application';

  constructor(@Inject(DataService) private _dataService: DataService, @Inject(Router) public router: Router, private _toastr: ToastrService) {
  }

  ngOnInit() {
	this._dataService.getAllRounds().subscribe(result => {
		this.rounds = result;
		this.title = 'EXRT Distribution #' + this.rounds.length + ' Application';
	});
  }
  
  checkWallet(form: NgForm) {
	console.log("checkWallet");
	console.log(form.value.wallet, form.valid);
	
	if (form.valid) {
		this.router.navigate(['/main']);
	} else {
		this._toastr.warning(form.value.wallet + " is not a valid ETH address");
	}
  }
}
