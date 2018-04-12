import { Component, OnInit } from '@angular/core';

import { DataService } from '../data.service';

import { BigNumber } from 'bignumber.js';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {

  userAddress = '';
  userTotalTokens: number;
  airdrop: boolean;
  contributions = [];
  totalEthContributed: BigNumber;
  distributions = [];
  totalExrnDistributed: number;
  displayContributions: boolean;
  correlations = [];

  constructor(private _dataService: DataService) { }

  ngOnInit() {
    this.resetState();
  }

  private resetState() {
    this.userAddress = this.userAddress.toLowerCase();

    this.userTotalTokens = 0;
    this.airdrop = false;
    this.totalEthContributed = new BigNumber(0);
    this.contributions.length = 0;
    this.totalExrnDistributed = 0;
    this.distributions.length = 0;
    this.displayContributions = false;
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
                this.totalExrnDistributed = this.totalExrnDistributed + tokens;
                return {
                    date: tx.timeStamp * 1000,
                    from: '0x' + tx.topics[1].substring(26),
                    block: parseInt(tx.blockNumber, 16),
                    hash: tx.transactionHash,
                    value: tokens
                };
            });
  }

  // TODO would be more fail-safe to refactor it using backtracking
  private correlateTransactions() {
    let foundAirdrop = false;
    let distrIndex = 0;

    // User made no contributions, but an airdrop is still possible
    if (this.contributions.length === 0) {
        if (distrIndex >= this.distributions.length) {
            return;
        }
        const distr = this.distributions[distrIndex];

        if (!foundAirdrop && distr.value === this._dataService.airdropAmount) {
            console.log('Airdrop (hidden from list)');
            foundAirdrop = true;
            this.airdrop = true;
            this.totalExrnDistributed = 0;  // reset since no contributions were made
        }

        return;
    }

    // Match contributions to distributions, filter airdrops / rewards / glitches
    this.contributions.forEach((contr, i) => {
        if (distrIndex >= this.distributions.length) {
            // Awaiting distributions
            this.correlations.push([[contr], []]);
            return;
        }
        const rate = this._dataService.findDistributionRate(contr.block);
        let owed = Math.round(contr.value * rate);
        let distr = this.distributions[distrIndex];

        // Filter possible glitch (double distribution)
        if (distr.from === this._dataService.glitchAddress && distr.value !== owed) {
            console.log('Glitch (hidden from list)');
            this.totalExrnDistributed -= distr.value;  // glitch counts as normal reward

            // if there are no other distributions left, then consider the contribution to be in awaiting state
            if (distrIndex + 1 >= this.distributions.length) {
                this.correlations.push([[contr], []]);
                return;
            }
            distr = this.distributions[++distrIndex];
        }

        // check for airdrop
        if (!foundAirdrop && distr.block <= contr.block && distr.value === this._dataService.airdropAmount) {
            console.log('Airdrop (hidden from list)');
            foundAirdrop = true;
            this.airdrop = true;
            this.totalExrnDistributed -= this._dataService.airdropAmount;  // airdrop counts as normal reward

            // in case of no other distributions, the resting contributions are in awaiting state
            if (distrIndex + 1 >= this.distributions.length) {
                this.correlations.push([[contr], []]);
                return;
            }
            distr = this.distributions[++distrIndex];
        }

        let given = distr.value;
        const match = [[contr], [distr]];

        // Allow 1 EXRN as margin for rounding errors
        if (Math.round(Math.abs(given - owed)) <= 1) {
            console.log('Match');
            distrIndex++;
            this.correlations.push(match);
            return;
        } else {
            // Awaiting combo distribution
            if (given < owed) {
                if (distrIndex + 1 >= this.distributions.length) {
                    // Awaiting state for current contribution
                    this.correlations.push(match);
                    return;
                }

                // Try to find a distribution combo that happened before the following contribution
                const nextContrBlock = i + 1 >= this.contributions.length ? Number.MAX_VALUE : this.contributions[i + 1].block;
                distr = this.distributions[++distrIndex];

                while (given < owed && distr.block < nextContrBlock) {
                    given += distr.value;
                    match[1].push(distr);
                    if (distrIndex + 1 >= this.distributions.length) {
                        // Partial match + awaiting state for current contribution
                        this.correlations.push(match);
                        return;
                    }
                    distr = this.distributions[++distrIndex];
                }

                // Allow 1 EXRN as margin for rounding errors
                if (Math.round(Math.abs(given - owed)) <= 1) {
                    console.log('Matched distr combo');
                    this.correlations.push(match);
                }
            } else {
                // Try to find a contribution combo for current distribution
                if (i + 1 >= this.contributions.length) {
                    // Candidate for a bonus distribution (for instance large ETH contribution)
                    console.log('Matched distr bonus');
                    this.correlations.push(match);
                    return;
                }

                contr = this.contributions[++i];

                while (given > owed && contr.block < distr.block) {
                    owed += contr.value;
                    match[0].push(contr);
                    this.contributions.shift();  // make sure forEach doesn't process next contribution twice

                    if (i + 1 >= this.contributions.length) {
                        // In case there are no more contributions, then we assume we received a bonus (for large ETH contribution)
                        console.log('Matched distr bonus');
                        this.correlations.push(match);
                        return;
                    }

                    contr = this.contributions[++i];
                }

                // Allow 1 EXRN as margin for rounding errors
                if (Math.round(Math.abs(given - owed)) <= 1) {
                    console.log('Matched contr combo');
                    this.correlations.push(match);
                }
            }
        }
    });
  }

  checkWallet() {
    this.resetState();

    if (!this.isHexWallet()) {
      return;
    }

    this.displayContributions = true;

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
          },
          err => console.error(err)
        );
  }
}
