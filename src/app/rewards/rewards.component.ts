import { Component, Inject, OnInit } from '@angular/core';

import { DataService } from "../services/data.service";
import { StateService } from "../services/state.service";


@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.scss']
})
export class RewardsComponent implements OnInit {

    userAddress = '';
    exrtRewards = [];
  
  
    constructor(@Inject(DataService) private _dataService: DataService,
                @Inject(StateService) private _stateService: StateService) {
    }

    ngOnInit() {
        this._stateService.userWallet.subscribe(wallet => this.userAddress = wallet);
      
        this._dataService.getAllRounds().subscribe((rounds: any[]) => {
            this._dataService.getExrtRewards(this.userAddress).subscribe((rewards: any[]) => {
                rounds.slice().reverse().forEach(round => {
                    this.exrtRewards.push(rewards.find(reward => +new Date(reward.timeStamp) > round.end));
                });
                
                console.log(this.exrtRewards);
            });
        });
    }

}
