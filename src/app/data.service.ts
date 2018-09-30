import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map, mergeMap } from "rxjs/operators";

import { keccak256 } from 'js-sha3';
import { BigNumber } from 'bignumber.js';


@Injectable()
export class DataService {
  apiKey = 'YBI2DJTZ2DSJZYQERT8YRTGJR6VIU1PPNG';
  contractAddress = '0xe469c4473af82217b30cf17b10bcdb6c8c796e75';
  EXRNchainTokenSaleAddress = '0x9df04392eef34f213ce55226f40979c906cc04eb';
  eventTransferTopic = 'Transfer(address,address,uint256)';
  tokenDistributorAddresses: string[] = [
    '0x88178587ed0fa9c2a8fa73786a4cf2589e20a2cd',
    '0x7ab1b286309720de8e6de26aa4712372cac5d4c3'
  ];
  tokenDistributorTopics: string[];

  waitingPeriodThreshold = 30.0;
  minimumExrnRequired = Math.pow(10, 7);
  airdropAmount = Math.pow(10, 7);
  distributionRates = [
    { block: 6392320, value: this.airdropAmount / 4 },  // Discounted price week of 24th of September 2018
    { block: 5721051, value: this.airdropAmount / 8 },
    { block: 5539570, value: this.airdropAmount / 4 },
    { block: 4866696, value: this.airdropAmount / 2 },
    { block: 0, value: this.airdropAmount }
  ];
  /*
  bonusExrnDistribution = [
    { minETH: 30, bonus: 0.1 },
    { minETH: 0, bonus: 0.0 }
  ];
  */


  // API limits
  maxTokenTransfersApiLimit = 10000;


  constructor(@Inject(HttpClient) private http: HttpClient) {
    // prepare the variables in correct format
    this.eventTransferTopic = '0x' + keccak256(this.eventTransferTopic);

    this.tokenDistributorTopics = this.tokenDistributorAddresses.map(x => {
        return '0x' + x.substring(2).padStart(64, '0');
    });
  }


  applicableBonus(spentETH) {
  	return 1.0;
  /*
    const match = this.bonusExrnDistribution.find(entry => {
	    return spentETH >= entry.minETH;
    });

    return 1.0 + match.bonus;
  */
  }


