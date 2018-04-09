import { Component, OnInit } from '@angular/core';

import { DataService } from '../data.service';

import { BigNumber } from 'bignumber.js';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {

  userAddress = "";
  userTotalTokens: number;
  contributions = [];
  totalEthContributed: BigNumber;
  distributions = [];
  totalExrnDistributed: number;
  displayContributions: boolean;

  constructor(private _dataService: DataService) { }

  ngOnInit() {
    this.resetState();
  }

  private resetState() {
    this.userAddress = this.userAddress.toLowerCase();

    this.userTotalTokens = 0;
    this.totalEthContributed = new BigNumber(0);
    this.contributions.length = 0;
    this.totalExrnDistributed = 0;
    this.distributions.length = 0;
    this.displayContributions = false;
  }

  // Ethereum wallet is basically a 40 characters long hexadecimal prepended with "0x"
  private isHexWallet() {
    return /^0x[a-fA-F0-9]{40}$/.test(this.userAddress);
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

    this._dataService.getReceivedFunds()
        .subscribe(data => {
            this.contributions = data['result'].filter(tx => {
                return tx.from === this.userAddress;
            }).map(tx => {
                const eth = new BigNumber(tx.value).div(1e18).toString();
                this.totalEthContributed = this.totalEthContributed.plus(eth);
                return {
                    date: tx.timeStamp * 1000,
                    hash: tx.hash,
                    value: eth
                };
            });
        },
         err => console.error(err)
    );

    this._dataService.getDistributedTokens(this.userAddress)
        .subscribe(data => {
            this.distributions = data['result'].filter(tx => {
                return this._dataService.tokenDistributorTopics.includes(tx.topics[1]);
            }).map(tx => {
                const tokens = parseInt(tx.data, 16);
                this.totalExrnDistributed = this.totalExrnDistributed + tokens;
                return {
                    date: tx.timeStamp * 1000,
                    hash: tx.transactionHash,
                    value: tokens
                };
            });
        },
        err => console.error(err)
    );
  }
}
