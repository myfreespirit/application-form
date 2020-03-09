import taskSheduler from './TaskScheduler';
import etherscanService from '../services/etherscan';


class Controller {
  
  static data_id = {
      // "USD": 2781,
      "ETH": 1027,
      "BTC": 1,
      "LTC": 2,
      "EXRN": 2088
  }
  
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
    
    
    taskSheduler.everyTwentyMinutes(function() {
        let convert = "USD";
        Object.entries(Controller.data_id).forEach(([base, id]) => {
            etherscanService.updateCMCprice(base, id, convert).then(data => {
                console.log("cron job: CMC price updates completed.");
            });
        });
    })
  }
}


export default new Controller();
