import { Inject } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { Papa } from 'ngx-papaparse';
import { filter } from "rxjs/operators";

import { DataService } from '../data.service';


@Component({
  selector: 'app-staff',
  styleUrls: ['./staff.component.scss'],
  templateUrl: './staff.component.html',
  encapsulation: ViewEncapsulation.None
})

export class StaffComponent implements OnInit, AfterViewInit {

  signups: any;
  dataExternal: SignupsDataExternal[] = [];

  displayedColumnsInternal = ['wallet', 'date', 'total', 'team', 'status'];
  displayedColumnsExternal = ['ETH Wallet Address', 'Total EXRN balance', 'Bought?', 'Amount bought', 'Minimal EXRN held', 'Current EXRN balance', 'Actual EXRN bought', 'Status'];

  dataSourceInternal: MatTableDataSource<SignupsDataInternal>;
  dataSourceExternal: MatTableDataSource<SignupsDataExternal>;

  @ViewChild('paginatorInternal') paginatorInternal: MatPaginator;
  @ViewChild('paginatorExternal') paginatorExternal: MatPaginator;
  @ViewChild('sortInternal') sortInternal: MatSort;
  @ViewChild('sortExternal') sortExternal: MatSort;

  
  constructor(@Inject(DataService) private _dataService: DataService,
		  @Inject(Papa) private _papa: Papa) {
    this.dataSourceInternal = new MatTableDataSource([]);
    this.dataSourceExternal = new MatTableDataSource([]);

    this.getLastSignups();
  }


