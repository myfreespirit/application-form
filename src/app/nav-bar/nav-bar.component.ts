import { Component, Inject, OnInit } from '@angular/core';

import { StateService } from "../services/state.service";


@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {

    userAddress = '';
    
    constructor(@Inject(StateService) private _stateService: StateService) { }

    ngOnInit() {
        this._stateService.userWallet.subscribe(wallet => this.userAddress = wallet);
    }
}
