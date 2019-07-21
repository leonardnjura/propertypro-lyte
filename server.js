require('dotenv').config(); // to access .env
const config = require('config'); // to access /config/default.json

const express = require('express');
const { db, DATABASE_NAME } = require('./config/database');

const app = express();

// middleware
app.use(express.json());

// greetings
const isDevMode = process.env.NODE_ENV === 'development';
const quote = isDevMode
  ? config.get('TAFAKARI_LA_BABU')
  : config.get('QUOTE_OF_THE_DAY');

db.authenticate()
  .then(() => console.log(`\n[${DATABASE_NAME}]Database connected..`))
  .catch(err => console.log(`Error ${err}`));

app.get('/', (req, res) => {
  res.json({ msg: 'welcome to propertypro lyte' });
});

// use routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`${quote}, :) \nServer started on port ${PORT}`);
});

module.exports = { app, server };
