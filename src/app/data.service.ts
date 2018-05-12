import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

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
  airdropAmount = Math.pow(10, 7);
  distributionRates = [
    { block: 4866696, value: this.airdropAmount / 2 },
    { block: 0, value: this.airdropAmount }
  ];
  bonusExrnDistribution = [
    { minEXRN: Math.pow(10, 9), bonus: Math.pow(10, 8) },
    { minEXRN: 0, bonus: 0}
  ];


  constructor(private http: HttpClient) {
    // prepare the variables in correct format
    this.eventTransferTopic = '0x' + keccak256(this.eventTransferTopic);

    this.tokenDistributorTopics = this.tokenDistributorTopics.map(x => {
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


  getDistributedTokens(wallet) {
    return Observable.forkJoin([
	this.http.get('/contributions/lastblock'),
	this.http.get('/distributions/lastblock/' + wallet)
    ])
    .mergeMap((blocks: any[]) => {
	const lastKnownContributionBlock = blocks[0];
	const lastKnownDistributionBlock = blocks[1];

	// Retrieves transactions from ALL users that sent ETH to the team
	const urlAllETH = `https://api.etherscan.io/api` +
		    `?module=account` +
		    `&action=txlist` +
		    `&address=${ this.EXRNchainTokenSaleAddress }` +
		    `&startblock=` + (lastKnownContributionBlock + 1) +
		    `&endblock=latest` +
		    `&apikey=YourApiKeyToken`;
	// TODO take into account that results are returned in groups of max 10k transactions (current cap ~1k)
	// NOTE this can handle more relaxed constraints since we're only retrieving most recent contributions
	//      starting from the last one that was saved in the database.

	// Retrieves transactions where team distributed EXRN to the user's wallet (including airdrop)
	const urlWalletEXRN = `https://api.etherscan.io/api` +
		    `?module=logs` +
		    `&action=getLogs` +
		    `&fromBlock=` + (lastKnownDistributionBlock + 1) +
		    `&toBlock=latest` +
		    `&address=${ this.contractAddress }` +
		    `&topic0=${ this.eventTransferTopic }` +
		    `&topic0_2_opr=and` +
		    `&topic2=${ '0x' + wallet.substring(2).padStart(64, '0') }` +
		    `&apikey=YourApiKeyToken`;
	// TODO take into account that results are returned in groups of max 1k transactions
	// NOTE this can handle more relaxed constraints as we are saving previously retrieved
	//      distributions in the database and hence can utilize the `fromBlock` tag in API request

	// Run multiple concurrent HTTP requests. The entire operation errors if any request fails.
	return Observable.forkJoin(
		this.http.get(urlAllETH),
		this.http.get(urlWalletEXRN)
	)
	.map(results => {
		// keep only necessary key-value pairs of recent contributions and rename them consistently
		const recentContributions = results[0]['result'].filter(contr => {
			return contr['isError'] === '0';
		})
		.map(contr => {
			return {
				hash: contr['hash'],
				blockNumber: parseInt(contr['blockNumber'], 10),
				from: contr['from'],
				to: contr['to'],
				date: contr['timeStamp'],
				value: contr['value']
			};
		});

		// keep only necessary key-value pairs of recent distributions and rename them consistently
		const recentDistributions = results[1]['result'].filter(distr => {
			return this.tokenDistributorTopics.includes(distr['topics'][1]);
		})
		.map(distr => {
			return {
				hash: distr['transactionHash'],
				blockNumber: parseInt(distr['blockNumber'], 16),
				from: '0x' + distr['topics'][1].substring(26),
				date: distr['timeStamp'],
				value: distr['data']
			};
		});

		return [recentContributions, recentDistributions];
	})
	.mergeMap(results => {
		// save new contributions and distributions to the database
		return Observable.forkJoin([
			this.http.put('/contributions/save/' + wallet, results[0]),
			this.http.put('/distributions/save/' + wallet, results[1])
		])
		.mergeMap(empty => {
			// get all contributions and distributions from the database
			return Observable.forkJoin([
				this.http.get('/contributions/' + wallet),
				this.http.get('/contributions/refunds/' + this.EXRNchainTokenSaleAddress + '/' + wallet),
				this.http.get('/distributions/' + wallet)
			]);

		});
	});
    });
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
}
