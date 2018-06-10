let request = require('request');


class Etherscan {
	baseUrl = process.env.BASE_URL || 'http://localhost:8080';
	apiKey = 'YourApiKeyToken';
	maxEtherTransfersApiLimit = 10000;
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
			    `&apikey=YourApiKeyToken`;

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
						const numberOfRecords = newTransfers['result'].length;

						if (numberOfRecords > 0) {
							console.log("# new token transfers:", numberOfRecords);
							this.saveNewTokenTransfers(newTransfers).then(response => {
								if (numberOfRecords === this.maxTokenTransfersApiLimit) {
									this.getLastSavedTokenTransferBlock().then(partialBlock => {
										this.removeTokenTransfers(partialBlock).then(removed => {
											this.updateTokenTransfers();
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
}


export default new Etherscan()
