import { Component, Inject, OnInit } from '@angular/core';

import { StateService } from "../services/state.service";


@Component({
  selector: 'app-signups-history',
  templateUrl: './signups-history.component.html',
  styleUrls: ['./signups-history.component.scss']
})
export class SignupsHistoryComponent implements OnInit {

  userAddress = '';
  signups = [];
  
  
  constructor(@Inject(StateService) private _stateService: StateService) { }

  ngOnInit() {
      this._stateService.userWallet.subscribe(wallet => this.userAddress = wallet);
      this._stateService.signups.subscribe(signups => this.signups = signups);
  }

}
