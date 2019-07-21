const Sequelize = require('sequelize');
const config = require('./config');

const { NODE_ENV, DATABASE_USER, DATABASE_PASSWORD, HOST } = process.env;

const isDevMode = NODE_ENV === 'development';
const isTestMode = NODE_ENV === 'test';
const isProductionMode = NODE_ENV === 'production';

let DATABASE_NAME = '';
if (isDevMode) {
  console.log('isDevMode');
  DATABASE_NAME = config.development.database;
} else if (isTestMode) {
  console.log('isTestMode');
  DATABASE_NAME = config.test.database;
} else if (isProductionMode) {
  console.log('isProductionMode');
  DATABASE_NAME = config.production.database;
}

const db = new Sequelize(DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, {
  host: HOST,
  dialect: 'postgres'
});

module.exports = { db, DATABASE_NAME };
