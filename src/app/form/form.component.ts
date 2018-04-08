import { Component, OnInit } from '@angular/core';

import { DataService } from '../data.service';

import { BigNumber } from 'bignumber.js';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {

  userAddress: string;
  userTotalTokens: number;
  contributions: any;
  totalEthContributed: BigNumber;
  distributions: any;
  totalExrnDistributed: number;

  constructor(private _dataService: DataService) { }

  ngOnInit() {
    this.resetState();
  }

  private resetState() {
    this.userTotalTokens = 0;
    this.totalEthContributed = new BigNumber(0);
    this.totalExrnDistributed = 0;
  }

  checkWallet() {
    this.resetState();

    // TODO: sanity check on wallet

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
