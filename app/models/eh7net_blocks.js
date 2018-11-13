// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('eh7net_blocks', new Schema({ 
  difficulty: Number,
  extraData: String,
  gasLimit: Number,
  gasUsed: Number,
  hash: String,
  logsBloom: String,
  miner: String,
  mixHash: String,
  nonce: String,
  number: Number,
  parentHash: String,
  receiptsRoot: String,
  sha3Uncles: String,
  size: Number,
  stateRoot: String,
  timestamp: Number,
  totalDifficulty: String,
  transactions: [String],
  transactionsRoot: String,
  uncles: [String] 
}));
