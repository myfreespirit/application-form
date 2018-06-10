import { Inject } from '@angular/core';
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

  
  constructor(@Inject(DataService) private _dataService: DataService) {
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
    });
  }


  checkSignups() {
  	// per signup entry, validate it
	// this.validateSignup(5721283, 9999999, wallet, total, team, allTransfers[0].moves);
  }


  private validateSignup(formClosureBlock, snapshotBlock, wallet, total, team, transfers) {
  	let tokenBalanceAtClosedForm = transfers.reduce((balance, tx) => {
						if (tx.to === wallet && tx.blockNumber <= formClosureBlock) {
							// sum up all IN transactions before form closure
							//console.log("+", balance, tx.value);
							return balance + tx.value;
						} else if (this._dataService.tokenDistributorAddresses.includes(tx.from) && tx.blockNumber <= snapshotBlock) {
							// accept all "late" IN transactions from the distributor wallets
							//console.log("+++", balance, tx.value);
							return balance + tx.value;
						} else if (tx.from === wallet && tx.blockNumber <= formClosureBlock) {
							// subtract all OUT transactionsi before form closure
							//console.log("-", balance, tx.value);
							return balance - tx.value;
						}

						// do not count other late IN or OUT transactions yet
						return balance;
					}, 0);
	

	let minimalHoldAmount = tokenBalanceAtClosedForm;
	let actualBalance = tokenBalanceAtClosedForm;

	// correlation between other IN and late OUT transactions to prevent false positives
	transfers.forEach(tx => {
		if (tx.to === wallet && tx.blockNumber > formClosureBlock && tx.blockNumber <= snapshotBlock && !this._dataService.tokenDistributorAddresses.includes(tx.from)) {
			// late IN transactions (not from the team) provide buffer
			actualBalance += tx.value;
		} else if (tx.from === wallet && tx.blockNumber > formClosureBlock && tx.blockNumber <= snapshotBlock) {
			// late OUT transactions remove buffer
			actualBalance -= tx.value;
			if (minimalHoldAmount > actualBalance) {
				minimalHoldAmount = actualBalance;
			}
		}
	});

	console.log("Signup details:", wallet, "total(", total, ")", "team(", team, ")");
	console.log("total balance at closure", tokenBalanceAtClosedForm);
	console.log("minimal balance held from closure till snapshot", minimalHoldAmount);
	console.log("----------------------------------");
  }
}


export interface SignupsData {
  wallet: string;
  date: number;
  team: number;
  total: number;
  status: string;
}
