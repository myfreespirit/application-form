const cron = require('node-cron');


class TaskScheduler{
  public everySecond(fn){
    cron.schedule('* * * * * *', function(){
      fn();
    });
  }

  public everyMinute(fn){
    cron.schedule('1 * * * * *', function(){
      fn();
    });
  }

  public everyHour(fn){
    cron.schedule('* 1 * * * *', function(){
      fn();
    });
  }
}

export default new TaskScheduler()
