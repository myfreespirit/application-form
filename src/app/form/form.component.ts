import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { DataService } from '../services/data.service';
import { StateService } from "../services/state.service";
import { SignupSuccessDialog } from '../signup/signup.component';
import { BigNumber } from 'bignumber.js';


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})


export class FormComponent implements OnInit {

  APIerror = '';

  showSpinnerSignups: boolean;
  showSpinnerContributions: boolean;
  showSpinnerOtherRewards: boolean;
  showTransferReminder: boolean;
  showNormalEligibility: boolean;
  showContributorEligibility: boolean;
  showCallToAction: boolean;
  showAPIerror: boolean;  // TODO: implement notification
  showReport: boolean;
  showSignupResult: boolean;
  showReportResult: boolean;

  disableCheckWallet: boolean;
  displayHistory: boolean;
  firstSignupHappened: boolean;
  isManualEntryDisabled: boolean;

  userAddress = '';
  userTotalTokens: number;
  userTotalTokensEXRT: number;
  totalEthContributed: BigNumber;
  totalExrnDistributed: number;
  availableExrnDistributed: number;
  lastSignupDate: Date;
  totalRewards: number;
  username: string;
  reportComment: string;

  // TODO: automate progress bar
  totalSupplyEXRT: number;
  distributableEXRT: number;
  distributedPercentageEXRT: number;
  circulatingSupplyEXRT: number;
  
  tokenValue_EXRT_USD: number;
  tokenValue_ETH_USD: number;
  tokenValue_EXRN_USD: number;
  tokenValue_ETH_EXRN: number;
  
  signups: any;
  contributions = [];
  refunds = [];
  distributions = [];
  correlations = [];
  
  pricesUSD = [];
  calculatedAmountEXRN: number;

  rounds: any;
  roundExpiration: Date;
  daysLeftInRound = 21;
  thresholdDaysLeftInRound = 20;
  timerRoundExpired: boolean;
  text:any = {
    Days: "DAY",
    Hours: "HOUR",
    Minutes: "MIN",
    Seconds: "SEC"
  };


  constructor(
	@Inject(DataService) private _dataService: DataService,
	@Inject(StateService) private _stateService: StateService,
	@Inject(MatDialog) private dialog: MatDialog)
  {
        this.totalSupplyEXRT = Math.pow(10, 9);
        this.distributableEXRT = this.totalSupplyEXRT / 2;
  }

  ngOnInit() {
    this.resetState();

    this.disableCheckWallet = false;
    this.firstSignupHappened = false;
    this.isManualEntryDisabled = true;

    this.timerRoundExpired = false;

    this._dataService.getAllRounds().subscribe(result => {
		this.rounds = result;
		this.roundExpiration = this.rounds[this.rounds.length - 1].end;
		this.daysLeftInRound = (+new Date(this.roundExpiration) - +new Date()) / 1000 / 60 / 60 / 24;
        
        this.circulatingSupplyEXRT = this.distributableEXRT / 8 * (this.rounds.length - 1);
        this.distributedPercentageEXRT = this.circulatingSupplyEXRT / this.distributableEXRT * 100;
    });
    
    this._dataService.getTokenValue("exrt-network", "usd").subscribe(result => {
        this.tokenValue_EXRT_USD = result[0].current_price;
    });
    
    this._dataService.getPriceRatesUSD().subscribe((result: any[]) => {
        result.forEach(entry => {
            this.pricesUSD[entry.base] = entry.price_usd;
        });
    });
    
	this._stateService.userWallet.subscribe(wallet => this.userAddress = wallet);
    
	this.checkWallet();
  }


  private resetState() {
    this.APIerror = '';

    this.showSpinnerSignups = true;
    this.showSpinnerContributions = true;
    this.showSpinnerOtherRewards = true;
    this.showTransferReminder = false;
    this.showNormalEligibility = false;
    this.showContributorEligibility = false;
    this.showCallToAction = false;
    this.showReport = false;
    this.showSignupResult = false;
    this.showReportResult = false;

    this.showAPIerror = false;

    this.disableCheckWallet = true;
    this.displayHistory = false;

    this.userAddress = this.userAddress.toLowerCase();
    this.userTotalTokens = 0;
    this.userTotalTokensEXRT = 0;
    this.totalEthContributed = new BigNumber(0);
    this.totalExrnDistributed = 0;
    this.availableExrnDistributed = 0;
    this.totalRewards = 0;
    this.username = "";
    this.reportComment = "";

    this.signups = undefined;
    this.contributions = [];
    this.refunds = [];
    this.distributions = [];
    this.correlations = [];
    
    this.pricesUSD = [];
    this.calculatedAmountEXRN = 0;
  }


