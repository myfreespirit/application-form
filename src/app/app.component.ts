import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataService } from './services/data.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  rounds: any;
  title = 'EXRT Distribution Application';

  constructor(@Inject(DataService) private _dataService: DataService, @Inject(Router) public router: Router) {
  }

  ngOnInit() {
	this._dataService.getAllRounds().subscribe(result => {
		this.rounds = result;
		this.title = 'EXRT Distribution #' + this.rounds.length + ' Application';
	});
  }
}
