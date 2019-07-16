require('dotenv').config();         // to access .env private secrets n stuff
const config = require('config');   // to access /config/default.json public secrets n stuff

const express = require('express');
const db = require('./config/database')

const app = express();

// middleware
app.use(express.json());

const { NODE_ENV } = process.env
const isDevMode = NODE_ENV === 'development'

// config
const quote = isDevMode ? config.get('TAFAKARI_LA_BABU') : config.get('QUOTE_OF_THE_DAY')

// test db
db.authenticate()
  .then(() => console.log('Database connected..'))
  .catch(err => console.log('Error' + err));

app.get('/', (req, res) => {
  res.json({msg:'welcome to propertypro lyte'});
});


// use routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));


const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`${quote}, :) \nServer started on port ${PORT}`));
