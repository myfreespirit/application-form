const cron = require('node-cron');


class TaskScheduler {
  public everySecond(fn) {
    cron.schedule('* * * * * *', function() {
      fn();
    });
  }


  public everyMinute(fn) {
    cron.schedule('0 */1 * * * *', function() {
      fn();
    });
  }


  public everyFiveMinutes(fn) {
    cron.schedule('0 */5 * * * *', function() {
      fn();
    });
  }


  public everyFifteenMinutes(fn) {
    cron.schedule('0 */15 * * * *', function() {
      fn();
    });
  }
  
  
  public everyTwentyMinutes(fn) {
    cron.schedule('0 */20 * * * *', function() {
      fn();
    });
  }
  
  
  public everyThirtyMinutes(fn) {
    cron.schedule('0 */30 * * * *', function() {
      fn();
    });
  }


  public everyHour(fn) {
    cron.schedule('0 0 */1 * * *', function() {
      fn();
    });
  }
}


export default new TaskScheduler()
