import { Component, OnInit } from '@angular/core';

import { DataService } from '../data.service';


@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss']
})


export class StaffComponent implements OnInit {

  signups: any;  


  constructor(private _dataService: DataService) { }


  ngOnInit() {
  	this.getLastSignups();
  }


  public getLastSignups() {
	this._dataService.getLastSignups()
  		.subscribe(result => {
			this.signups = result;
		});
  }
}
