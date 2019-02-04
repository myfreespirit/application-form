import { animate, state, style, transition, trigger } from '@angular/animations';
import { Inject } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { AuthService } from '../services/auth.service';
import { TestnetService } from '../services/testnet.service';


@Component({
  selector: 'app-admin',
  styleUrls: ['./admin.component.scss'],
  templateUrl: './admin.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})


export class AdminComponent implements OnInit, AfterViewInit {

  displayedColumns = ['username', 'telegram'];
  expandedElement: TestnetRegistrationElement;
  dataSource: MatTableDataSource<TestnetRegistrationElement>;

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  constructor(@Inject(AuthService) public auth: AuthService, @Inject(TestnetService) public testnet: TestnetService) {
	auth.handleAuthentication();

	this.dataSource = new MatTableDataSource([]);
	this.getAllRegistrations();
  }


  ngAfterViewInit() {
	this.dataSource.paginator = this.paginator;

	this.dataSource.sort = this.sort;
  }


  ngOnInit() {
	if (localStorage.getItem('isLoggedIn') === 'true') {
		this.auth.renewToken();
	}
  }


  applyFilter(filterValue: string) {
	filterValue = filterValue.trim();
	filterValue = filterValue.toLowerCase();
	this.dataSource.filter = filterValue;

	if (this.dataSource.paginator) {
		this.dataSource.paginator.firstPage();
	}
  }


  private getAllRegistrations() {
  	this.testnet.getAllRegistrations().subscribe((result: any[]) => {
		const data = [];
		result.forEach(el => {
			data.push({ 'username': el.username, 'telegram': el.telegram });
		});

		this.dataSource = new MatTableDataSource(data);
		this.dataSource.paginator = this.paginator;
		this.dataSource.sort = this.sort;
	});
  }
}


export interface TestnetRegistrationElement {
  username: string;
  telegram: string;
}
