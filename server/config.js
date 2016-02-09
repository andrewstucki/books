var _ = require("underscore");

var environment = process.env.NODE_ENV || "development";

//https://www.googleapis.com/books/v1/volumes\?q\=intitle:wind+up+bird+chronicles\&key\=AIzaSyCLDvmkuhLcrUdAlpzhYprn8TD89m2Skqk\&fields\=items/volumeInfo\(title,authors,imageLinks\)\&printType\=books

var config = {
  development: {
    db: "mongodb://localhost/books",
    port: 3000,
    redis: 'redis://localhost:6379',
    mandrill_key: process.env.MANDRILL_APIKEY,
    books_key: process.env.BOOKS_APIKEY,
    baseUrl: 'http://localhost:3000'
  },

  test: {
    db: "mongodb://localhost/books-test",
    port: 3000,
    redis: 'redis://localhost:6379',
    mandrill_key: process.env.MANDRILL_APIKEY,
    books_key: process.env.BOOKS_APIKEY,
    baseUrl: 'http://localhost:3000'
  },

  production: {
    db: process.env.MONGOLAB_URI,
    port: process.env.PORT,
    redis: process.env.REDIS_URL,
    mandrill_key: process.env.MANDRILL_APIKEY,
    books_key: process.env.BOOKS_APIKEY,
    baseUrl: process.env.BASE_URL
  }
};

/* istanbul skip next */
if (!(environment in config)) throw new Error("Invalid environment specified: " + environment + "!");

module.exports = _.extend({}, config[environment], {
  environment: environment
});
