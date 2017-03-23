const switchStock = require('./helpers/switchStockChecker');
const readline = require('readline');
const moment = require('moment');

module.exports = function() {

  let zipcode = '55406';
  let refresh = '5';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('What is your zip code you want to check? ', (answer) => {
    zipcode = answer;
    rl.question('How often do you want to check for stock (in seconds)? ', (answer2) => {
      refresh = answer2;
      rl.close();
      loopStockCheck();
    });
  });

  const loopStockCheck = () => {
    setInterval( () => {
      switchStock.checkStock(zipcode).then( (data) => {

        console.log(`  ${moment().format()}
  ${data.stockNeon}
  ${data.stockGrey}
  `
        ); // console.log
      })
      .catch( (err) => {
        console.log('Oh no! Something has gone wrong! ' + JSON.stringify(err) );
      }); //switchstock.checkstock
    }, refresh * 1000 );
  };

}
