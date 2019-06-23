import { Inject } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Papa } from 'ngx-papaparse';
import { filter } from "rxjs/operators";

import { DataService } from '../services/data.service';


@Component({
  selector: 'app-staff',
  styleUrls: ['./staff.component.scss'],
  templateUrl: './staff.component.html',
  encapsulation: ViewEncapsulation.None
})

export class StaffComponent implements OnInit, AfterViewInit {

  signups: any;
  showNotification: boolean;

  displayedColumnsInternal = ['ETH Wallet Address', 'Date', 'Total EXRN balance', 'Bought?', 'Amount bought', 'Minimal EXRN held', 'Current EXRN balance', 'Actual EXRN bought', 'Qualified Regular EXRN', 'Qualified Bought EXRN', 'Status'];

  dataSourceInternal: MatTableDataSource<SignupsDataInternal>;

  @ViewChild('paginatorInternal', { static: false }) paginatorInternal: MatPaginator;
  @ViewChild('sortInternal', { static: false }) sortInternal: MatSort;

  
  constructor(@Inject(DataService) private _dataService: DataService,
  	@Inject(Papa) private _papa: Papa) {

    this.showNotification = true;
    this.dataSourceInternal = new MatTableDataSource([]);

    this.getLastSignups();
  }


  ngAfterViewInit() {
    this.dataSourceInternal.paginator = this.paginatorInternal;

    this.dataSourceInternal.sort = this.sortInternal;
  }
  

  ngOnInit() {
  }

  
  applyFilterInternal(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSourceInternal.filter = filterValue;

    if (this.dataSourceInternal.paginator) {
      this.dataSourceInternal.paginator.firstPage();
    }
  }


  getLastSignups() {
	this._dataService.getAllRounds().subscribe((rounds: any[]) => {
		let formClosureBlock = rounds[rounds.length - 1].endBlock;
		let prevFormEndDate = rounds[rounds.length - 2].end;

		this._dataService.getCurrentEtherBlock().subscribe(data => {
			let snapshotBlock = parseInt(data['result'], 16);

			this._dataService.getAllLatestSignupsAfter(prevFormEndDate).subscribe(result => {
				this.signups = result;
				console.log("form closed @", formClosureBlock, "snapshot @", snapshotBlock);

				this._dataService.getTransactions().subscribe((result: any[]) => {
					let refunds = result[0].filter(tx => {
						return this._dataService.EXRNchainTokenSaleAddress === tx.from;
					});

					let contributions = result[0].filter(tx => {
						return this._dataService.EXRNchainTokenSaleAddress === tx.to;
					});

					let distributions = result[1];

					const data: SignupsDataInternal[] = [];	
					this.signups.forEach(el => {
						let balances = this.validateSignup(formClosureBlock, snapshotBlock, el.wallet, el.total, el.team, refunds, contributions, distributions);

						let wallet = el.wallet;
						let date = el.date;
						let total = el.total;
						let team = el.team;
						let minimal = balances[0];
						let actual = balances[1];
						let actualTeam = balances[2];
						let qualifiedRegular = 0;
						let qualifiedBought = 0;
						let status = '';

						// exclude blacklisted wallets
						if (this._dataService.blacklistedAddresses.includes(el.wallet)) {
							status = 'BLACKLIST';
							qualifiedBought = 0;
							qualifiedRegular = 0;
						} else if (actualTeam === 0) {
							if (team > 0) {
								// disqualify cheaters
								status = 'CHEATER';
								qualifiedBought = 0;
								qualifiedRegular = 0;
							}
						}

						if (status !== 'CHEATER' && status !== 'BLACKLIST') {
							if (team === 0 && actualTeam === 0) {
							// REGULAR
								if (total < this._dataService.minimumExrnRequired) {
									status = 'REG INSUFFICIENT';
									qualifiedBought = 0;
									qualifiedRegular = 0;
								}
								else if (total > minimal) {
									status = 'REG INVALID';
									qualifiedBought = 0;
									qualifiedRegular = 0;
								} else {
									status = 'REG QUALIFIED';
									qualifiedBought = 0;
									qualifiedRegular = total;
								}
							} else {
							// CONTRIBUTOR
								if (actual === 0) {
									status = 'CONTR EMPTY';
									qualifiedBought = 0;
									qualifiedRegular = 0;
								} else if (total <= minimal) {
									status = 'CONTR QUALIFIED';
									qualifiedBought = Math.min(team, actualTeam);
									// qualifiedRegular = (Math.min(total, minimal) >= this._dataService.minimumExrnRequired) ? total - qualifiedBought : 0;
									qualifiedRegular = (total >= this._dataService.minimumExrnRequired) ? total - qualifiedBought : 0;  // simplification due to minimal >= total
								} else {
									// fix numbers of contributors
									status = 'CONTR MOVED';
									qualifiedBought = Math.min(Math.min(team, actualTeam), minimal);
									// qualifiedRegular = (Math.min(minimal, total) >= this._dataService.minimumExrnRequired) ? Math.min(minimal, total) - qualifiedBought : 0;
									qualifiedRegular = (minimal >= this._dataService.minimumExrnRequired) ? minimal - qualifiedBought : 0;  // simplification due to minimal < total
								}
							}
						}

						data.push({
							'ETH Wallet Address': wallet,
							'Date': date,
							'Total EXRN balance': total,
							'Bought?': team ? 'Yes' : 'No',
							'Amount bought': team,
							'Minimal EXRN held': minimal,
							'Current EXRN balance': actual,
							'Actual EXRN bought': actualTeam,
							'Qualified Regular EXRN': qualifiedRegular,
							'Qualified Bought EXRN': qualifiedBought,
							'Status': status
						});
					});

					this.dataSourceInternal = new MatTableDataSource(data);
					this.dataSourceInternal.paginator = this.paginatorInternal;
					this.dataSourceInternal.sort = this.sortInternal;
					this.showNotification = false;
				});
			});
		});
	});
  }


