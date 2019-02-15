import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ngCopy } from 'angular-6-clipboard';

import { TestnetService } from '../services/testnet.service';


@Component({
  selector: 'app-testnet',
  templateUrl: './testnet.component.html',
  styleUrls: ['./testnet.component.scss']
})


export class TestnetComponent implements OnInit {

  title = "EXRT Testnet registration";

  isLinear = true;
  formSubmitted: boolean;
  showApiError: boolean;
  passCopied: boolean;

  inpWallet: string;
  inpTelegram: string;
  inpUsername: string;
  inpSalt: string;
  inpPassword: string;
  inpMotivation: string;

  states: any[];


  constructor(@Inject(TestnetService) private _testnetService: TestnetService) {
	this.resetInput();
  }


  ngOnInit() {
  }


  apply() {
	this._testnetService.hashIt(this.inpSalt, this.inpPassword).subscribe((hash: string) => {
		this._testnetService.save(this.inpWallet, this.inpTelegram, this.inpUsername, hash, this.inpMotivation).subscribe(result => {
			this.resetInput();
			this.formSubmitted = true;
		});
	},
		error => {
			this.showApiError = true;
		}
	);
  }


  private resetInput() {
	this.inpWallet = "";
	this.inpTelegram = "";
	this.inpUsername = "";
	this.inpSalt = "";
	this.inpPassword = "";
	this.inpMotivation = "";

	this.formSubmitted = false;
	this.showApiError = false;

	this.randomPassword(16);
  }


  randomPassword(length: number) {
  	this.passCopied = false;
  	this.inpPassword = "";
	let chars = "abcdefghijklmnopqrstuvwxyz!@#ABCDEFGHIJKLMNOP1234567890";

	for (let x = 0; x < length; x++) {
		let i = Math.floor(Math.random() * chars.length);
		this.inpPassword += chars.charAt(i);
	}

  	this.inpSalt = this.randomSalt(8);
  }


  randomSalt(length: number) {
  	let result = "";
	let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";

	for (let x = 0; x < length; x++) {
		let i = Math.floor(Math.random() * chars.length);
		result += chars.charAt(i);
	}

	return result;
  }


  copyPassword() {
  	ngCopy(this.inpPassword);
	this.passCopied = true;
  }


  getHistory() {
	this._testnetService.getApplicationByWallet(this.inpWallet).subscribe(result => {
		this.states = result[0]['states'];
	});
  }


  resetRequest() {
	this._testnetService.resetRequest(this.inpWallet, this.inpTelegram).subscribe(result => {
		this.resetInput();
		this.formSubmitted = true;

		this.states = result['states'];
	},
		error => {
			this.showApiError = true;
		}
	);
  }
}