  private correlateTransactions() {
  //    let correlatedTransactions = this._dataService.correlateTransactions(this.refunds, this.contributions, this.distributions, this.correlations, this.totalEthContributed, this.userTotalTokens);
    let correlatedTransactions = this._dataService.correlateTransactions(this.refunds, this.contributions, this.distributions, this.userTotalTokens);

    this.refunds = correlatedTransactions[0];
    this.contributions = correlatedTransactions[1];
    this.distributions = correlatedTransactions[2];
    this.correlations = correlatedTransactions[3];
    this.userTotalTokens = correlatedTransactions[4];
    this.totalEthContributed = correlatedTransactions[5];
    this.totalExrnDistributed = correlatedTransactions[6];


    // Check whether user sold EXRN purchased from the team
    if (this.userTotalTokens < this.totalExrnDistributed) {
	    this.availableExrnDistributed = this.userTotalTokens;
	    this.showTransferReminder = true;
    } else {
	this.availableExrnDistributed = this.totalExrnDistributed;
    }


    // Calculate other EXRN received (airdrop, reward, advance payment)
    this.totalRewards = this.distributions.reduce((total, reward) => {
        return total + reward.value;
    }, 0);


    // Determine which extra notifications a user need to see
    if (this.userTotalTokens >= this._dataService.minimumExrnRequired && this.userTotalTokens > this.totalExrnDistributed) {
	this.showNormalEligibility = true;
    }
    if (this.availableExrnDistributed) {
	this.showContributorEligibility = true;
    }
    this.showCallToAction = this.userTotalTokens < this._dataService.minimumExrnRequired && !this.showTransferReminder;
  }

  
  private divideSignupsPerRound(data: any[]) {
      this.signups = [];
      let previousRoundEnd = 0;

      this.rounds.forEach(round => {
		this.signups[round.id] = data.filter(signup => {
				this.lastSignupDate = signup.date;
				return signup.date > previousRoundEnd && signup.date <= round.end;
    	});
		previousRoundEnd = round.end;
      });

      this.firstSignupHappened = this.signups[this.rounds.length - 1].length > 0;
  }


  signup() {
    this.showSpinnerSignups = true;
    this._dataService.setSignups(this.userAddress, this.userTotalTokens, this.availableExrnDistributed).subscribe((data: any[]) => {
	data = data['signups'];
	this.divideSignupsPerRound(data);

	this.showSpinnerSignups = false;
	this.showSignupResult = true;

	let dialogRef = this.dialog.open(SignupSuccessDialog);
	dialogRef.componentInstance['data'] = {
		round: this.rounds.length,
		time: Date.now(),
		total: this.userTotalTokens,
		team: this.availableExrnDistributed,
		wallet: this.userAddress
	};
	// dialogRef.afterClosed().subscribe(result => {
	//	console.log(`Dialog result: ${result}`);
	// });
    }, err => {
	this.showSpinnerSignups = false;
	this.showAPIerror = true;
	this.APIerror = err;
    });
  }


  private isValidEthAddress() {
	let regexp = new RegExp('^0x[a-fA-F0-9]{40}$');
	return regexp.test(this.userAddress);
  }


  checkWallet() {
    if (!this.isValidEthAddress()) {
        return;
    }

    this.resetState();
    this.displayHistory = true;

    this._dataService.getSignups(this.userAddress).subscribe((data: any[]) => {
      data = data.length ? data[0]['signups'] : [];
      this.divideSignupsPerRound(data);

      this.showSpinnerSignups = false;
      console.log(this.signups);
    });

    this._dataService.getTotalTokens(this.userAddress)
        .subscribe(data => {
            this.userTotalTokens = parseInt(data['result'], 10);

            this._dataService.getTransactionsByWallet(this.userAddress)
            .subscribe((data: any[]) => {
                this.contributions = data[0];
                this.refunds = data[1],
                this.distributions = data[2];

                this.correlateTransactions();
                console.log(this.correlations);
              },
              err => {
                console.error(err);  // TODO remove
                this.showAPIerror = true;
                this.APIerror = err;
              },
              () => {
                this.showSpinnerContributions = false;
                this.showSpinnerOtherRewards = false;

                this.disableCheckWallet = false;
              }
            );
        },
        err => {
          console.error(err);  // TODO remove
          this.showAPIerror = true;
	  this.APIerror = err;
        }
      );
      
    this._dataService.getTotalTokensEXRT(this.userAddress).subscribe(result => {
        this.userTotalTokensEXRT = result[0].EXRT;
    });
  }


  public showRefunds(): boolean {
	return this.refunds.length > 0;
  }


  public showReportForm() {
	this.showReport = true;
  }


  report() {
	this._dataService.reportMistake(this.username, this.userAddress, this.userTotalTokens, this.availableExrnDistributed, this.reportComment).subscribe(result => {
		this.showReportResult = true;
	});
  }


  showTimer() {
	return !this.timerRoundExpired && this.daysLeftInRound <= this.thresholdDaysLeftInRound;
  }


  roundExpired(event) {
	this.timerRoundExpired = true;
  }


  isBlacklisted() {
	return this._dataService.blacklistedAddresses.includes(this.userAddress);
  }


  isSignupOutdated() {
	if (this.signups != undefined) {
		let nrOfOwnSignups = this.signups[this.rounds.length - 1].length;
		let lastOwnSignup = this.signups[this.rounds.length - 1][nrOfOwnSignups -1];

		if (lastOwnSignup.totalEXRN != this.userTotalTokens) {
			return true;
		}

		if (lastOwnSignup.teamEXRN != this.availableExrnDistributed) {
			return true;
		}
	}

	return false;
  }
  
  
  calculateEXRN(event: any) {
    this.calculatedAmountEXRN = event.target.value * this.pricesUSD['ETH'] / this.pricesUSD['EXRN'];
  }
}
