import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { keccak256 } from 'js-sha3';


@Injectable()
export class DataService {
  contractAddress = '0xe469c4473af82217b30cf17b10bcdb6c8c796e75';
  EXRNchainTokenSaleAddress = '0x9df04392eef34f213ce55226f40979c906cc04eb';
  eventTransferTopic = 'Transfer(address,address,uint256)';
  tokenDistributorTopics: string[] = [
    '0x88178587ed0fa9c2a8fa73786a4cf2589e20a2cd',
    '0x7ab1b286309720de8e6de26aa4712372cac5d4c3'
  ];

  constructor(private http: HttpClient) {
    // prepare the Topics in correct format
    this.eventTransferTopic = '0x' + keccak256(this.eventTransferTopic);

    this.tokenDistributorTopics = this.tokenDistributorTopics.map(x => {
        return '0x' + x.substring(2).padStart(64, '0');
    });
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

  getReceivedFunds() {
    // TODO take into account that results are returned in groups of max 10k transactions
    const url = `https://api.etherscan.io/api` +
                    `?module=account` +
                    `&action=txlist` +
                    `&address=${ this.EXRNchainTokenSaleAddress }` +
                    `&startblock=0` +
                    `&endblock=latest` +
                    `&apikey=YourApiKeyToken`;

    return this.http.get(url);
  }

  getDistributedTokens(wallet) {
     // TODO take into account that results are returned in groups of max 10k transactions
     const url = `https://api.etherscan.io/api` +
                    `?module=logs` +
                    `&action=getLogs` +
                    `&fromBlock=0` +
                    `&toBlock=latest` +
                    `&address=${ this.contractAddress }` +
                    `&topic0=${ this.eventTransferTopic }` +
                    `&topic0_2_opr=and` +
                    `&topic2=${ '0x' + wallet.substring(2).padStart(64, '0') }` +
                    `&apikey=YourApiKeyToken`;

    return this.http.get(url);
  }
}
