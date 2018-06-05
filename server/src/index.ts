import app from "./app";
const port = process.env.PORT || 8080;
import { DB } from './mongodb/DB';


new DB().connect().then(db => {
  app.listen(port, function() {
    console.log('Express server listening on port ' + port);
  });
});
