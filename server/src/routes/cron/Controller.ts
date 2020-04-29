import * as express from 'express';
import etherscanService from '../../services/etherscan';


class Controller {

  private router: any;

  static data_id = {
      // "USD": 2781,
      "ETH": 1027,
      "BTC": 1,
      "LTC": 2,
      "EXRN": 2088
  }

  constructor() {
    this.router = express.Router();
  }


  public routes() {
      
	this.router.get('/update/ether', (req, res, next) => {
		etherscanService.updateEtherTransfers()
			.then(data => res.sendStatus(200))
			.catch(err => next(err));
	});


	this.router.get('/update/exrn', (req, res, next) => {
		etherscanService.updateTokenTransfers("EXRN")
			.then(data => res.sendStatus(200))
			.catch(err => next(err));
	});


	this.router.get('/update/exrt', (req, res, next) => {
		etherscanService.updateTokenTransfers("EXRT")
			.then(data => res.sendStatus(200))
			.catch(err => next(err));
	});


	this.router.get('/update/price', (req, res, next) => {
		let convert = "USD";
		Object.entries(Controller.data_id).forEach(([base, id]) => {
			etherscanService.updateCMCprice(base, id, convert)
				.then(data => { if (base == "EXRN") { res.sendStatus(200); }})
				.catch(err => next(err)); 
		});
	});


	return this.router;
  }
}

export default new Controller();
