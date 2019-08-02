require('dotenv').config(); // to access .env
const myProperties = require('../utils/data/properties.json');
const fakerProperties = require('../utils/data/fakerProperties.json');

const isDevMode = process.env.NODE_ENV === 'development';
const properties = isDevMode ? myProperties : fakerProperties;

module.exports = {
  up(queryInterface) {
    return queryInterface.bulkInsert('Properties', properties.properties);
  },

  down(queryInterface) {
    return queryInterface.bulkDelete('Properties', null);
  }
};
