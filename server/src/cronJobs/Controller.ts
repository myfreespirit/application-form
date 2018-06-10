import taskSheduler from './TaskScheduler';
import etherscanService from '../services/etherscan';


class Controller {
  public init() {
	taskSheduler.everyMinute(function() {
		etherscanService.updateEtherTransfers().then(data => {
		console.log("cron job: ether transfers update completed.");
	});
    })


    taskSheduler.everyFiveMinutes(function() {
    	etherscanService.updateTokenTransfers().then(data => {
		console.log("cron job: token transfers update completed.");
    	});
    })
  }
}


export default new Controller();
