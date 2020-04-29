let request = require('request');
import { BigNumber } from 'bignumber.js';


class Etherscan {
	baseUrl = process.env.BASE_URL || 'http://localhost:8080';
	apiKeyEtherscan = process.env.ETHERSCAN_API_KEY || 'YBI2DJTZ2DSJZYQERT8YRTGJR6VIU1PPNG';
    apiKeyCoinmarketcap = process.env.COINMARKETCAP_API_KEY || 'cf57589a-0b20-4f8a-8711-ff1d9dbcfb5f';
    
	maxEtherTransfersApiLimit = 10000;
	maxTokenTransfersApiLimit = 10000;

	contractAddressEXRN = '0xe469c4473af82217b30cf17b10bcdb6c8c796e75';
	contractAddressEXRT = '0xb20043F149817bff5322F1b928e89aBFC65A9925';
	EXRNchainTokenSaleAddress = '0x9df04392eef34f213ce55226f40979c906cc04eb';


  	private handleResponse(resolve, reject, error, body) {
		if (error) {
			console.log('error:', error);
			reject(error);
		} else {
			resolve(JSON.parse(body));
		}
	}


	/************************************************************************************************
	 *												*
	 *					PRICE UPDATE		            		*
	 *												*
	 ***********************************************************************************************/
	private getCMCPrice(id, convert): Promise<any> {
		return new Promise<any>((resolve, reject) => {
                let url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
				let options = {
					method: 'GET',
                    uri: url,
                    qs: {
                        'id': id,
                        'convert': convert,
                    },
                    headers: {
                        'X-CMC_PRO_API_KEY': this.apiKeyCoinmarketcap
                    },
                    json: false,
                    gzip: true
				};

				request(options, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}
    
    
    private saveCMCprice(base, price): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let options = {
                uri: this.baseUrl + '/prices/save',
                body: JSON.stringify({
                    'base': base,
                    'price': price
                }),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            request(options, (error, response, body) => {
                this.handleResponse(resolve, reject, error, body);
            });
        });
    }
    
    
    updateCMCprice(base, id, convert): Promise<any> {
        return new Promise<number>((resolve, reject) => {
            this.getCMCPrice(id, convert).then(data => {
                console.log("1 ", base, " = ", data['data'][id]['quote'][convert]['price'], convert);
                this.saveCMCprice(base, data['data'][id]['quote'][convert]['price']).then(response => {
			resolve(0);
		});
            });
	});
    }
    
    
	/************************************************************************************************
	 *												*
	 *					ETHER TRANSFERS UPDATE					*
	 *												*
	 ***********************************************************************************************/
	private getLastSavedEtherTransferBlock(): Promise<number> {
		return new Promise<number>((resolve, reject) => {
				request(this.baseUrl + '/ethers/lastBlock', (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}


	private getNewEtherTransfers(startBlock): Promise<any> {
		const urlEtherTransfers = `https://api.etherscan.io/api` +
			    `?module=account` +
			    `&action=txlist` +
			    `&address=${ this.EXRNchainTokenSaleAddress }` +
			    `&startblock=${ startBlock }` +
			    `&endblock=latest` +
			    `&apikey=${ this.apiKeyEtherscan }`;


		return new Promise<any>((resolve, reject) => {
				request(urlEtherTransfers, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});

	}


	private saveNewEtherTransfers(newTransfers): Promise<any> {
		return new Promise<any>((resolve, reject) => {
				let options = {
					uri: this.baseUrl + '/ethers/save',
					body: JSON.stringify(newTransfers),
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				request(options, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}


	/* Since we can only retrieve this.maxEtherTransfersApiLimit results from Etherscan,
	 * it is possible that the block of the last saved ether transfer still contains unsaved ether transfers
	 * hence we will remove all saved ether transfers of this block and start with this whole block in new batch.
	 */
	removeEtherTransfers(blockNumber): Promise<any> {
		return new Promise<any>((resolve, reject) => {
				let options = {
					uri: this.baseUrl + '/ethers/deleteBlock',
					body: JSON.stringify({ 'blockNumber': blockNumber }),
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				request(options, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}



	updateEtherTransfers(): Promise<any> {
		return new Promise<number>((resolve, reject) => {
				this.getLastSavedEtherTransferBlock().then(lastBlock => {
					this.getNewEtherTransfers(lastBlock + 1).then(newTransfers => {
						const numberOfRecords = newTransfers['result'].length;

						if (numberOfRecords > 0) {
							console.log("# new ether transfers:", numberOfRecords);
							this.saveNewEtherTransfers(newTransfers).then(response => {
								if (numberOfRecords === this.maxEtherTransfersApiLimit) {
									this.getLastSavedEtherTransferBlock().then(partialBlock => {
										this.removeEtherTransfers(partialBlock).then(removed => {
											this.updateEtherTransfers();
											resolve(numberOfRecords);
										});
									});
								} else {
									resolve(numberOfRecords);
								}
							});
						} else {
							resolve(numberOfRecords);
						}
					});
				});
			});
	}


	/************************************************************************************************
	 *												*
	 *					TOKEN TRANSFERS UPDATE					*
	 *												*
	 ***********************************************************************************************/
  	private getLastSavedTokenTransferBlock(token: string): Promise<number> {
		return new Promise<number>((resolve, reject) => {
				request(this.baseUrl + '/transfers/lastBlock/' + token, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}

	
	private getNewTokenTransfers(token: string, startBlock: number): Promise<any> {
		const urlTransfers = `https://api.etherscan.io/api` +
			    `?module=account` +
			    `&action=tokentx` +
			    `&contractaddress=${ token === 'EXRN' ? this.contractAddressEXRN : this.contractAddressEXRT }` +
			    `&startBlock=${ startBlock }` +
			    `&endBlock=latest` +
			    `&sort=asc` +
			    `&apikey=${ this.apiKeyEtherscan }`;

		return new Promise<any>((resolve, reject) => {
				request(urlTransfers, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});

	}


	private saveNewTokenTransfers(token: string, newTransfers): Promise<any> {
		return new Promise<any>((resolve, reject) => {
				let options = {
					uri: this.baseUrl + '/transfers/save/' + token,
					body: JSON.stringify(newTransfers),
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				request(options, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}


	/* Since we can only retrieve this.maxTokenTransfersApiLimit results from Etherscan,
	 * it is possible that the block of the last saved token transfer still contains unsaved token transfers
	 * hence we will remove all saved token transfers of this block and start with this whole block in new batch.
	 */
	removeTokenTransfers(token: string, blockNumber: number): Promise<any> {
		return new Promise<any>((resolve, reject) => {
				let options = {
					uri: this.baseUrl + '/transfers/deleteBlock/' + token,
					body: JSON.stringify({ 'blockNumber': blockNumber }),
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				request(options, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}


	updateTokenTransfers(token: string): Promise<any> {
		return new Promise<number>((resolve, reject) => {
				this.getLastSavedTokenTransferBlock(token).then(lastBlock => {
					this.getNewTokenTransfers(token, lastBlock + 1).then(newTransfers => {
						const numberOfRecords = newTransfers['result'].length;

						if (numberOfRecords > 0) {
							console.log("# new " + token + " transfers:", numberOfRecords);
							this.saveNewTokenTransfers(token, newTransfers).then(response => {
								this.updateBalances(newTransfers, token).then(update => {
									if (numberOfRecords === this.maxTokenTransfersApiLimit) {
										this.getLastSavedTokenTransferBlock(token).then(partialBlock => {
											this.removeTokenTransfers(token, partialBlock).then(removed => {
												this.updateTokenTransfers(token);
												resolve(numberOfRecords);
											});
										});
									} else {
										resolve(numberOfRecords);
									}
								});
							});
						} else {
							resolve(numberOfRecords);
						}
					});
				});
			});
	}


	private updateBalances(newTransfers: any[], token: string): Promise<any> {
		let decimals = (token === 'EXRN' ? 0 : (token === 'EXRT' ? 8 : 18));

		newTransfers = newTransfers['result'].map(tx => {
			return {
				from: tx.from,
				to: tx.to,
				value: new BigNumber(tx.value).div(Math.pow(10, decimals)).toNumber()
			};
		});

		let totalByWallet = this.groupTokenTransfersByWallet(newTransfers);

		return new Promise<any>((resolve, reject) => {
				let options = {
					uri: this.baseUrl + '/balances/update/' + token,
					body: JSON.stringify({ result: totalByWallet }),
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				request(options, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}


	private groupTokenTransfersByWallet(xs) {
		return xs.reduce((rv, x) => {
			let from = x['from'];
			let idxFrom = rv.findIndex(r => r && r.wallet === from);
			if (idxFrom >= 0) {
				rv[idxFrom]['value'] -= x.value;
			} else {
				rv.push({ wallet: from, value: -x.value });
			}

			let to = x['to'];
			let idxTo = rv.findIndex(r => r && r.wallet === to);
			if (idxTo >= 0) {
				rv[idxTo]['value'] += x.value;
			} else {
				rv.push({ wallet: to, value: x.value });
			}

			return rv;
		}, []);
	}
}


export default new Etherscan()
