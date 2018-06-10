import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map, mergeMap } from "rxjs/operators";

import { keccak256 } from 'js-sha3';


@Injectable()
export class DataService {
  contractAddress = '0xe469c4473af82217b30cf17b10bcdb6c8c796e75';
  EXRNchainTokenSaleAddress = '0x9df04392eef34f213ce55226f40979c906cc04eb';
  eventTransferTopic = 'Transfer(address,address,uint256)';
  tokenDistributorAddresses: string[] = [
    '0x88178587ed0fa9c2a8fa73786a4cf2589e20a2cd',
    '0x7ab1b286309720de8e6de26aa4712372cac5d4c3'
  ];
  tokenDistributorTopics: string[];
  airdropAmount = Math.pow(10, 7);
  distributionRates = [
    { block: 5721051, value: this.airdropAmount / 8 },
    { block: 5539570, value: this.airdropAmount / 4 },
    { block: 4866696, value: this.airdropAmount / 2 },
    { block: 0, value: this.airdropAmount }
  ];
  bonusExrnDistribution = [
    { minEXRN: Math.pow(10, 9), bonus: Math.pow(10, 8) },
    { minEXRN: 0, bonus: 0}
  ];

  // API limits
  maxTokenTransfersApiLimit = 10000;


  constructor(@Inject(HttpClient) private http: HttpClient) {
    // prepare the variables in correct format
    this.eventTransferTopic = '0x' + keccak256(this.eventTransferTopic);

    this.tokenDistributorTopics = this.tokenDistributorAddresses.map(x => {
        return '0x' + x.substring(2).padStart(64, '0');
    });
  }


  applicableBonus(owedEXRN: number) {
    const match = this.bonusExrnDistribution.find(entry => {
        return owedEXRN >= entry.minEXRN;
    });

    return match.bonus;
  }


  findDistributionRate(currentBlock: number) {
    const match = this.distributionRates.find(function(rate) {
      return currentBlock >= rate.block;
    });

    return match.value;
  }


  getTotalTokens(wallet) {
    const url = `https://api.etherscan.io/api` +
                    `?module=account` +
                    `&action=tokenbalance` +
                    `&contractaddress=${ this.contractAddress }` +
                    `&address=${ wallet }` +
                    `&tag=latest` +
                    `&apikey=YourApiKeyToken`;

    return this.http.get(url);
  }


  getTransactions(wallet) {
	// get all contributions and distributions from the database
	return forkJoin([
		this.http.get('/ethers/' + this.EXRNchainTokenSaleAddress + '/' + wallet),  // contributions
		this.http.get('/ethers/' + wallet + '/' + this.EXRNchainTokenSaleAddress),  // refunds
		this.http.get('/transfers/distributions/' + wallet + '/' + this.tokenDistributorAddresses)
	]);
  }


  getSignups(wallet) {
    return this.http.get('/signups/' + wallet);
  }


  setSignups(wallet, total, team) {
    const req = {};
    req['wallet'] = wallet;
    req['totalEXRN'] = total;
    req['teamEXRN'] = team;

    return this.http.put('/signups/save/' + wallet + '/' + total + '/' + team, req);
  }


  getLastSignups() {
	return this.http.get('/signups/all');
  }
}
