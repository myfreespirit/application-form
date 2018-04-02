import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {
  
  userAddress: string;
  userTotalTokens: number;
  userContributedTokens: number;


  constructor(private _dataService: DataService) { }

  ngOnInit() {
  }

  checkWallet() {
    // TODO: sanity check on wallet

    this._dataService.getTotalTokens(this.userAddress).subscribe(
      data => { this.userTotalTokens = data['result']; console.log(data) },
      err => console.error(err),
      () => console.log('done requesting Total Tokens')
    );
  }
}
