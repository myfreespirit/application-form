import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';

import { DataService } from '../data.service';

import { BigNumber } from 'bignumber.js';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})


export class FormComponent implements OnInit {

  showSpinnerSignups: boolean;
  showSpinnerContributions: boolean;
  showSpinnerOtherRewards: boolean;
  showTransferReminder: boolean;
  showNormalEligibility: boolean;
  showContributorEligibility: boolean;
  showCallToAction: boolean;
  showAPIerror: boolean;  // TODO: implement notification

  disableCheckWallet: boolean;
  displayHistory: boolean;
  firstSignupHappened: boolean;

  userAddress = '';
  userTotalTokens: number;
  totalEthContributed: BigNumber;
  totalExrnDistributed: number;
  availableExrnDistributed: number;
  totalRewards: number;

  signups: any;
  contributions = [];
  refunds = [];
  distributions = [];
  correlations = [];

  minimumExrnRequired = Math.pow(10, 7);


  constructor(@Inject(DataService) private _dataService: DataService) { }


  ngOnInit() {
    this.resetState();

    this.disableCheckWallet = false;
    this.firstSignupHappened = false;
  }


  private resetState() {
    this.showSpinnerSignups = true;
    this.showSpinnerContributions = true;
    this.showSpinnerOtherRewards = true;
    this.showTransferReminder = false;
    this.showNormalEligibility = false;
    this.showContributorEligibility = false;
    this.showCallToAction = false;

    this.showAPIerror = false;

    this.disableCheckWallet = true;
    this.displayHistory = false;

    this.userAddress = this.userAddress.toLowerCase();
    this.userTotalTokens = 0;
    this.totalEthContributed = new BigNumber(0);
    this.totalExrnDistributed = 0;
    this.availableExrnDistributed = 0;
    this.totalRewards = 0;

    this.signups = undefined;
    this.contributions = [];
    this.refunds = [];
    this.distributions = [];
    this.correlations = [];
  }


  private transformContributions() {
    this.contributions = this.contributions.map(tx => {
                const eth = new BigNumber(tx.value).div(1e18).toString();
                this.totalEthContributed = this.totalEthContributed.plus(eth);
                return {
                    date: tx.date * 1000,
                    block: parseInt(tx.blockNumber, 10),
                    hash: tx.hash,
                    value: eth
                };
            });
  }


  private transformRefunds() {
    this.refunds = this.refunds.map(tx => {
                const eth = new BigNumber(tx.value).div(1e18).toString();
                this.totalEthContributed = this.totalEthContributed.minus(eth);
                return {
                    date: tx.date * 1000,
                    block: parseInt(tx.blockNumber, 10),
                    hash: tx.hash,
                    value: eth
                };
            });
  }


  private transformDistributions() {
    this.distributions = this.distributions.map(tx => {
                const tokens = parseInt(tx.value, 16);
                this.totalExrnDistributed += tokens;
                return {
                    date: tx.date * 1000,
                    from: tx.from,
                    block: tx.blockNumber,
                    hash: tx.hash,
                    value: tokens
                };
            });
  }


  private findCombination(given, owed, active, candidates) {
    // TODO: determine plausible margin for rounding errors and possible bonus on large contributions
    const margin = 1;

    if (Math.abs(given - owed) < margin) {
        return active;
    }

    if (given > owed || candidates.length === 0) {
        return [];
    }

    const active1 = active.slice();
    active1.push(candidates[0]);
    const res1 = this.findCombination(given + candidates[0].value, owed, active1, candidates.slice(1));
    if (res1.length !== 0) {
        return res1;
    }

    const res2 = this.findCombination(given, owed, active, candidates.slice(1));
    if (res2.length !== 0) {
        return res2;
    }

    return [];
  }


  // TODO needs improvement in case more than one contribution is refunded in one transaction
  private correlateRefunds() {
    let correlations = [];

    this.refunds.forEach(refund => {
	const contribution = this.contributions.filter(contr => {
		return contr.value === refund.value && contr.block < refund.block;
	}).pop();

	if (contribution) {
		correlations.push([[contribution], [refund]]);
		const index = this.contributions.indexOf(contribution);
		if (index !== -1) {
			this.contributions.splice(index, 1);
		} else {
			console.error("ERROR: wrong index when removing refund from contributions.")
		}
	}
    });

    this.refunds = correlations;
  }


