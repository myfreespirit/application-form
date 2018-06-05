import * as express from 'express';
import { Contribution } from '../../models/contribution';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve block number of most recently saved contribution of any wallet
	this.router.get('/lastblock', (req, res, next) => {
	  Contribution.find()
		      .sort({ _id: -1 })
		      .limit(1)
		      .then(document => {
			  const block = document[0] === undefined ? 0 : document[0]['blockNumber'];
			  res.json(block);
		      })
		      .catch(err => next(err));
	});


	/* save contributions to a given wallet */
	this.router.put('/save/:wallet', (req, res, next) => {
		if (req.body.length === 0) {
			res.json("OK contr empty");
			return;
		}

		let bulk = Contribution.collection.initializeOrderedBulkOp();

		req.body.forEach(contr => {
			bulk.find(contr).upsert().updateOne(contr);
		});

		bulk.execute(err => {
			if (err) return next(err);
			res.json("OK contr bulk");
		});
	});


	/* retrieve all contributions of provided wallet */
	this.router.get('/:wallet', (req, res, next) => {
	  Contribution.find({ 'from': req.params['wallet'] })
		.then(documents => res.json(documents))
		.catch(err => next(err));
	});


	/* retrieve all refunds to provided wallet */
	this.router.get('/refunds/:from/:to', (req, res, next) => {
	  Contribution.find({ 'from': req.params['from'], 'to': req.params['to'] })
		.then(documents => res.json(documents))
		.catch(err => next(err));
	});


	return this.router;
  }
}


export default new Controller();
