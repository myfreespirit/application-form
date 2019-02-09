import { animate, state, style, transition, trigger } from '@angular/animations';
import { Inject } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { AuthService } from '../services/auth.service';
import { TestnetService } from '../services/testnet.service';


@Component({
  selector: 'app-admin',
  styleUrls: ['./admin.component.scss'],
  templateUrl: './admin.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('125ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('125ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})


export class AdminComponent implements OnInit, AfterViewInit {

  data = [];
  displayedTabs = ['BACKLOG', 'RESETS', 'OBSERVERS', 'TESTERS', 'REJECTED'];
  displayedColumns = ['telegram', 'username', 'Total EXRN', 'Total EXRT'];
  expandedElement: TestnetRegistrationElement;
  dataSource: MatTableDataSource<TestnetRegistrationElement>[];

  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();

  constructor(@Inject(AuthService) public auth: AuthService, @Inject(TestnetService) public testnet: TestnetService) {
	auth.handleAuthentication();

	this.dataSource = [];
	this.displayedTabs.forEach((tab, index) => {
		this.dataSource[tab] = new MatTableDataSource([]);
		this.dataSource[tab].paginator = this.paginator.toArray()[index];
		this.dataSource[tab].sort = this.sort.toArray()[index];
		console.log(tab);
	});
  }


  ngAfterViewInit() {
	this.displayedTabs.forEach((tab, index) => {
		this.dataSource[tab].paginator = this.paginator.toArray()[index];
		this.dataSource[tab].sort = this.sort.toArray()[index];
	});
  }


  ngOnInit() {
	if (localStorage.getItem('isLoggedIn') === 'true') {
		this.auth.renewToken();
	}
  }


  applyFilter(filterValue: string, tab: string) {
	filterValue = filterValue.trim();
	filterValue = filterValue.toLowerCase();
	this.dataSource[tab].filter = filterValue;

	if (this.dataSource[tab].paginator) {
		this.dataSource[tab].paginator.firstPage();
	}
  }


  private getAllRegistrations() {
	this.data = [];
	this.displayedTabs.forEach(tab => {
		console.log("test");
		this.data[tab] = [];
	});

  	this.testnet.getAllRegistrations().subscribe((result: any[]) => {
		result.forEach(el => {
			let category = "";
			const lastStatus = el.states[el.states.length - 1].status;
			switch (lastStatus) {
				case 'APPLIED':
					category = 'BACKLOG';
					break;
				case 'RESET REQUEST':
					category = 'RESETS';
					break;
				case 'APPROVED OBSERVER':
					category = 'OBSERVERS';
					break;
				case 'APPROVED TESTER':
					category = 'TESTERS';
					break;
				case 'REJECTED':
					category = 'REJECTED';
					break;
			}

			this.data[category].push({ 'telegram': '@'+el.telegram, 'username': el.username, 'access_key': el.hash, 'wallet': el.wallet, 'motivation': el.motivation, 'states': el.states });
		});

		this.displayedTabs.forEach((tab, index) => {
			this.dataSource[tab] = new MatTableDataSource(this.data[tab]);
			this.dataSource[tab].paginator = this.paginator.toArray()[index];
			this.dataSource[tab].sort = this.sort.toArray()[index];
		});
	});
  }
}


export interface TestnetRegistrationElement {
  telegram: string;
  username: string;
  access_key: string;
  wallet: string;
  motivation: string;
  states: any;
  expanded: boolean;
}
