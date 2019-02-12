import { animate, state, style, transition, trigger } from '@angular/animations';
import { Inject } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { MatDialog, MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { AuthService } from '../services/auth.service';
import { TestnetService } from '../services/testnet.service';

import { MarkObserversDialog } from './bulk/observer.component';


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

  displayError = false;
  displaySpin = false;
  displayResults = false;

  data = [];
  displayedTabs = ['BACKLOG', 'RESETS', 'OBSERVERS', 'TESTERS', 'REJECTED'];
  displayedColumns = ['Telegram', 'Username', 'Total EXRN', 'Total EXRT'];
  expandedElement: TestnetRegistrationElement;
  dataSource: MatTableDataSource<TestnetRegistrationElement>[];

  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();


  constructor(@Inject(AuthService) public auth: AuthService,
	  	@Inject(TestnetService) public testnet: TestnetService,
		@Inject(MatDialog) private dialog: MatDialog)
  {
	auth.handleAuthentication();

	this.dataSource = [];
	this.displayedTabs.forEach((tab, index) => {
		this.dataSource[tab] = new MatTableDataSource([]);
		this.dataSource[tab].paginator = this.paginator.toArray()[index];
		this.dataSource[tab].sort = this.sort.toArray()[index];
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
  	this.displayError = false;
	this.displaySpin = true;
	this.displayResults = true;

	this.data = [];
	this.displayedTabs.forEach(tab => {
		this.data[tab] = [];
	});

  	this.testnet.getAllRegistrations().subscribe((result: any[]) => {
		result.forEach(el => {
			let category = "";
			const lastStatus = el.states[el.states.length - 1].status;
			let action = this.getActionFromStatus(lastStatus);

			if (action !== 'SKIP') {
				this.data[action].push({
					'Telegram': '@'+el.telegram,
					'Username': el.username,
					'Total EXRN': Math.max(0, el.EXRN || 0),
					'Total EXRT': Math.max(0, Math.floor(el.EXRT || 0)),
					'access_key': el.hash,
					'wallet': el.wallet,
					'motivation': el.motivation,
					'states': el.states
				});
			}
		});

		this.displayedTabs.forEach((tab, index) => {
			this.dataSource[tab] = new MatTableDataSource(this.data[tab]);
			this.dataSource[tab].paginator = this.paginator.toArray()[index];
			this.dataSource[tab].sort = this.sort.toArray()[index];
			this.applyFilter('', tab);
		});

		this.displaySpin = false;
	});
  }


  getActionButtons(tab: string) {
	switch(tab) {
		case 'BACKLOG':
			return ['OBSERVERS', 'TESTERS', 'REJECTED'];
		case 'RESETS':
			return ['RESET APPROVED', 'RESET DENIED'];
		case 'OBSERVERS':
			return ['TESTERS', 'REJECTED'];
		case 'TESTERS':
			return ['OBSERVERS', 'REJECTED'];
		case 'REJECTED':
			return ['BACKLOG', 'OBSERVERS', 'TESTERS'];
	}
	return [];
  }


  moveApplication(tab: string, element: any, action: string) {
	let status = "";

	switch(action) {
		case 'OBSERVERS':
			status = 'APPROVED OBSERVER';
			break;
		case 'TESTERS':
			status = 'APPROVED TESTER';
			break;
		case 'BACKLOG':
			status = 'APPLIED';
			break;
		default:
			status = action;
			break;
	}

	this.testnet.updateRegistration(element.wallet, status).subscribe((result: any) => {
		if (result.states[result.states.length - 1].status === status) {
			if (status !== 'RESET APPROVED' && status !== 'RESET DENIED') {
				element.states = result.states;
				this.data[action].push(element);
				this.dataSource[action].data = this.data[action];
			} else if (status === 'RESET DENIED') {
				// application needs to be moved back to original state prior to RESET REQUEST
				const filteredStates = result.states.filter(state => {
					return !state.status.startsWith('RESET');
				});

				const originalStatus = filteredStates[filteredStates.length - 1].status;
				const originalAction = this.getActionFromStatus(originalStatus);
				this.testnet.updateRegistration(element.wallet, originalStatus).subscribe((resultInner: any) => {
					if (resultInner.states[resultInner.states.length - 1].status === originalStatus) {
						element.states = resultInner.states;
						this.data[originalAction].push(element);
						this.dataSource[originalAction].data = this.data[originalAction];
					} else {
						this.displayError = true;
					}
				});
			}

			// Remove element from current table
			this.data[tab] = this.data[tab].filter(el => { return el.wallet !== element.wallet; });
			this.dataSource[tab].data = this.data[tab];
		} else {
			this.displayError = true;
		}
	});
  }


  private getActionFromStatus(state: string): string {
	switch (state) {
		case 'APPLIED':
			return 'BACKLOG';
		case 'RESET REQUEST':
			return 'RESETS';
		case 'APPROVED OBSERVER':
			return 'OBSERVERS';
		case 'APPROVED TESTER':
			return'TESTERS';
		case 'REJECTED':
			return 'REJECTED';
		case 'RESET APPROVED':
		case 'RESET DENIED':
		default:
			return 'SKIP';
	}
  }


  markObservers() {
  	this.displaySpin = true;

	const dialogRef = this.dialog.open(MarkObserversDialog, {
		data: {
			tabs: this.displayedTabs,
			exrn: 1,
			exrt: 1
		}
	});

	dialogRef.afterClosed().subscribe(result => {
		if (result === null || result === undefined) {
			// Cancelled
			this.displaySpin = false;
			return;
		}

		result['tabs'].forEach(tab => {
			if (tab.checked) {
				this.dataSource[tab.name].data.forEach(element => {
					if (element['Total EXRN'] >= result['exrn']) {
						if (element['Total EXRT'] >= result['exrt']) {
							this.moveApplication(tab.name, element, 'OBSERVERS');
						}
					}
				});
			}
		});

		this.displaySpin = false;
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
