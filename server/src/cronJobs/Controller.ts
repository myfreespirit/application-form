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
    	etherscanService.updateTokenTransfers("EXRN").then(data => {
		console.log("cron job: EXRN transfers update completed.");
    	});
    })


    taskSheduler.everyFifteenMinutes(function() {
  	etherscanService.updateTokenTransfers("EXRT").then(data => {
		console.log("cron job: EXRT transfers update completed.");
    	});
    })
  }
}


export default new Controller();
