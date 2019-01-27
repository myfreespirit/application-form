import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';

import { DataService } from '../data.service';


@Component({
  selector: 'app-testnet',
  templateUrl: './testnet.component.html',
  styleUrls: ['./testnet.component.scss']
})


export class TestnetComponent implements OnInit {

  title = "EXRT Testnet registration";
  userSalt: string;
  userPass: string;
  hash: any;


  constructor(@Inject(DataService) private _dataService: DataService) {
  }


  ngOnInit() {
  }


  hashIt() {
	this._dataService.hashIt(this.userSalt, this.userPass).subscribe(result => {
		this.hash = result;
	});
  }
}
