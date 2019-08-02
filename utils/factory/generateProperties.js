const faker = require('faker');
const fs = require('fs');
const myProperties = require('../../utils/data/properties.json').properties;
const myMath = require('../../utils/helpers/math');

function generateProperties() {
  let properties = [];
  properties = myProperties;

  for (let id = 1; id <= 100; id += 1) {
    const oneDate = faker.date.recent();
    const rawPrice = faker.random.number();
    const streetAddress = faker.address.streetAddress();
    const stateAbbr = faker.address.stateAbbr();

    const price = myMath.roundIt(rawPrice, 3);
    const state = faker.address.state();
    const city = faker.address.city();
    const address = `${streetAddress}, ${city}, ${stateAbbr}`;
    const type = `${myMath.getRandomInt(1, 7)}-bedrrom ${myMath.randomIt([
      'flat',
      'maisonette',
      'bungalow',
      'boma',
      'condo',
      'manyatta',
      'loft'
    ])}`;
    const imageUrl = faker.image.imageUrl();
    const createdAt = oneDate;
    const updatedAt = oneDate;
    const owner = myMath.getRandomInt(1, 5);

    properties.push({
      price,
      state,
      city,
      address,
      type,
      imageUrl,
      createdAt,
      updatedAt,
      owner
    });
  }

  return { properties };
}

const dataObj = generateProperties();

fs.writeFileSync(
  'utils/data/fakerProperties.json',
  JSON.stringify(dataObj, null, '\t')
);
