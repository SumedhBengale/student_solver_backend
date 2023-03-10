import express from 'express';
import { APP_PORT, MONGO_URI } from './config';
import routes from './routes';
import errorHandler from './middlewares/errorHandler';
import mongoose from 'mongoose';
import path from 'path';

const app = express();

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to database');
});


global.appRoot = path.resolve(__dirname);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(routes);



app.use(errorHandler);
app.listen(APP_PORT, () => {
  console.log(`Server is running on port ${APP_PORT}`);
}
)