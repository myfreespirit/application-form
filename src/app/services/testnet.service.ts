import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from "rxjs/operators";


@Injectable()
export class TestnetService {

	constructor(@Inject(HttpClient) private http: HttpClient) { }


	getApplicationByWallet(wallet: string) {
		return this.http.get('/testnet/wallet/' + wallet.toLowerCase());
	}


	isUsernameTaken(username: string) {
		return this.http.get('/testnet/username/' + username);
	}


	save(wallet: string, telegram: string, username: string, hash: string, motivation: string) {
		const req = {};
		req['wallet'] = wallet;
		req['telegram'] = telegram;
		req['username'] = username;
		req['hash'] = hash;
		req['motivation'] = motivation;

		return this.http.put('/testnet/save/', req);
	}


	hashIt(salt, pass) {
		const req = {};
		req['salt'] = salt;
		req['pass'] = pass;

		return this.http.post('/testnet/hash/', req);
	}


	getHistory(wallet: string) {
		return this.http.get('/testnet/history/' + wallet);
	}


	resetRequest(wallet: string, telegram: string) {
		const req = {};
		req['wallet'] = wallet;
		req['telegram'] = telegram;

		return this.http.put('/testnet/reset/request', req);
	}
}