  private correlateTransactions() {
    this.correlateRefunds();

    let contrCandidates = [];

    while (this.contributions.length) {
        const contr = this.contributions.shift();
        contrCandidates.push(contr);

        // retrieve the total owed amount of EXRN so far for current contribution candidates
        let owed = contrCandidates.reduce((total, ctr) => {
            const rate = this._dataService.findDistributionRate(ctr.block);
            return total + ctr.value * rate;
        }, 0);
        owed += this._dataService.applicableBonus(owed);

        // Retrieve a list of possible distribution candidates for current contribution candidates
        const nextContrBlock = this.contributions.length === 0 ? Number.MAX_VALUE : this.contributions[0].block;
        const distrCandidates = this.distributions.filter(distr => {
            return distr.block < nextContrBlock;  // Relaxed filter mode to allow for recuperation of the glitch (advance payment)
            // return distr.block >= contrCandidates[0].block && distr.block < nextContrBlock;  // Strict filter mode
        });

        // Find a correlating match from combinations of distribution candidates for current contribution candidates
        const combination = this.findCombination(0, owed, [], distrCandidates);

        if (combination.length) {
            this.correlations.push([contrCandidates, combination]);
            contrCandidates = [];

            // remove the correlated combination from distributions to ease up the complexity of next iteration
            combination.forEach(combo => {
                const index = this.distributions.findIndex(distr => {
                    return distr.block === combo.block &&
                            distr.hash === combo.hash &&
                            distr.value === combo.value;
                });
                this.distributions.splice(index, 1);
            });
        }
    }

    // rest of contributions are still in the AWAITING state
    if (contrCandidates.length) {
	contrCandidates.forEach(contr => {
		let distr = {
			'block': 'AWAITING',
			'value': Math.floor(this._dataService.findDistributionRate(contr.block) * contr.value)
		};

		this.correlations.push([[contr], [distr]]);
		this.userTotalTokens += distr.value;
	});
    }


    // Recalculate amount of EXRN purchased based on correlated data
    this.totalExrnDistributed = this.correlations.reduce((total, corr) => {
        return total +
            corr[1].reduce((totalCorr, distr) => {
                return totalCorr + distr.value;
        }, 0);
    }, 0);

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
    if (this.userTotalTokens >= this.minimumExrnRequired && this.userTotalTokens > this.totalExrnDistributed) {
	this.showNormalEligibility = true;
    }
    if (this.availableExrnDistributed) {
	this.showContributorEligibility = true;
    }
    this.showCallToAction = this.userTotalTokens < this.minimumExrnRequired && !this.showTransferReminder;

  }


  signup() {
    this.showSpinnerSignups = true;
    this._dataService.setSignups(this.userAddress, this.userTotalTokens, this.availableExrnDistributed).subscribe(data => {
      this.signups = data;
      this.showSpinnerSignups = false;
      this.firstSignupHappened = this.signups !== undefined;
    });
  }


  checkWallet() {
    this.resetState();
    this.displayHistory = true;

    this._dataService.getSignups(this.userAddress).subscribe(data => {
      this.signups = data[0];
      this.showSpinnerSignups = false;
      this.firstSignupHappened = this.signups !== undefined;
    });

    this._dataService.getTotalTokens(this.userAddress)
        .subscribe(data => {
            this.userTotalTokens = parseInt(data['result'], 10);

	      this._dataService.getDistributedTokens(this.userAddress)
		.subscribe((data: any[]) => {
		    this.contributions = data[0];
		    this.refunds = data[1],
		    this.distributions = data[2];

		    this.transformContributions();
		    this.transformRefunds();
		    this.transformDistributions();

		    this.correlateTransactions();
		  },
		  err => {
		    console.error(err);  // TODO remove
		    this.showAPIerror = true;
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
        }
      );
  }


  public showRefunds() : boolean {
	return this.refunds.length > 0;
  }
}
