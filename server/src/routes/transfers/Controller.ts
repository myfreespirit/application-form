import * as express from 'express';
const { TransferEXRN, TransferEXRT } = require('../../models/transfer');


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve block number of most recent transfer saved in the database
	this.router.get('/lastBlock/:token', (req, res, next) => {
		if (req.params['token'] === 'EXRN') {
			TransferEXRN.findOne({}, 'blockNumber', { sort: { 'blockNumber': -1 } })
				.then(block => {
					block = block ? block.blockNumber : 0;
					res.json(block);
				})
				.catch(err => next(err));
		} else if (req.params['token'] === 'EXRT') {
			TransferEXRT.findOne({}, 'blockNumber', { sort: { 'blockNumber': -1 } })
				.then(block => {
					block = block ? block.blockNumber : 0;
					res.json(block);
				})
				.catch(err => next(err));
		}
	});


	// save new token transfers
	this.router.put('/save/:token', (req, res, next) => {
		if (req.body['result'] === null) {
			res.json("BAD api call");
			return;
		}

		if (req.body['result'].length === 0) {
			res.json("OK transfers empty");
			return;
		}
		
		let bulk = null;
		if (req.params['token'] === 'EXRN') {
			bulk = TransferEXRN.collection.initializeOrderedBulkOp();
		} else if (req.params['token'] === 'EXRT') {
			bulk = TransferEXRT.collection.initializeOrderedBulkOp();
		}

		req.body['result'].forEach(transfer => {
			let obj = {
				hash: transfer.hash,
				blockNumber: Number(transfer.blockNumber),
				timeStamp: Number(transfer.timeStamp),
				from: transfer.from,
				to: transfer.to,
				value: Number(transfer.value)
			};

			bulk.insert(obj);
		});

		bulk.execute(err => {
			if (err) return next(err);
			res.json("OK transfer bulk");
		});
	});


	// delete all token transfers linked to provided block number
	this.router.put('/deleteBlock/:token', (req, res, next) => {
		if (req.params['token'] === 'EXRN') {
			TransferEXRN.deleteMany({ 'blockNumber': req.body['blockNumber'] })
				.then(result => res.json(result))
				.catch(err => next(err));
		} else if (req.params['token'] === 'EXRT') {
			TransferEXRT.deleteMany({ 'blockNumber': req.body['blockNumber'] })
				.then(result => res.json(result))
				.catch(err => next(err));
		}
	});


	// retrieve all transfers
	this.router.get('/distributions/', (req, res, next) => {
		TransferEXRN.find({})
			.then(result => res.json(result))
			.catch(err => next(err));
	});


	// retrieve all distributions made to provided wallet
	this.router.get('/distributions/:to/:from', (req, res, next) => {
		TransferEXRN.find({ 'to': req.params['to'], 'from': { $in: req.params['from'].split(',') } })
			.then(result => res.json(result))
			.catch(err => next(err));
	});


	return this.router;
  }
}

export default new Controller();
