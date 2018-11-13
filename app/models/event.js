// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('events', new Schema({ 
    address: String,
    event: String,
    type: String,
    blockNumber: Number,
    transactionHash: String,
    transactionIndex: Number,
    blockHash: String,
    logIndex:Number,
    removed: Boolean, 
    returnValues: {
                    from:String,
                    to:String,
                    value:Number,
                    "0":String,
                    "1":Schema.Types.Mixed,
                    "2":Schema.Types.Mixed,
                    "3":Schema.Types.Mixed,
                    "4":Schema.Types.Mixed,
                    "5":Schema.Types.Mixed,
                    token_type:Schema.Types.Mixed,
                    project_ref:Schema.Types.Mixed,
                    status:Schema.Types.Mixed,
                  }, 
    from:String,
    to:String,
    value:Number,
    signature: String,
    raw: String,
    timestamp: Number,
}));

/*
{ address: '0xb28b7085C6df9c8BE668F01Ff9b82e5113f2dDB0',
  blockNumber: 1977553,
  transactionHash: '0xd601db993d45fdb9ec80340552656aaea59a5e0cc4bdf66d1a77ebefb4c80a2d',
  transactionIndex: 2,
  blockHash: '0xd7fb7a1dc46ef946c9b07ccff3506d18b3b1003b73850eedecbe496c8dc3cbc2',
  logIndex: 2,
  removed: false,
  id: 'log_fdb3b20b',
  returnValues: 
   Result {
     '0': '0x886716BdefD67415e5e9215541564426bDAc800A',
     '1': '0xB88600AA4B10fe827213EB760835af55f46a0E36',
     '2': '50',
     '3': '0xbc614e0000000000',
     '4': '0',
     _from: '0x886716BdefD67415e5e9215541564426bDAc800A',
     _to: '0xB88600AA4B10fe827213EB760835af55f46a0E36',
     _value: '50',
     project_ref: '0xbc614e0000000000',
     status: '0' },
  event: 'Transfered',
  signature: '0x211e416f5285540918fb32431c077ccec84631f95a168a5ba97b63323085c924',
  raw: 
   { data: '0x0000000000000000000000000000000000000000000000000000000000000032bc614e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
     topics: 
      [ '0x211e416f5285540918fb32431c077ccec84631f95a168a5ba97b63323085c924',
        '0x000000000000000000000000886716bdefd67415e5e9215541564426bdac800a',
        '0x000000000000000000000000b88600aa4b10fe827213eb760835af55f46a0e36' ] } }
*/
