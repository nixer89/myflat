'use strict';

var _ = require('lodash');
var LOTTO_DATA_TABLE_NAME = process.env.DB_TABLE;

var credentials = {
    accessKeyId: process.env.DB_ACCESS_KEY_ID,
    secretAccessKey: process.env.DB_SECRET_ACCESS_KEY,
    region: 'eu-west-1'
};

var dynasty = require('dynasty')(credentials);

function OverAllDbHelper() {}
  
var lottoDbTable = function() {
    return dynasty.table(LOTTO_DATA_TABLE_NAME);
};

OverAllDbHelper.prototype.readAllLotteryNumbers = function(userId) {
  return lottoDbTable().find(userId).then(function(result) {
    return result;
  });
};

module.exports = OverAllDbHelper;