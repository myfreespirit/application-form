import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { DataService } from '../data.service';


@Component({
  selector: 'app-staff',
  styleUrls: ['./staff.component.scss'],
  templateUrl: './staff.component.html',
  encapsulation: ViewEncapsulation.None
})

export class StaffComponent implements OnInit {

  signups: any;
  displayedColumns = ['wallet', 'date', 'total', 'team', 'status'];
  dataSource: MatTableDataSource<SignupsData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  
  constructor(private _dataService: DataService) {
  this.dataSource = new MatTableDataSource([]);
    this.getLastSignups();
  }

  
  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


  getLastSignups() {
    this._dataService.getLastSignups()
    	.subscribe(result => {
        	this.signups = result;

		const data: SignupsData[] = [];
		this.signups.forEach(el => {
		    data.push({
			wallet: el.wallet,
			date: el.date,
			total: el.total,
			team: el.team,
			status: 'OK'
		    });
		});

	    this.dataSource = new MatTableDataSource(data);
	    this.dataSource.paginator = this.paginator;
	    this.dataSource.sort = this.sort;
    })
  }
}


export interface SignupsData {
  wallet: string;
  date: number;
  team: number;
  total: number;
  status: string;
}
