import * as express from 'express';
import { Ether } from '../../models/ether';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve block number of most recent ether tx saved in the database
	this.router.get('/lastBlock', (req, res, next) => {
	Ether.findOne({}, 'blockNumber', { sort: { 'blockNumber': -1 } })
		.then(block => {
			block = block ? block.blockNumber : 0;
			res.json(block);
		})
		.catch(err => next(err));
	});


	// save new ether transfers
	this.router.put('/save', (req, res, next) => {
		if (req.body['result'] === null) {
			res.json("BAD api call");
			return;
		}

		if (req.body['result'].length === 0) {
			res.json("OK no new ether transactions");
			return;
		}
		
		let bulk = Ether.collection.initializeOrderedBulkOp();

		req.body['result'].forEach(tx => {
			let obj = {
				hash: tx.hash,
				blockNumber: Number(tx.blockNumber),
				timeStamp: Number(tx.timeStamp),
				from: tx.from,
				to: tx.to,
				value: Number(tx.value)
			};

			bulk.insert(obj);
		});

		bulk.execute(err => {
			if (err) return next(err);
			res.json("OK ether bulk");
		});
	});


	// delete all ether transfers linked to provided block number
	this.router.put('/deleteBlock', (req, res, next) => {
		Ether.deleteMany({ 'blockNumber': req.body['blockNumber'] })
			.then(result => res.json(result))
			.catch(err => next(err));
	});


	// retrieve all ETH transfers made between provided wallets
	this.router.get('/:to/:from', (req, res, next) => {
		Ether.find({ 'to': req.params['to'], 'from': req.params['from'] })
			.then(result => res.json(result))
			.catch(err => next(err));
	});


	return this.router;
  }
}

export default new Controller();
