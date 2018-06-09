import app from './app';
import { DB } from './mongodb/DB';

const port = process.env.PORT || 8080;


new DB().connect().then(db => {
  app.listen(port, function() {
    console.log('Express server listening on port ' + port);
  });
});
