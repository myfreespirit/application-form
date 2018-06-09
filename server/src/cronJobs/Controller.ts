import taskSheduler from './TaskScheduler';
import { DataService } from  '../../../src/app/data.service';


class Controller {
  public init() {
    taskSheduler.everyMinute(function() {
    //this._dataService.saveTokenTransfersOfSignups().then(data => {
        console.log("retrieved from the database");
	//});
    })
  }
}

export default new Controller();
