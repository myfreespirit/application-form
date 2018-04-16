import { Component, OnInit } from '@angular/core';

import { DataService } from '../data.service';

import { BigNumber } from 'bignumber.js';


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})


export class FormComponent implements OnInit {

  disableCheckWallet: boolean;
  displayContributions: boolean;
  displayRewards: boolean;
  firstSignupHappened: boolean;

  userAddress = '';
  userTotalTokens: number;
  totalEthContributed: BigNumber;
  totalExrnDistributed: number;
  totalRewards: number;

  contributions = [];
  distributions = [];
  correlations = [];


  constructor(private _dataService: DataService) { }


  ngOnInit() {
    this.resetState();

    this.disableCheckWallet = false;
    this.firstSignupHappened = false;
  }


  private resetState() {
    this.disableCheckWallet = true;
    this.displayContributions = false;
    this.displayRewards = false;

    this.userAddress = this.userAddress.toLowerCase();
    this.userTotalTokens = 0;
    this.totalEthContributed = new BigNumber(0);
    this.totalExrnDistributed = 0;
    this.totalRewards = 0;

    this.contributions = [];
    this.distributions = [];
    this.correlations = [];
  }


  // Ethereum wallet is basically a 40 characters long hexadecimal prepended with "0x"
  private isHexWallet() {
    return /^0x[a-fA-F0-9]{40}$/.test(this.userAddress);
  }


  private transformContributions() {
    this.contributions = this.contributions.filter(tx => {
                return tx.isError === '0' &&
                        tx.from === this.userAddress;
            }).map(tx => {
                const eth = new BigNumber(tx.value).div(1e18).toString();
                this.totalEthContributed = this.totalEthContributed.plus(eth);
                return {
                    date: tx.timeStamp * 1000,
                    block: parseInt(tx.blockNumber, 10),
                    hash: tx.hash,
                    value: eth
                };
            });
  }


  private transformDistributions() {
    this.distributions = this.distributions.filter(tx => {
                return this._dataService.tokenDistributorTopics.includes(tx.topics[1]);
            }).map(tx => {
                const tokens = parseInt(tx.data, 16);
                this.totalExrnDistributed += tokens;
                return {
                    date: tx.timeStamp * 1000,
                    from: '0x' + tx.topics[1].substring(26),
                    block: parseInt(tx.blockNumber, 16),
                    hash: tx.transactionHash,
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


  private correlateTransactions() {
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
            return distr.block >= contrCandidates[0].block && distr.block < nextContrBlock;
        });

        // Find a correlating match from combinations of distribution candidates for current contribution candidates
        const combination = this.findCombination(0, owed, [], distrCandidates);

        if (combination.length) {
            this.correlations.push([contrCandidates, combination]);
            contrCandidates = [];

            // remove the combination from distributions
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
        this.correlations.push([contrCandidates, []]);
    }

    // Recalculate amount of EXRN purchased based on correlated data
    this.totalExrnDistributed = this.correlations.reduce((total, corr) => {
        return total +
            corr[1].reduce((totalCorr, distr) => {
                return totalCorr + distr.value;
        }, 0);
    }, 0);

    // Calculate other EXRN received (airdrop, reward, doubles)
    this.totalRewards = this.distributions.reduce((total, reward) => {
        return total + reward.value;
    }, 0);
  }


  checkWallet() {
    // TODO: determine whether first signup happened
    // TODO: hide previous signups + contributions + rewards in expandable blocks
    // TODO: paginate large quantities of results

    this.resetState();

    if (!this.isHexWallet()) {
      this.disableCheckWallet = false;
      return;
    }

    this.displayContributions = true;
    this.displayRewards = true;

    this._dataService.getTotalTokens(this.userAddress)
        .subscribe(data => {
            this.userTotalTokens = data['result'];
        },
        err => console.error(err)
    );

    this._dataService.getDistributedTokens(this.userAddress)
        .subscribe(data => {
            this.contributions = data[0]['result'];
            this.distributions = data[1]['result'];

            this.transformContributions();
            this.transformDistributions();

            this.correlateTransactions();

            this.disableCheckWallet = false;
          },
          err => console.error(err)
        );
  }
}
