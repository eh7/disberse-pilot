var config      = require('./config'); 

const Web3=require('web3')
//const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8548'))
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider))

var mongoose    = require('mongoose');
var mongo_client = require('mongodb').MongoClient
  , format = require('util').format;
var User    = require('./app/models/user');
var Event   = require('./app/models/event');

var Promise = require('promise');


mongoose.connect(config.database,{ useMongoClient:true }); 

var disberse_abi = config.abi;
var owner_address = config.owner_address;
var contract_address = config.contract_address;
var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

console.log(web3.currentProvider.connection._readyState);


function proccessNewEvents () {

  console.log(web3.currentProvider.connection._readyState);
  var i = 0;

  var startBlock = 1;

  Event.findOne({}, {blockNumber: 1, _id:0}, function(err, event) {
//console.log(event);
//process.exit();
    if(err)
      console.log(err);
    else
    {
//      console.log(event);
      if(event == null) 
        Event.create({}, function(err,doc){if(err)console.log(err);});

      if(event && event.blockNumber) startBlock = event.blockNumber + 1;
      if(startBlock == null) startBlock = 1;

      console.log(startBlock);
    
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

            var outReturnValue = {
                                    to:event.returnValues._to,
                                    value:event.returnValues._value,
                                    from:event.returnValues._from,
                                 };
            var e = event.returnValues;
//console.log(e);
            for (var key in e){
              outReturnValue[key] = e[key];
//console.log(outReturnValue[key]);
            }

            var mongoEvent = new Event({ 
                                    address: event.address,
                                    event: event.event,
                                    blockNumber: event.blockNumber,
                                    transactionHash: event.transactionHash,
                                    transactionIndex: event.transactionIndex,
                                    blockHash: event.blockHash,
                                    logIndex: event.logIndex,
                                    removed: event.removed,
                                    returnValues: outReturnValue, 
                                    to:event.returnValues._to,
                                    value:event.returnValues._value,
                                    from:event.returnValues._from,
                                    signature: event.signature,
                                  });
//console.log(mongoEvent);

//console.log(event);
//mongoEvent.save(console.error);

//console.log("saved");
            mongoEvent.save(function (err) {
              if (err) return console.log(err);
              // saved!

            });

            console.log(event.blockNumber);
console.log("---------------------------");
          }

          // add new addresses when they are 
          // sent transaction for project

//          Events.find({'event':'Transfered','returnValues.0':/^0x/},{event:1,'returnValues.0':1,'returnValues.1':1,'returnValues.3':1}, console.log);

//          setTimeout(function(){
//            process.exit();
//          }, 10 * 1000);
          setTimeout(proccessNewEvents,  60 * 1000);
          
        }
      });
    }
  }).sort({blockNumber:-1}).limit(1).exec();
}

setTimeout(proccessNewEvents, 1000);

