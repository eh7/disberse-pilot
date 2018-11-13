// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('eh7net_transactions', new Schema({ 
  blockHash: String,
  blockNumber: Number,
  from: String,
  gas: Number,
  gasPrice: String,
  hash: String,
  input: String,
  nonce: Number,
  to: String,
  transactionIndex: 0,
  value: String,
  v: String,
  r: String,
  s: String, 
  date: [], 
}));
