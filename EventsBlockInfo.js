var config      = require('./config'); 

const Web3=require('web3')
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider))

var mongoose    = require('mongoose');
var mongo_client = require('mongodb').MongoClient
  , format = require('util').format;
var Mystats  = require('./app/models/mystats');
var User    = require('./app/models/user');
var Event   = require('./app/models/event');
var Block   = require('./app/models/block');

mongoose.connect(config.database,{ useMongoClient:true }); 

var disberse_abi = config.abi;
var owner_address = config.owner_address;
var contract_address = config.contract_address;
var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

console.log(web3.currentProvider.connection._readyState);

var startBlock = 0;

function run() {

  Mystats.findOne({flag:'TimestampEvents'}, function(err, mystat){

    if(mystat == null) {
      Mystats.create({flag:'TimestampEvents',position:Number(0)}, function(err,doc){if(err)console.log(err);});
      startBlock = 1;
    } else {
      startBlock = mystat.position + 1;
    }

    console.log("bn: " + startBlock);
    var i = 0;

    Disberse.getPastEvents({fromBlock: startBlock}, function(error, events) {
      if(error)
      {
        console.log("Error Disberse.events.allEvents: " + error);
      }
      else
      {
        for(i=0; i<events.length; i++)
        {
          var event = events[i];

          web3.eth.getBlock(event.blockNumber, function(err, block){
            var thisBlock = new Block({number:block.number,timestamp:block.timestamp});
            thisBlock.save(function(err,out) {
              if(err) console.log(err);
              // saved
              console.log("added block info for :: " + out);
              Mystats.update({flag:'TimestampEvents'},{$set:{position:Number(block.number)}}, function(err,stat){
                if(err) console.log(err);
              }); 
            });
          });
        }
//        setTimeout(function(){
//          process.exit();
//        }, 10 * 1000);
        setTimeout(run, 30 * 1000);
      }
    });
  });
}

setTimeout(run,1000);
