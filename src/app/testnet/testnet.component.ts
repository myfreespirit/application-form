import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DataService } from '../data.service';


@Component({
  selector: 'app-testnet',
  templateUrl: './testnet.component.html',
  styleUrls: ['./testnet.component.scss']
})


export class TestnetComponent implements OnInit {

  title = "EXRT Testnet registration";
  userSalt: string;
  userPass: string;
  hash: any;

  isLinear = false;
  formGroup1: FormGroup;
  formGroup2: FormGroup;
  formGroup3: FormGroup;
  formGroup4: FormGroup;
  formGroup5: FormGroup;


  constructor(@Inject(DataService) private _dataService: DataService, @Inject(FormBuilder) private _formBuilder: FormBuilder) {
  }


  ngOnInit() {
	this.formGroup1 = this._formBuilder.group({
		formControl1: ['', Validators.required]
	});

	this.formGroup2 = this._formBuilder.group({
		formControl2: ['', Validators.required]
	});

	this.formGroup3 = this._formBuilder.group({
		formControl3: ['', Validators.required]
	});

	this.formGroup4 = this._formBuilder.group({
		formControl4: ['', Validators.required]
	});

	this.formGroup5 = this._formBuilder.group({
		formControl5: ''
	});
  }


  hashIt() {
	this._dataService.hashIt(this.userSalt, this.userPass).subscribe(result => {
		this.hash = result;
	});
  }


  apply() {
	console.log(this.formGroup1.valid, this.formGroup1.value['formControl1']);
	console.log(this.formGroup2.valid, this.formGroup2.value['formControl2']);
	console.log(this.formGroup3.valid, this.formGroup3.value['formControl3']);
	console.log(this.formGroup4.valid, this.formGroup4.value['formControl4']);
	console.log(this.formGroup5.valid, this.formGroup5.value['formControl5']);
  }
}
