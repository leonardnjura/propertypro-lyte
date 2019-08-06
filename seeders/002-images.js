require('dotenv').config(); // to access .env
const images = require('../utils/data/images.json');

module.exports = {
  up(queryInterface) {
    return queryInterface.bulkInsert('Images', images.images);
  },

  down(queryInterface) {
    return queryInterface.bulkDelete('Images', null);
  }
};
