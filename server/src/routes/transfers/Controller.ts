import * as express from 'express';
import { Transfer } from '../../models/transfer';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve block number of most recent transfer saved in the database
	this.router.get('/lastBlock', (req, res, next) => {
	Transfer.findOne({}, 'blockNumber', { sort: { 'blockNumber': -1 } })
		.then(block => {
			block = block ? block.blockNumber : 0;
			res.json(block);
		})
		.catch(err => next(err));
	});


	// save new token transfers
	this.router.put('/save', (req, res, next) => {
		if (req.body['result'] === null) {
			res.json("BAD api call");
			return;
		}

		if (req.body['result'].length === 0) {
			res.json("OK transfers empty");
			return;
		}
		
		let bulk = Transfer.collection.initializeOrderedBulkOp();

		req.body['result'].forEach(transfer => {
			let obj = {
				blockNumber: Number(transfer.blockNumber),
				timeStamp: Number(transfer.timeStamp),
				from: transfer.from,
				to: transfer.to,
				value: transfer.value
			};

			bulk.insert(obj);
		});

		bulk.execute(err => {
			if (err) return next(err);
			res.json("OK transfer bulk");
		});
	});


	// delete all token transfers linked to provided block number
	this.router.put('/deleteBlock', (req, res, next) => {
		Transfer.deleteMany({ 'blockNumber': req.body['blockNumber'] })
			.then(result => res.json(result))
			.catch(err => next(err));
	});


	/*
	// retrieve all signups for a given wallet
	this.router.get('/:wallet', (req, res, next) => {
	  Signup.find({ wallet: req.params['wallet'] }, (err, document) => {
	    if (err) return next(err);
	    res.json(document);
	  });
	});



	// retrieve all transfers of given wallet
	this.router.get('/transfers/:wallet', (req, res, next) => {
	  Signup.find({ 'wallet': req.params['wallet'] }, { 'wallet': 1, 'moves': 1 })
		.then(documents => {
			console.log("routes", JSON.stringify("transfers after update", documents));
			res.json(documents);
		})
		.catch(err => next(err));
	});

	*/

	return this.router;
  }
}

export default new Controller();
