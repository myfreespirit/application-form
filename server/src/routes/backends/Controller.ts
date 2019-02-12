import * as express from 'express';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve AUTH0 variables from Heroku's backend 
	this.router.get('/auth0', (req, res, next) => {
		// the exposed values are used for development purposes on localhost
		let result = {
			clientID: process.env.AUTH0_CLIENT_ID || 'fyTIVe5MunpoamUevDhYsANVJDLz5Bw3',
			domain: process.env.AUTH0_DOMAIN || 'delicate-silence-4570.eu.auth0.com',
			redirectUri: process.env.AUTH0_CALLBACK_URL || 'http://localhost:4200/admin',
			audience: process.env.AUTH0_AUDIENCE || 'https://testeddefault.herokuapp.com/api'
		};
		res.json(result);
	});


	return this.router;
  }
}

export default new Controller();
