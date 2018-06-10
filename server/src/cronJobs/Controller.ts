import taskSheduler from './TaskScheduler';
import etherscanService from '../services/etherscan';


class Controller {
  public init() {
    taskSheduler.everyFiveMinutes(function() {
    	etherscanService.updateTokenTransfers().then(data => {
        	console.log("cron job mark");
    	});
    })
  }
}


export default new Controller();
