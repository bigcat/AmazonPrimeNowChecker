const request = require('request');
const jar = request.jar();
const https = require('follow-redirects').https;
const querystring = require('querystring');
const cheerio = require('cheerio');

let rawdata = '',
    _zip = '55406',
    sessionInitialized = false,


defaultOpts = {
  baseUrl: 'https://primenow.amazon.com',
  jar: jar,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
  }
};

/***
* Helper function to set zip code.
*/
const sendZipCode = (zipCode) => {

  _zip = zipCode || _zip; // optional parameter to pass in zipCode

  const postBody = querystring.stringify({
    newPostalCode : _zip || '55406'
  });

  let zipPromise = new Promise( (resolve, reject) => {

    request.post(Object.assign({}, defaultOpts, {
      url: '/',
      headers : Object.assign({}, defaultOpts.headers, {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postBody.length,
      }),
      body: postBody,
      }), (errZip, resZip) => {
        if (errZip) {
          reject();
        } else {
          resolve(resZip);
        }
      }
    ); // request.post

  }); // zipPromise

  return zipPromise;

};

const initializeSession = () => {
  let initPromise = new Promise((resolve, reject) => {

    request.get( Object.assign({}, defaultOpts, {
      url: '/'
    }), (errInit, resInit, bodyOne) => {
      if (errInit)
        console.log('Error: ' + errInit);
      //console.log('Response Code 1: ' + resInit.statusCode);

      sendZipCode().then( (responseZip) => {
        // assume happy case cuz we should fall thru to catch()
        sessionInitialized = true;
        resolve({initialized:true, message: 'We have successfully initialized a session!'});
      }).catch( (errorZip) => {
        // ske-doosh!
        reject(errorZip);
      });

    }); // request.get

  });

  return initPromise;

};

module.exports = {

  set zipCode (zipCode) {
    _zip = zipCode;
    // we could re-post this in the setter maybe?
  },
  get zipCode () {
    return _zip;
  },

  /**
  *
  */
  checkStock(zipCode) {

    this.zipCode = zipCode || _zip; // optional parameter to pass in zipCode

    let stockPromise,
        resolverFunction = (resolve, reject) => {

          request.get(Object.assign({}, defaultOpts, {
              url: '/search?k=nintendo+switch&p_95=&merchantId=&ref_=pn_gw_nav_ALL',
            }),
            (errStock, resStock, bodyStock) => {

              if (errStock) {
                reject(errStock);
                return; // early exit
              }

              //DEBUG && console.log('Response Code 3: ' + resStock.statusCode);

              let $ = cheerio.load(bodyStock, {normalizeWhitespace: true});
              let stockAny = false;
              let stockNeon = false;
              let stockGrey = false;
              let websiteNeon = '';
              let websiteGrey = '';
              $('p.asin__details__title')
                .each(
                  function(i, product) {
                    // "this" in the .each is the node
                    if ( $(this).text().trim() === 'Nintendo Switch with Neon Blue and Neon Red Joy-Con' ) {
                      stockAny = true;
                      stockNeon = 'Yay! There is the red/blue one in stock!';
                      websiteNeon = 'https://primenow.amazon.com' + $(this).parent().parent().attr('href')
                    } else if ( $(this).text().trim() === 'Nintendo Switch with Gray Joy-Con' ) {
                      stockAny = true;
                      stockGrey = true;
                      websiteGrey = 'https://primenow.amazon.com' + $(this).parent().parent().attr('href')
                    }
                  }
                ); //.each

              // Done
              resolve(
                {
                  stock :
                  {
                    any: stockAny,
                    Neon: stockNeon,
                    Grey: stockGrey,
                  },
                  website :
                  {
                    grey: websiteGrey,
                    neon: websiteNeon,
                  }
                }
              ); //resolve
            } // callback
          ); //request.get
        }; //resolverFunction


    if (!sessionInitialized) {
      stockPromise = initializeSession().then( (data) => {
        return new Promise(resolverFunction);
      }).catch( (err) => {
        console.log('Got an error trying to initialize the amazon session :( ' + err);
      });
    } else {
      stockPromise = new Promise(resolverFunction); // stockPromise
    }

    return stockPromise;

  }
};
