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
                rewards = rewards.map(r => {
                        return {
                            'from': r.from,
                            'timeStamp': r.timeStamp * 1000,
                            'value': r.value / Math.pow(10, 8)
                        }
                });
                
                rounds.reverse().forEach(round => {
                    let reward = rewards.find(reward => reward.timeStamp > Date.parse(round.end));
                    if (reward) {
                        rewards.splice(rewards.indexOf(reward), 1);
                    }
                    
                    this.exrtRewards.push(reward);
                });
                
                console.log(this.exrtRewards);
            });
        });
    }

}
