let request = require('request');


class Etherscan {
	baseUrl = 'http://localhost:8080';
	apiKey = 'YourApiKeyToken';
	maxTokenTransfersApiLimit = 10000;

	contractAddress = '0xe469c4473af82217b30cf17b10bcdb6c8c796e75';
	EXRNchainTokenSaleAddress = '0x9df04392eef34f213ce55226f40979c906cc04eb';


  	private handleResponse(resolve, reject, error, body) {
		if (error) {
			console.log('error:', error);
			reject(error);
		} else {
			resolve(JSON.parse(body));
		}
	}


  	private getLastSavedTokenTransferBlock(): Promise<number> {
		return new Promise<number>((resolve, reject) => {
				request(this.baseUrl + '/transfers/lastBlock', (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});
	}

	
	private getNewTokenTransfers(startBlock): Promise<any> {
		const urlExrnTransfers = `https://api.etherscan.io/api` +
			    `?module=account` +
			    `&action=tokentx` +
			    `&contractaddress=${ this.contractAddress }` +
			    `&startBlock=${ startBlock }` +
			    `&endBlock=latest` +
			    `&sort=asc` +
			    `&apikey=${ this.apiKey }`;

		return new Promise<any>((resolve, reject) => {
				request(urlExrnTransfers, (error, response, body) => {
					this.handleResponse(resolve, reject, error, body);
				});
			});

	}


	private saveNewTokenTransfers(newTransfers): Promise<any> {
		return new Promise<any>((resolve, reject) => {
				let options = {
					uri: this.baseUrl + '/transfers/save',
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
	removeTokenTransfers(blockNumber): Promise<any> {
		return new Promise<any>((resolve, reject) => {
				let options = {
					uri: this.baseUrl + '/transfers/deleteBlock',
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


	updateTokenTransfers(): Promise<any> {
		return new Promise<number>((resolve, reject) => {
				this.getLastSavedTokenTransferBlock().then(lastBlock => {
					this.getNewTokenTransfers(lastBlock + 1).then(newTransfers => {
						const records = newTransfers['result'].length;

						if (records > 0) {
							console.log("# new token transfers:", records);
							this.saveNewTokenTransfers(newTransfers).then(response => {
								if (records === this.maxTokenTransfersApiLimit) {
									this.getLastSavedTokenTransferBlock().then(partialBlock => {
										this.removeTokenTransfers(partialBlock).then(removed => {
											this.updateTokenTransfers();
										});
									});
								}
							});
						} else {
							resolve(records);
						}
					});
				});
			});
	}
}


export default new Etherscan()
