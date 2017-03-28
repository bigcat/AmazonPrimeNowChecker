const switchStock = require('./helpers/switchStockChecker');
const readline = require('readline');
const moment = require('moment');
const open = require('opn');

module.exports = function() {

  let zipcode = '55406';
  let refresh = '5';
  let siteOpened = false;

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
    console.log('Checking stock! \n');
    setInterval( () => {
      switchStock.checkStock(zipcode).then( (data) => {
        console.log('\n' + moment().format() )
        if (data.stock.any) {

          data.stock.Neon && !siteOpened && open(data.website.neon) && console.log('Yay! Neon is available!');
          data.stock.Grey && !siteOpened && open(data.website.grey) && console.log('Yay! Grey is available!');
          siteOpened = true;

        } else {

          console.log('No Luck yet :(');

        }
      })
      .catch( (err) => {
        console.log('Oh no! Something has gone wrong! ' + JSON.stringify(err) );
      }); //switchstock.checkstock
    }, refresh * 1000 );
  };

}
