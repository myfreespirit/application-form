import * as express from 'express';
import { Distribution } from '../../models/distribution';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	/* retrieve block number of most recently saved distribution for a given wallet */
	this.router.get('/lastblock/:wallet', (req, res, next) => {
	  const wallet = req.params['wallet'];
	  Distribution.find({ 'wallet': wallet }, { 'distributions': {'$slice': -1} })
		.then(document => {
			const block = document[0] === undefined ? 0 : document[0]['distributions'][0]['blockNumber'];
			res.json(block);
		})
		.catch(err => next(err));
	});


	/* save distributions to a given wallet */
	this.router.put('/save/:wallet', (req, res, next) => {
	  const obj = req.body;
	  if (obj.length === 0) {
	    res.json("OK distr empty");
	    return;
	  }

	  Distribution.findOneAndUpdate({ wallet: req.params['wallet'] },
					{ $push: { distributions: obj } },
					{ upsert: true, new: true },
					(err, document) => {
		    if (err) return next(err);
		    res.json('OK distr');  // TODO
	  });
	});


	/* get all saved distributions */
	this.router.get('/:wallet', (req, res, next) => {
	  Distribution.find({ 'wallet': req.params['wallet'] })
		.then(documents => {
			const result = documents[0] === undefined ? documents : documents[0]['distributions'];
			res.json(result)
		})
		.catch(err => next(err));
	});


	return this.router;
  }
}


export default new Controller();
