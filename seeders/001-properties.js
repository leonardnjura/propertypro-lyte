require('dotenv').config(); // to access .env
const properties = require('../utils/data/properties.json');

module.exports = {
  up(queryInterface) {
    return queryInterface.bulkInsert('Properties', properties.properties);
  },

  down(queryInterface) {
    return queryInterface.bulkDelete('Properties', null);
  }
};
