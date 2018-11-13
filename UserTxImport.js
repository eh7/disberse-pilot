var config      = require('./config'); 

const Web3=require('web3')
//const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'))
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider))

var mongoose    = require('mongoose');
var mongo_client = require('mongodb').MongoClient
  , format = require('util').format;
var User    = require('./app/models/user');
var Event   = require('./app/models/event');
var Project = require('./app/models/project');
var Mystats = require('./app/models/mystats');

mongoose.connect(config.database,{ useMongoClient:true }); 

/*
  Find transfer events and add new address to access project 
  convert project_ref from
*/

//console.log(123);

var last_block = 0;

function update_transfer_access_to_project() {

  console.log("update_transfer_access_to_project");

  Mystats.findOne({flag:'UserTxImport'}, function(err, data) { 
    if(err) console.log(err); 
    else
    {
      if(data == null)
        Mystats.create({flag:'UserTxImport',UserTxImportPosition:Number(0)}, function(err,doc){if(err)console.log(err);});
      if(data == null || data.UserTxImportPosition == null) last_block = 28;
      else last_block = data.UserTxImportPosition;
//      last_block = data.UserTxImportPosition;
      console.log(last_block);

      Event.find({'event':'Transfered','returnValues.0':/^0x/,blockNumber:{$gt:last_block}},[],{sort:{blockNumber:+1}}, function(err,events) {
        if(err)
          console.log(err);
        else
        {
          var out;
          for(i=0; i<events.length; i++)
          {
            var project_ref = events[i].returnValues[3];
            var from = events[i].returnValues[0];
            var to = events[i].returnValues[1];
      
            if(project_ref.match(/00000000$/))
            {
              project_ref.replace(/00000000$/,'');
              project_ref.replace(/^0x/,'');
            } 
            else
            {
              var text_project_ref =  web3.utils.toAscii(project_ref);
              var this_to =  to;
    
              console.log("add " + to + " to project " + text_project_ref);
    
              console.log("last_block: " + events[i].blockNumber);

              Mystats.update({flag:'UserTxImport'},{$set:{UserTxImportPosition:Number(events[i].blockNumber)}}, function(err) { if(err) console.log(err); });
    
    //            {'project_ref':text_project_ref}, 
    
              Project.update( 
                {'project_ref':text_project_ref,addresses:{$ne:to}}, 
                {$push:{"addresses":to}}, 
                function (err, projects) {
                  if(err) console.log(err);
              });
            }
          }
//          setTimeout(function(){
//            process.exit();
//          }, 10 * 1000);
          setTimeout(update_transfer_access_to_project, 60 * 1000);
        }
      });
    }
  });
}

//update_transfer_access_to_project();

setTimeout(update_transfer_access_to_project, 1000);