  findDistributionRate(currentBlock: number) {
    const match = this.distributionRates.find(rate => {
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
		    `&apikey=${ this.apiKey }`;

    return this.http.get(url);
  }


  getTransactionsByWallet(wallet) {
	// get all contributions and distributions from the database for a given wallet
	return forkJoin([
		this.http.get('/ethers/' + this.EXRNchainTokenSaleAddress + '/' + wallet),  // contributions
		this.http.get('/ethers/' + wallet + '/' + this.EXRNchainTokenSaleAddress),  // refunds
		this.http.get('/transfers/distributions/' + wallet + '/' + this.tokenDistributorAddresses)
	]);
  }

  
  getTransactions() {
	// get all contributions and distributions from the database
	return forkJoin([
		this.http.get('/ethers/'),
		this.http.get('/transfers/distributions/')
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


  getCurrentEtherBlock() {
    const url = `https://api.etherscan.io/api` +
		`?module=proxy` +
		`&action=eth_blockNumber` +
	        `&apikey=${ this.apiKey }`;

    return this.http.get(url);
  }


  isValidWallet(wallet) {
  	return wallet.toString().match(/^0x[0-9a-fA-F]{40}$/g) !== null;
  }


  transformContributions(contributions) {
	let totalEthContributed = new BigNumber(0);
  	contributions = contributions.map(tx => {
                const eth = new BigNumber(tx.value).div(1e18).toString();
                totalEthContributed = totalEthContributed.plus(eth);
                return {
                    date: tx.timeStamp * 1000,
                    block: tx.blockNumber,
                    hash: tx.hash,
                    value: eth
                };
	});

	return [contributions, totalEthContributed];
  }


  transformRefunds(refunds, totalEthContributed) {
    refunds = refunds.map(tx => {
                const eth = new BigNumber(tx.value).div(1e18).toString();
                totalEthContributed = totalEthContributed.minus(eth);
                return {
                    date: tx.timeStamp * 1000,
                    block: tx.blockNumber,
                    hash: tx.hash,
                    value: eth
                };
            });
    
    return [refunds, totalEthContributed];
  }


  transformDistributions(distributions) {
    distributions = distributions.map(tx => {
                const tokens = tx.value;
                return {
                    date: tx.timeStamp * 1000,
                    from: tx.from,
                    block: tx.blockNumber,
                    hash: tx.hash,
                    value: tokens
                };
	});

    return distributions;
  }


  // TODO needs improvement in case more than one contribution is refunded in one transaction
  private correlateRefunds(refunds, contributions) {
    let correlations = [];

    refunds.forEach(refund => {
	const contribution = contributions.filter(contr => {
		return contr.value === refund.value && contr.block < refund.block;
	}).pop();

	if (contribution) {
		correlations.push([[contribution], [refund]]);
		const index = contributions.indexOf(contribution);
		if (index !== -1) {
			contributions.splice(index, 1);
		} else {
			console.error("ERROR: wrong index when removing refund from contributions.")
		}
	}
    });

    return [correlations, contributions];
  }


  private findCombination(given, owed, active, candidates) {
    // TODO: determine plausible margin for rounding errors
    const margin = 0.05;

    if (Math.abs(given - owed) / owed <= margin) {
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


  correlateTransactions(refunds, contributions, distributions, userTotalTokens) {
    let correlations = [];

    let transformedContr = this.transformContributions(contributions);
    contributions = transformedContr[0];
    let totalEthContributed = transformedContr[1];

    let transformedRefunds = this.transformRefunds(refunds, totalEthContributed);
    refunds = transformedRefunds[0];
    totalEthContributed = transformedRefunds[1];

    distributions = this.transformDistributions(distributions);


    let correlatedRefunds = this.correlateRefunds(refunds, contributions);
    refunds = correlatedRefunds[0];
    contributions = correlatedRefunds[1];

    let contrCandidates = [];

    while (contributions.length) {
        const contr = contributions.shift();
        contrCandidates.push(contr);

        // retrieve the total owed amount of EXRN so far for current contribution candidates
        let owed = contrCandidates.reduce((total, ctr) => {
            const rate = this.findDistributionRate(ctr.block);
            return total + ctr.value * rate;
        }, 0);
	/*
        let spent = contrCandidates.reduce((total, ctr) => {
            return total.plus(ctr.value);
        }, new BigNumber(0));
	// retrieve applicableBonus based on ETH contributed
	owed *= this.applicableBonus(spent);
	*/

        // Retrieve a list of possible distribution candidates for current contribution candidates
        const nextContrBlock = contributions.length === 0 ? Number.MAX_VALUE : contributions[0].block;
        const distrCandidates = distributions.filter(distr => {
            return distr.block < nextContrBlock;  // Relaxed filter mode to allow for recuperation of the glitch (advance payment)
            // return distr.block >= contrCandidates[0].block && distr.block < nextContrBlock;  // Strict filter mode
        });

        // Find a correlating match from combinations of distribution candidates for current contribution candidates
        const combination = this.findCombination(0, owed, [], distrCandidates);

        if (combination.length) {
            correlations.push([contrCandidates, combination]);
            contrCandidates = [];

            // remove the correlated combination from distributions to ease up the complexity of next iteration
            combination.forEach(combo => {
                const index = distributions.findIndex(distr => {
                    return distr.block === combo.block &&
                            distr.hash === combo.hash &&
                            distr.value === combo.value;
                });
                distributions.splice(index, 1);
            });
        }
    }

    let totalExrnDistributed = 0;

    // rest of contributions are still in the AWAITING state
    if (contrCandidates.length) {
		contrCandidates.forEach(contr => {
		const waitingPeriodMilliseconds = Date.now() - contr.date;
		const waitingPeriodDays = waitingPeriodMilliseconds / (24 * 60 * 60 * 1000);
		if (waitingPeriodDays < this.waitingPeriodThreshold) {
			let distr = {
				'block': 'AWAITING',
				'value': Math.floor(this.findDistributionRate(contr.block) * contr.value)
			};

			correlations.push([[contr], [distr]]);
			userTotalTokens += distr.value;
		} else {
			let distr = {
				'block': 'N/A',
				'value': 0
			};

			correlations.push([[contr], [distr]]);
		}
	});
    }

    // Recalculate amount of EXRN purchased based on correlated data
    totalExrnDistributed += correlations.reduce((total, corr) => {
        return total +
            corr[1].reduce((totalCorr, distr) => {
                return totalCorr + distr.value;
        }, 0);
    }, 0);

    return [refunds, contributions, distributions, correlations, userTotalTokens, totalEthContributed, totalExrnDistributed];
  }


  reportMistake(user, wallet, total, team, comment) {
	const url = 'https://api.telegram.org/' + 
  			'bot637948427:AAEbfbx6VzhX9_Gl_CHQMxZ-EKRmtE9dOnk/' +
			'sendMessage?' +
			'chat_id=@EXRTAppTroubleshooting&' +
			'text=';
	
	const msg = encodeURI(
			'REPORT submitted by @' + user + '\n' +
			'REPORT handled by: \n' +
			'STATUS: \n' +
			'----------------------------------INFO----------------------------------\n' +
			wallet + '\n' +
			'Total EXRN: ' + total.toLocaleString() + '\n' +
			'Team EXRN: ' + team.toLocaleString() + '\n' +
			'------------------------------COMMENT------------------------------\n' +
			comment
		);

	return this.http.get(url + msg);
  }


  getAllRounds() {
	  return this.http.get('/rounds/');
  }
}
