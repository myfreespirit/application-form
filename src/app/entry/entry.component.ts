import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataService } from '../services/data.service';


@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss']
})

export class EntryComponent implements OnInit {
  rounds: any;
  userAddress: string;
  title = 'EXRT Distribution Application';

  constructor(@Inject(DataService) private _dataService: DataService, @Inject(Router) public router: Router) {
  }

  ngOnInit() {
	this._dataService.getAllRounds().subscribe(result => {
		this.rounds = result;
		this.title = 'EXRT Distribution #' + this.rounds.length + ' Application';
	});
  }
  
  checkWallet() {
	console.log("checkWallet");
	console.log(this.userAddress);
  }
}
