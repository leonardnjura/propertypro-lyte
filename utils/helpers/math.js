exports.getRandomInt = (myMin, myMax) => {
  const min = Math.ceil(myMin);
  const max = Math.floor(myMax);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.roundIt = (myNum, exponent = 0) => {
  return Math.ceil(myNum / 10 ** exponent) * 10 ** exponent;
};

exports.randomIt = myArray => {
  return myArray[Math.floor(Math.random() * myArray.length)];
};