  ngAfterViewInit() {
    this.dataSourceInternal.paginator = this.paginatorInternal;
    this.dataSourceExternal.paginator = this.paginatorExternal;

    this.dataSourceInternal.sort = this.sortInternal;
    this.dataSourceExternal.sort = this.sortExternal;
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


  applyFilterExternal(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSourceExternal.filter = filterValue;

    if (this.dataSourceExternal.paginator) {
      this.dataSourceExternal.paginator.firstPage();
    }
  }


  getLastSignups() {
    this._dataService.getLastSignups()
    	.subscribe(result => {
        	this.signups = result;

		const data: SignupsDataInternal[] = [];
		this.signups.forEach(el => {
		    data.push({
			wallet: el.wallet,
			date: el.date,
			total: el.total,
			team: el.team,
			status: '---'
		    });
		});

	    this.dataSourceInternal = new MatTableDataSource(data);
	    this.dataSourceInternal.paginator = this.paginatorInternal;
	    this.dataSourceInternal.sort = this.sortInternal;
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
							if (tx.to === wallet && tx.blockNumber <= formClosureBlock) {
								// sum up all IN transactions before form closure
								// console.log("+", balance, tx.value);
								return balance + tx.value;
							} else if (this._dataService.tokenDistributorAddresses.includes(tx.from) && tx.blockNumber <= snapshotBlock) {
								// accept all "late" IN transactions from the distributor wallets
								// console.log("+++", balance, tx.value);
								return balance + tx.value;
							} else if (tx.from === wallet && tx.blockNumber <= formClosureBlock) {
								// subtract all OUT transactions before form closure
								// console.log("-", balance, tx.value);
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

	return [minimalHoldAmount, actualBalance, totalExrnDistributed];
  }


  parse(files) {
	this.dataExternal = [];

	/*
	let skippedRecords = [];
	let DQcheatRegularRecords = [];
	let DQinvalidRegularRecords = [];
	let DQmovedRegularRecords = [];
	let OKheldRegularRecords = [];
	let OKemptyContributorRecords = [];
	let OKheldContributorRecords = [];
	let OKmovedContributorRecords = [];
	*/

	let snapshotBlock = 0;
	let formClosureBlock = 5721283;  // TODO: retrieval from form
	let refunds: any;
	let contributions: any;
	let distributions: any;

	let options = {
		delimiter: "",	// auto-detect
		newline: "",	// auto-detect
		header: true,
		trimHeaders: false,
		dynamicTyping: true,
		preview: 0,
		encoding: "",
		worker: false,
		step: undefined,
		error: undefined,
		download: false,
		skipEmptyLines: true,
		chunk: undefined,
		fastMode: undefined,
		beforeFirstChunk: undefined,
		withCredentials: undefined,
		transform: undefined,
		complete: (results, file) => {
			console.log('Parsed: ', results, file);
			results.data.forEach(row => {
				if (!this._dataService.isValidWallet(row['ETH Wallet Address'])) {
				// INVALID WALLET ADDRESS
					//skippedRecords.push(row);
					this.dataExternal.push({
						'ETH Wallet Address': row['ETH Wallet Address'],
						'Total EXRN balance': row['Total EXRN balance'],
						'Bought?': row['Bought?'],
						'Amount bought': row['Amount bought'],
						'Minimal EXRN held': 0,
						'Current EXRN balance': 0,
						'Actual EXRN bought': 0,
						'Status': 'SKIPPED'
					});
				} else {
				// VALID WALLET ADDRESS
					const wallet = row['ETH Wallet Address'].toLowerCase();
					const total = row['Total EXRN balance'];
					let team = row['Bought?'] === "Yes" ? row['Amount bought'] : 0;
					team = team ? team : 0;  // Some users left the field blank after selecting that they purchased EXRN from team

					let balances = this.validateSignup(formClosureBlock, snapshotBlock, wallet, total, team, refunds, contributions, distributions);
					let minimal = balances[0];
					let actual = balances[1];
					let actualTeam = balances[2];

					// fix numbers for contributors and disqualify cheaters
					if (actualTeam === 0) {
						if (team > 0) {
							//DQcheatRegularRecords.push([wallet, total, team, minimal, actual]);
							this.dataExternal.push({
								['ETH Wallet Address']: row['ETH Wallet Address'],
								'Total EXRN balance': row['Total EXRN balance'],
								'Bought?': row['Bought?'],
								'Amount bought': row['Amount bought'],
								'Minimal EXRN held': minimal,
								'Current EXRN balance': actual,
								'Actual EXRN bought': actualTeam,
								'Status': 'CHEATER'
							});
							return;
						}
					} else {
						if (team > actualTeam) {
							team = actualTeam;
						}
					}

					if (team === 0) {
					// REGULAR
						if (total < this._dataService.minimumExrnRequired) {
							//DQinvalidRegularRecords.push([wallet, total, team, minimal, actual]);
							this.dataExternal.push({
								['ETH Wallet Address']: row['ETH Wallet Address'],
								'Total EXRN balance': row['Total EXRN balance'],
								'Bought?': row['Bought?'],
								'Amount bought': row['Amount bought'],
								'Minimal EXRN held': minimal,
								'Current EXRN balance': actual,
								'Actual EXRN bought': actualTeam,
								'Status': 'REG INVALID'
							});
						}
						else if (total > minimal) {
							//DQmovedRegularRecords.push([wallet, total, team, minimal, actual]);
							this.dataExternal.push({
								['ETH Wallet Address']: row['ETH Wallet Address'],
								'Total EXRN balance': row['Total EXRN balance'],
								'Bought?': row['Bought?'],
								'Amount bought': row['Amount bought'],
								'Minimal EXRN held': minimal,
								'Current EXRN balance': actual,
								'Actual EXRN bought': actualTeam,
								'Status': 'REG MOVED'
							});
						} else {
							//OKheldRegularRecords.push([wallet, total, team, minimal, actual]);
							this.dataExternal.push({
								['ETH Wallet Address']: row['ETH Wallet Address'],
								'Total EXRN balance': row['Total EXRN balance'],
								'Bought?': row['Bought?'],
								'Amount bought': row['Amount bought'],
								'Minimal EXRN held': minimal,
								'Current EXRN balance': actual,
								'Actual EXRN bought': actualTeam,
								'Status': 'REG QUALIFIED'
							});
						}
					} else {
					// CONTRIBUTOR
						if (actual === 0) {
							//OKemptyContributorRecords.push([wallet, total, team, minimal, actual]);
							this.dataExternal.push({
								['ETH Wallet Address']: row['ETH Wallet Address'],
								'Total EXRN balance': row['Total EXRN balance'],
								'Bought?': row['Bought?'],
								'Amount bought': row['Amount bought'],
								'Minimal EXRN held': minimal,
								'Current EXRN balance': actual,
								'Actual EXRN bought': actualTeam,
								'Status': 'CONTR EMPTY'
							});
						} else if (total <= minimal) {
							//OKheldContributorRecords.push([wallet, total, team, minimal, actual]);
							this.dataExternal.push({
								['ETH Wallet Address']: row['ETH Wallet Address'],
								'Total EXRN balance': row['Total EXRN balance'],
								'Bought?': row['Bought?'],
								'Amount bought': row['Amount bought'],
								'Minimal EXRN held': minimal,
								'Current EXRN balance': actual,
								'Actual EXRN bought': actualTeam,
								'Status': 'CONTR QUALIFIED'
							});
						} else {
							//OKmovedContributorRecords.push([wallet, total, team, minimal, actual]);
							this.dataExternal.push({
								['ETH Wallet Address']: row['ETH Wallet Address'],
								'Total EXRN balance': row['Total EXRN balance'],
								'Bought?': row['Bought?'],
								'Amount bought': row['Amount bought'],
								'Minimal EXRN held': minimal,
								'Current EXRN balance': actual,
								'Actual EXRN bought': actualTeam,
								'Status': 'CONTR MOVED'
							});
						}
					}
				}
			});


		        this.dataSourceExternal = new MatTableDataSource(this.dataExternal);
			this.dataSourceExternal.paginator = this.paginatorExternal;
			this.dataSourceExternal.sort = this.sortExternal;

			/*
			console.log('skipped', skippedRecords);
			console.log('regular: cheated team amount (disqualified)', DQcheatRegularRecords);
			console.log('regular: requirements not met (disqualified)', DQinvalidRegularRecords);
			console.log('regular: moved too many tokens (disqualified)', DQmovedRegularRecords);
			console.log('regular: held tokens (qualified)', OKheldRegularRecords);
			console.log('contributor: 0 balance (no action required)', OKemptyContributorRecords);
			console.log('contributor: held tokens (qualified)', OKheldContributorRecords);
			console.log('contributor: moved tokens (qualified)', OKmovedContributorRecords);
			*/
			console.log("done");
		}
	};

	this._dataService.getCurrentEtherBlock().subscribe(data => {
		snapshotBlock = parseInt(data['result'], 16);
		console.log(snapshotBlock);

		this._dataService.getTransactions().subscribe((result: any[]) => {
			refunds = result[0].filter(tx => {
				return this._dataService.EXRNchainTokenSaleAddress === tx.from;
			});

			contributions = result[0].filter(tx => {
				return this._dataService.EXRNchainTokenSaleAddress === tx.to;
			});

			distributions = result[1];

			this._papa.parse(files[0], options);
		});
	});
  }


  export() {
  	console.log(this.dataSourceExternal.filteredData);

	let options = {
		delimiter: ";",	// auto-detect
		header: true
	};

	let data = this._papa.unparse(this.dataSourceExternal.filteredData, options);

	let blob = new Blob([data], { type: 'text/csv' });
	let blobURL = window.URL.createObjectURL(blob);

	let anchor = document.createElement("a");
	anchor.download = this.dataSourceExternal.filter + ".csv";
	anchor.href = blobURL;
	anchor.click();
  }
}


export interface SignupsDataInternal {
  wallet: string;
  date: number;
  team: number;
  total: number;
  status: string;
}


export interface SignupsDataExternal {
  'ETH Wallet Address': string;
  'Total EXRN balance': number;
  'Bought?': string;
  'Amount bought': number;
  'Minimal EXRN held': number;
  'Current EXRN balance': number;
  'Actual EXRN bought': number;
  'Status': string;
}
