import taskShedular from './TaskScheduler'
import { DataService } from  '../../../src/app/data.service'

class Controller {
  public init() {
    taskShedular.everyMinute(function() {
    //DataService.saveTokenTransfersOfSignups().then((data) => {
        console.log("retrieved from the database");
	//});
    })
  }
}

export default new Controller()