  private validateSignup(formClosureBlock, snapshotBlock, wallet, total, team, refunds, contributions, distributions) {
	refunds = refunds.filter(tx => {
		return tx.to === wallet;
	});

	contributions = contributions.filter(tx => {
		return tx.from === wallet;
	});

	let transfers = distributions.filter(tx => {
		return tx.to === wallet || tx.from === wallet;
	});

	distributions = transfers.filter(tx => {
		return tx.to === wallet && this._dataService.tokenDistributorAddresses.includes(tx.from);
	});


	let userTotalTokens = 0;
	let correlatedTransactions = this._dataService.correlateTransactions(refunds, contributions, distributions, userTotalTokens);
	//refunds = correlatedTransactions[0];
	//contributions = correlatedTransactions[1];
	//distributions = correlatedTransactions[2];
	//let correlations = correlatedTransactions[3];
	userTotalTokens = correlatedTransactions[4];
	//let totalEthContributed = correlatedTransactions[5];
	let totalExrnDistributed = correlatedTransactions[6];


	  let tokenBalanceAtClosedForm = transfers.reduce((balance, tx) => {
							if (tx.blockNumber <= formClosureBlock && tx.to === wallet) {
								// sum up all IN transactions before form closure
								return balance + tx.value;
							} else if (tx.blockNumber <= snapshotBlock && this._dataService.tokenDistributorAddresses.includes(tx.from)) {
								// accept all "late" IN transactions from the distributor wallets
								return balance + tx.value;
							} else if (tx.blockNumber <= formClosureBlock && tx.from === wallet) {
								// subtract all OUT transactions before form closure
								return balance - tx.value;
							}

							// do not count other late IN or OUT transactions yet
							return balance;
						}, 0);
	

	let minimalHoldAmount = tokenBalanceAtClosedForm;
	let actualBalance = tokenBalanceAtClosedForm;

	// correlation between other IN and late OUT transactions to prevent false positives
	transfers.forEach(tx => {
		if (tx.blockNumber > formClosureBlock && tx.blockNumber <= snapshotBlock && tx.to === wallet && !this._dataService.tokenDistributorAddresses.includes(tx.from)) {
			// late IN transactions (not from the team) provide buffer
			actualBalance += tx.value;
		} else if (tx.blockNumber > formClosureBlock && tx.blockNumber <= snapshotBlock && tx.from === wallet) {
			// late OUT transactions remove buffer
			actualBalance -= tx.value;
			if (minimalHoldAmount > actualBalance) {
				minimalHoldAmount = actualBalance;
			}
		}
	});

	return [minimalHoldAmount, actualBalance, totalExrnDistributed];
  }


  export() {
  	console.log(this.dataSourceInternal.filteredData);

	let options = {
		delimiter: ";",	// auto-detect
		header: true
	};

	let data = this._papa.unparse(this.dataSourceInternal.filteredData, options);

	let blob = new Blob([data], { type: 'text/csv' });
	let blobURL = window.URL.createObjectURL(blob);

	let anchor = document.createElement("a");
	anchor.download = this.dataSourceInternal.filter + ".csv";
	anchor.href = blobURL;
	anchor.click();
  }
}


export interface SignupsDataInternal {
  'ETH Wallet Address': string;
  'Date': number;
  'Total EXRN balance': number;
  'Bought?': string;
  'Amount bought': number;
  'Minimal EXRN held': number;
  'Current EXRN balance': number;
  'Actual EXRN bought': number;
  'Qualified Regular EXRN': number;
  'Qualified Bought EXRN': number;
  'Status': string;
}
