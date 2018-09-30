import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';

import { DataService } from './data.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  rounds: any;
  version = 'v0.7.2';
  title = 'EXRT Distribution Application';

  constructor(@Inject(DataService) private _dataService: DataService) { }

  ngOnInit() {
	this._dataService.getAllRounds().subscribe(result => {
		this.rounds = result;
		this.title = 'EXRT Distribution #' + this.rounds.length + ' Application';
	});
  }
}
