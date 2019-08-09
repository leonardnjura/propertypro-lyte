require('dotenv').config(); // to access .env
const config = require('config'); // to access /config/default.json

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const moment = require('moment');
const { db, DATABASE_NAME } = require('./config/database');

const swaggerLocal = require('./documentation/swaggerLocal.json');
const swaggerRemote = require('./documentation/swaggerRemote.json');

const app = express();

// middleware
app.use(express.json());

const { NODE_ENV } = process.env;

const isDevMode = NODE_ENV === 'development';
const isProductionMode = NODE_ENV === 'production';

// greetings
const today = moment()
  .local()
  .format('dddd')
  .toLowerCase();
const now = moment()
  .local()
  .format('Do MMMM, YYYY hh:mma')
  .toLowerCase();

const quote = isDevMode
  ? config.get('TAFAKARI_LA_BABU').toLowerCase()
  : config.get('QUOTE_OF_THE_DAY').toLowerCase();
const swaggerDocument = isProductionMode ? swaggerRemote : swaggerLocal;

db.authenticate()
  .then(() => console.log(`\n[${DATABASE_NAME}]Database connected..`))
  .catch(err => console.log(`Error ${err}`));

app.get('/', (req, res) => {
  res.json({
    karibu: today,
    saa: now,
    quote,
    msg: 'welcome to propertypro lyte'
  });
});

// use routes
app.use('/api/auth', require('./routes/api/users'));
app.use('/api/properties', require('./routes/api/properties'));
app.use('/api/images', require('./routes/api/images'));
app.use('/api/flags', require('./routes/api/flags'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`${quote}, :) \nServer started on port ${PORT}`);
});

module.exports = { app, server };
