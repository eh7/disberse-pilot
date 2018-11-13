`"use strict"`

var express     = require('express');
var app         = express();
var path        = require('path');
var fs          = require('fs');
var Promise     = require('promise');

var config      = require('./config'); // get our config file

// var walletRoutes   = express.Router(); 
// var apiRoutes   = express.Router(); 
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var url         = require('url');
var crypto      = require('crypto'),
    algorithm   = 'aes-256-ctr';
//var localStorage = require('localStorage')
var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = new LocalStorage('./disberse');
var authed_token, authed_email, authed_id;

var keythereum = require('keythereum');
var solc = require('solc');
var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
    
var moment = require('moment');

var nodemailer = require('nodemailer');

// web3 provider
var web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
//console.log(Web3.providers);
//var web3 = new Web3(new Web3.providers.HttpProvider());

// jwt
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

// database
var mongo_client = require('mongodb').MongoClient
  , format = require('util').format;
var User      = require('./app/models/user');
var Event     = require('./app/models/event');
var Block     = require('./app/models/block');
var Project   = require('./app/models/project');
var Currencies  = require('./app/models/currencies');

var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
var host = process.env.HOST || "localhost";
mongoose.connect(config.database,{ useMongoClient:true }, function(err, db){
  if(err)
    console.log(err);
//  else
//    console.log(db);
}); 


var express = require('express')
var parseurl = require('parseurl')
var session = require('express-session')

var authcode_password_reset = {};


app.set('superSecret', config.secret);

app.set('view engine', 'ejs');

app.disable('etag');

// assets directory
app.use('/assets', express.static(path.join(__dirname + '/assets')));
//app.use('/.well-known', express.static(path.join(__dirname + '/.well-known')));


// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));


app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: true
}));

app.use(function (req, res, next) {
  if (!req.session.token) {
    req.session.token = {}
  }

//  req.session.token["sessionData"] = "token";

  next()
});

app.get('/wallet', function (req, res, next) {
  main(req, res);
});

app.post('/wallet', function (req, res, next) {
  main(req, res);
});

app.get('/', function (req, res, next) {
  main(req, res);
});

app.use(function(req,res) { 
  res.status(404).render('pages/login_form', {"error":"404 Page Not Found",org:'',email:'',password:''});
//  res.render('pages/login_form', {"error":"",org:'',email:'',password:''});
/*
  res.render('404', 
             { locals: {'title':'Not Found'}, 
             }, function(err,str) { 
//                 res.send(str,404); 
                 res.status(404).send(str); 
            }); 
*/
});

app.listen(port,host);
console.log('Magic happens at http://' + host + ':' + port);
/*---------------------------------------------------------------------*/
function main(req, res) {
  console.log("session token: " + req.session.token['sessionData']);
  web3.eth.net.isListening(function(err,out){ 
    if(err)
    {
      console.log(err); 
//      web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
      res.render('pages/login_form', {"error":"web3 timeout",org:'',email:'',password:''});
    }
    else if(out == false)
    {
      console.log(err); 
//      web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
      res.render('pages/login_form', {"error":"web3 timeout",org:'',email:'',password:''});
    }
    else
    {
      console.log("out: " + out); 

      main_old(req, res);
    }
  });
}
/*---------------------------------------------------------------------*/


function authed_session(req,res) {
  console.log('authed_session');
  var action = req.body.action || req.query.action;
}


/*---------------------------------------------------------------------*/

function topMenu(email) {
  data = [
    {type:'Dashboard',link:'', icon:'md-view-dashboard'},
    {type:'Transactions',link:'?action=tx', icon:' md-view-list'},
    {type:'Projects',link:'?action=projects', icon:' md-apps'},
    {type:'Rates',link:'?action=rates', icon:'md-money'},
    {type:'Deposit',link:'?action=deposit', icon:'md-plus-circle-o-duplicate'},
    {type:'Send',link:'?action=send', icon:'md-arrow-right-top'},
//    {type:'Request',link:'?action=request', icon:'md-arrow-left-bottom'},
    {type:'Redeem',link:'?action=redeem', icon:'md-play-for-work'},
  ];

  if(email == "info@eh7.co.uk" || email == "hello@disberse.com" || email == "a@a.com") {
    data.push({type:'Admin Jobs',link:'?action=jobs', icon:'md-alert-circle-o'});
    data.push({type:'Overview',link:'?action=overview', icon:'md-alert-circle-o'});
  }

  return data;
}
/*

    {type:'Dashboard',link:'', icon:'md-view-dashboard'},
    {type:'Transactions',link:'?action=tx', icon:'md-view-dashboard'},
    {type:'Projects',link:'?action=projects', icon:'md-view-dashboard'},
    {type:'Rates',link:'?action=rates', icon:'md-view-dashboard'},
    {type:'Deposit',link:'?action=deposit', icon:'md-view-dashboard'},
    {type:'Send',link:'?action=send', icon:'md-view-dashboard'},
    {type:'Request',link:'?action=request', icon:'md-view-dashboard'},
    {type:'Redeem',link:'?action=redeem', icon:'md-view-dashboard'},
*/

/*-------------------------------------------------------------------*/

function footMenu() {
  return [
    {type:'Settings',link:'?action=settings', icon:'md-settings'},
    {type:'Support',link:'?action=support', icon:'md-help'},
    {type:'Logout',link:'?action=logout', icon:'md-power'},
  ];
/*
  return [
    {type:'settings',link:'?action=settings', icon:'md-view-dashboard'},
    {type:'support',link:'?action=support', icon:'md-view-dashboard'}
  ];
*/
}


/*---------------------------------------------------------------------*/

function rates_page(req, res, decoded) {

  var page_title = "FX Rates";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var rates = config.currencies;
  console.log(rates);

  var rate_link = [
                {type:'GBP',rate:'1:1',token:'GBP'},
                {type:'USD',rate:'1:1.31',token:'GBP'},
                {type:'KES',rate:'1:135',token:'GBP'},
                {type:'ZAR',rate:'1:18.56',token:'GBP'},
              ];

  getUserOrg(id).then(function(account_org) {

    res.render('pages/rates', {
                             page_title:page_title,
                             "my_var":err,
                             address:address,
                             username:email,
		             balance:balance,
                             account_org:account_org,
                             menu0:menu0,
                             menu1:menu1,
                             label:label,
                             rate_link:rate_link,
                             rates:rates,
                             'id':id
                           });
  });
}

/*---------------------------------------------------------------------*/

function getLabel(email){
  return [{type:'email',value:email}];
//  return [{type:'logout',link:'?action=logout'},{type:'email',value:email}];
}

/*---------------------------------------------------------------------*/

function tx_page(req, res, decoded) {

  var page_title = "Transactions";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var events = [];


  var history = []; //[{value:'view tx history',link:'?action=tx'}];
  var history_link = [];

  getUserOrg(id).then(function(account_org) {

  var data = {
               page_title:page_title,
                       currency_types:[],
		       events:events,
		       "my_var":err,
		       username:email,
                       address:address,
		       balance:balance,
                       account_org:account_org,
		       menu0:menu0,
		       menu1:menu1,
		       label:label,
		       history_link:history_link,
		       history:history,
		       'id':id
		     };

  var user_org = {};
  user_org[''] = "Disberse";

  var timestamp = {};

  var project_type = {};

  var total_credit = 0;
  var total_debit  = 0;

  var currency_type = [];

  Currencies.find({},[],{sort:{type:1}},function(err, currencies) {
    if(err) reject(err);

    var total_type_credit = [];
    var total_type_debit  = [];
    var total_type_balance = [];

    for(i=0;i<currencies.length;i++) {
      currency_type[currencies[i].id] = currencies[i].type;
      data.currency_types.push(currencies[i].type);
//console.log(currencies[i].type);
      total_type_balance[currencies[i].type] = 0;
      total_type_credit[currencies[i].type] = 0;
      total_type_debit[currencies[i].type]  = 0;
    }
    console.log(currency_type);
    console.log(total_type_balance);
    console.log(total_type_credit);
    console.log(total_type_debit);

  Project.find({},function(err, projects) {
    if(err)
    {
      console.log(err);
      res.render('pages/project', data);
    }
    else
    {
      for(i=0; i<projects.length; i++)
      {
        var project =  projects[i].toObject();
        project_type[project.project_ref] = project.currency; 
//        console.log(project.project_ref  + " :: " + project.currency + " " + project_type[project.ref] + " ");
      }

//  Transaction.find({},function(err, users) {

      User.find({},function(err, users) {

        for(i=0; i<users.length; i++)
        {
          var user = users[i];

//console.log(user.name + ":: " + user.address);
          user_org[user.address.toLowerCase()] = user.org;

//      console.log("user_org["+user.address.toLowerCase()+"] -> "+user_org[user.address.toLowerCase()]);
        }

        Block.find({},[],{sort:{number:1}},function(err, blocks) {
          for(i=0; i<blocks.length; i++)
          {
            timestamp[blocks[i].number] = format_timestamp(blocks[i].timestamp);
          }

          User.findOne({_id:id},{},function(err,this_user) {
            Event.find({$or:[{'returnValues.0':new RegExp(this_user.address, 'i')},{'returnValues.1':new RegExp(this_user.address, 'i')}]},[],{sort:{blockNumber:-1}},function(err, events) {
              if(err)
              {
                console.log(err);
                res.render('pages/tx', data);
              }
              else
              {
                for(i=0; i<events.length; i++)
                {
                  var event = events[i].toObject();
//console.log(event);
//console.log("---------------------------------------------");

                  event.currency = "GBP";
                  var curtype = currency_type[event.returnValues[4]];
                  event.currency = curtype;
console.log('----------------------------------------------');
//console.log(curtype);
console.log(event.currency);

                  if(event.event == 'Transfered')
                  {
                    var project_ref = web3.utils.toAscii(event.returnValues[3]);
                    event.currency = project_type[project_ref];
//console.log(event.returnValues['1']);
    //nt.blockNumber + " " + event.returnValues['1'] + " :: " + config.disberse_admin_address);
                    if(event.returnValues['1'].toLowerCase() == config.disberse_admin_address.toLowerCase())
                    {
                      console.log("redeem transfer");
                      event.typename = "Redeem";
                    }
                    else
                    {
                      event.typename = "Transfer";
                    }
                  } else if(event.event == 'Deposit') {
                    event.typename = "Issue";
                  }
                  else
                    event.typename = event.event;

                  event.timestamp = timestamp[event.blockNumber];

                  event.symbol = "";
                  event.formated_value = event.returnValues.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');

//console.log(event.typename);
//console.log(event.returnValues[0]);
//console.log(event.returnValues[1]);
//console.log(address);
//console.log(event.currency);

                  if(event.typename == 'Issue') {
//console.log(event);

                    total_credit = +total_credit + +event.returnValues.value;
                    total_type_credit[event.currency] = +total_type_credit[event.currency] + +event.returnValues.value;
                    event.formated_value_credit = event.returnValues.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                    event.formated_value_debit = '';
                  } else if(event.typename == 'Transfer') {
                    if(event.returnValues[0].toLowerCase().search(address) == -1) {
                      event.formated_value_credit = event.returnValues.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                      event.formated_value_debit = '';
                      total_credit = +total_credit + +event.returnValues.value;
                      total_type_credit[event.currency] = +total_type_credit[event.currency] + +event.returnValues.value;
                    } else {
                      event.formated_value_debit = event.returnValues.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                      event.formated_value_credit = '';
                      total_debit = +total_debit + +event.returnValues.value;
                      total_type_debit[event.currency] = +total_type_debit[event.currency] + +event.returnValues.value;
                    }
                  } else {
                    event.formated_value_credit = '';
                    event.formated_value_debit = event.returnValues.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                    total_debit = +total_debit + +event.returnValues.value;
                    total_type_debit[event.currency] = +total_type_debit[event.currency] + +event.returnValues.value;
//console.log(total_debit);
                  }


                  var addr_from;
                  var addr_to;
  
                  if(event.event == 'Deposit')
                  {
//console.log(event.returnValues[0]);
    //console.log(event.returnValues[1]);
//                    addr_from = event.returnValues[0].substr(2,40);
//                    addr_to   = "";//event.returnValues[0].substr(2,40);

                    var project_ref = web3.utils.toAscii(event.returnValues[2]);
                    event.currency = project_type[project_ref];
                    addr_from = "";
                    addr_to   = event.returnValues[0].substr(2,40);
                  }
                  else
                  {
                    addr_from = event.returnValues[0].substr(2,40);
                    addr_to   = event.returnValues[1].substr(2,40);
                  }

                  event.user_org_from = user_org[addr_from.toLowerCase()];
                  event.user_org_to   = user_org[addr_to.toLowerCase()];

//            console.log("from: " + addr_from);
//            console.log("to: " + addr_to);
//console.log(event);
//console.log("------------------------------------");

                  data.events.push(event);
                }

                var total_balances = [];
                for(i=0;i<currencies.length;i++) {
                  total_type_balance[currencies[i].type] = Number(total_type_credit[currencies[i].type]) - Number(total_type_debit[currencies[i].type]);
                  total_type_balance[currencies[i].type] = total_type_balance[currencies[i].type].toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                  total_type_credit[currencies[i].type]   = total_type_credit[currencies[i].type].toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                 total_type_debit[currencies[i].type]     =  total_type_debit[currencies[i].type].toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                }
                console.log(total_type_balance);
                console.log(total_type_credit);
                console.log(total_type_debit);

                data.total_balances    = total_type_balance;
                data.total_type_credit = total_type_credit;
                data.total_type_debit  = total_type_debit;

//                data.total_balance = Number(total_credit) - Number(total_debit);
//                data.total_balance = data.total_balance.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
//                data.total_credit = total_credit.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
//                data.total_debit = total_debit.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                res.render('pages/tx', data);
              }
            });
          });
        });
      }); 
    }
  });
  });
  });
}

/*---------------------------------------------------------------------*/

function project_page(req, res, decoded) {

  var page_title = "Project";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var project_ref = req.body.project || req.query.project;
  var project_view_type = req.body.type || req.query.type;

  var project_link = [];
  var projects = [];
  var project_owner = '';

  var events = [];

  getUserOrg(id).then(function(account_org) {
  
  var data = {
               page_title:page_title,
               "my_var":err,
               address:address,
               username:email,
               account_org:account_org,
	       balance:balance,
               menu0:menu0,
               menu1:menu1,
               label:label,
               project_link:project_link,
               projects:projects,
               events:events,
               id:id
             };

  var project_ref_hex = "";
  var project_name    = "";
  var project_balance = 0;
  var current_balance = 0;

  User.findOne({_id:id},{},function(err,this_user) {

    console.log(this_user.address);

    var orgs = {};
    var timestamp = {};

    User.find({}, function(err,users) {
      for(i=0; i<users.length; i++)
      {
        var user = users[i];

        var addr = '0x' + user.address.toLowerCase();

        orgs[addr] = user.org; 
//console.log(addr + " :: " + user.org);
//        orgs['0x' + user.address.lowerCase()] = user.org; 
      }

      Block.find({},[],{sort:{number:1}},function(err, blocks) {
        for(i=0; i<blocks.length; i++)
        {
          timestamp[blocks[i].number] = format_timestamp(blocks[i].timestamp);
        }

        var user_project_filter = {addresses:{$all:[new RegExp(this_user.address, 'i')]}};
        if(project_view_type == 'over' &&
            (
              decoded.email == "info@eh7.co.uk" || 
              decoded.email  == "hello@disberse.com" || 
              decoded.email == "a@a.com"
            )
          ){
           user_project_filter = {};
        }
//        if(project_view_type == 'over') user_project_filter = {};

	Project.find({$or:[{user_id:id},
//		{addresses:{$all:[new RegExp(this_user.address, 'i')]}}
		user_project_filter	
                     ]},
                     [],
                     {}, function(err, projects) {
          if(err)
          {
            console.log(err);
            res.render('pages/project', data);
          }
          else
          {
            for(i=0; i<projects.length; i++)
            {
              var project =  projects[i].toObject();
  
console.log("pr:" + project_ref);
              if(project_ref == project.project_ref)
              {
                data.projects.project_name = project.name;
                data.projects.project_code = project.code;
                data.projects.project_currency = project.currency;
                data.projects.project_total = Number(project.amount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                data.projects.project_total_raw = project.amount;
                data.projects.project_sig   = project.project_ref;
                project_ref_hex = web3.utils.fromAscii(project.project_ref);
                project.name = project_name;
                project_owner = project.owner;
                data.projects.project_redeemed = 0;
                data.projects.project_redeemed_raw = 0;
console.log("in pr:" + project.project_ref + "  " + data.projects.project_redeemed);
              }
console.log("project_redeemed pr:" + data.projects.project_redeemed);
  
            
              data.projects.push(project);
  
            }    
//console.log(project_ref_hex);
console.log(this + "::" +this_user.address);

//{'returnValues.1':'0x577593FD63FB5E88651009157692d968eC75f363'}
    
            Event.find({$and:[
                           {$or:[
                             {'returnValues.2': project_ref_hex},
                             {'returnValues.3': project_ref_hex},
                           ]},
                           {flag:{$not:/^error$/}},
/*
                           {$or:[
                             {'returnValues.0':{$regex:this_user.address,$options:'$i'}},
                             {'returnValues.1':{$regex:this_user.address,$options:'$i'}},
                             // this bit allows redeem view for 
                             // non, need to add only view for creator 
                             {$and:[{'returnValues.1':{$regex:config.disberse_admin_address,$options:'$i'}},{'returnValues.0':{$regex:project_owner,$options:'$i'}}]},
                           ]}
*/
//                           {$or:[{'returnValues.0': /this_user.address/i},{'returnValues.1': /this_user.address/i}]}
                       ]},
                       [],{sort:{blockNumber:-1}},
                       function(err,events) {
              if(err) 
              {
                console.log("err: " + err);
                res.render('pages/project', data);
              }
              else 
              {	
		// set the initial project balance for calculation

                for(i=0; i<events.length; i++)
                {
//console.log(events[i].returnValues[0] + " " + events[i].event);
                  var event = events[i].toObject();

/*
                  if(event.event == 'Transfered')
                  {
                    orgs[event.returnValues[0].toLowerCase()];
                    orgs[event.returnValues[1].toLowerCase()];
console.log(event.blockNumber + " from  " + orgs[event.returnValues[0].toLowerCase()]);
console.log(event.blockNumber + " to " + orgs[event.returnValues[1].toLowerCase()]);
                  }

console.log(event.blockNumber);
console.log(event.returnValues[0]);
console.log(orgs[event.returnValues[0].toLowerCase()]);
console.log(event.returnValues[1]);
console.log(orgs[event.returnValues[1].toLowerCase()]);
console.log(event.returnValues[2]);
console.log(orgs[event.returnValues[2].toLowerCase()]);
//console.log(this_user.address);
//console.log("owner :: " + JSON.stringify(event));
console.log("");
*/   
//		  console.log(event);
//		  console.log(event.event + " :: " + event.returnValues);
 
                  event.project_name = project_name;
			
		  event.returnValues.value = Number(event.returnValues.value).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');   
 
                  if(event.event == 'Deposit')// && event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase())
                  {
//                    if(event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase())
//                      console.log("deposit " + event.returnValues[0].substring(2).toLowerCase() + " " + this_user.address.toLowerCase());

                    if(event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase())
                    {
                      current_balance += Number(event.returnValues[1]); 
                    }
		    
                    event.project_ref = web3.utils.toAscii(event.returnValues[2]);
                    event.event = "Issue";

                    event.project_address_from = event.returnValues[0];
                    event.project_address_to = event.returnValues[1] || "Disberse";
                    event.project_address_to = "Disberse";

                    event.project_address_to = event.returnValues[0];
                    event.project_address_from = "Disberse";


//                    event.project_address_to = event.returnValues[0];
//                    event.project_address_from = "Disberse";
                  }
                  else if(event.event == 'Transfered' && event.returnValues[1].toLowerCase() == config.disberse_admin_address.toLowerCase())
                  {
                    event.event = "Redeemed";
                    event.event_out = "Redeemed";

                    data.projects.project_redeemed = (+data.projects.project_redeemed_raw + +event.returnValues[2]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');

                    data.projects.project_redeemed_raw = +data.projects.project_redeemed_raw + +event.returnValues[2];
//                    data.projects.project_balance = Number(+data.projects.project_total_raw - +data.projects.project_redeemed).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                    data.projects.project_balance = Number(+data.projects.project_total_raw - +data.projects.project_redeemed).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');

                    if(event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase())
                      current_balance -= event.returnValues[2]; 

                    event.project_ref = web3.utils.toAscii(event.returnValues[3]);
                    event.project_address_to = event.returnValues[1] || "Disberse";
                    event.project_address_from = event.returnValues[0];
                    event.project_address_to = "Disberse";
                  }
//                  else if(event.event == 'Transfered' && (event.returnValues[1].substring(2).toLowerCase() == this_user.address.toLowerCase() || event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase()))
                  else if(event.event == 'Transfered')
                  {
                    // transfered to this_user.address
                   event.event_out = "Sent";
                   if(event.returnValues[1].substring(2).toLowerCase() == this_user.address.toLowerCase() || event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase())
                     if(event.returnValues[1].substring(2).toLowerCase() == this_user.address.toLowerCase())
                       current_balance += Number(event.returnValues[2]); 
                     else 
                       current_balance -= Number(event.returnValues[2]); 
                    
		    event.project_ref = web3.utils.toAscii(event.returnValues[3]);
                    event.project_address_from = event.returnValues[0];
                    event.project_address_to = event.returnValues[1];
//console.log(event.project_address_from + " -> " + event.project_address_to);
//console.log(event.returnValues);
//console.log(event.returnValues[0]);
//console.log(event.returnValues[1]);
//console.log(orgs[event.project_address_from.toLowerCase()]);
//console.log(orgs[event.project_address_to.toLowerCase()]);
                  }
console.log(" ");

//		  console.log(event.event + " :: " + event.returnValues[0]);

    
                  event.project_balance = Number(project_balance).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
   

//              project.balance = Number(project_balance[i]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
//              project.amount = Number(project.amount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'); 

//console.log("froom :: " + event.project_address_from);
//console.log("tooo :: " + event.project_address_to);

                  var addr_from;
                  var addr_to;
                  if(event.project_address_from)
                    addr_from = event.project_address_from.toLowerCase();
                  if(event.project_address_to)
                    addr_to   = event.project_address_to.toLowerCase();
//console.log(addr_from + " :: " + addr_to);
                  
                  if(event.event == 'Issue') {
                    event.event_out = "Issued";
                    event.org_to = orgs[addr_to] || "";
                    event.org_from = "Disberse";
                  } else {
                    event.org_from = orgs[addr_from] || "";
                    event.org_to = orgs[addr_to] || "Disberse";
                  }
  
                  event.timestamp = timestamp[event.blockNumber];

                  if(event.event == 'Deposit' && event.returnValues[0].substring(2).toLowerCase() != this_user.address.toLowerCase())
                  {
//console.log("save me from this hell");
//console.log(event.returnValues[0].substring(2).toLowerCase());
//console.log(this_user.address.toLowerCase());

//                    delete events['d'];
//                    event = {};
                  }

                  events[i] = event;
                }
                data.events = events;

console.log(data.projects.project_redeemed);

                if(data.projects.project_balance == 'NaN') {
                  var this_redeemed = data.projects.project_redeemed_raw;
                  var tmp = data.projects.project_total_raw;
                  data.projects.project_balance = Number(+tmp - +this_redeemed).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                }

                if(!data.projects.project_redeemed) {
console.log(data.projects.project_redeemed);
                  data.projects.project_redeemed = Number(0).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                }

                if(!data.projects.project_balance) {
console.log(data.projects.project_balance);
                  data.projects.project_balance = data.projects.project_total;
                }
    
//                data.projects.project_balance = event.project_balance;
//                data.projects.project_balance = Number(data.projects.project_total) + Number(data.projects.project_redeemed);//(+data.projects.project_total - +data.projects.project_redeemed).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                data.projects.current_balance = current_balance.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
   
                res.render('pages/project', data);
              }
            });
          }
        });
      });
    });
  });
  });
}


/*---------------------------------------------------------------------*/
function get_my_balance_for_this_project(id, project, callback) {

  console.log("Get my balance for this project: " + project);


  if(!project)
    callback("No project specified");
  else
  {
    var project_ref_hex = web3.utils.fromAscii(project);
    var project_balance = 0;

    User.findOne({_id:id},{},function(err,this_user) {
      Event.find({$and:[
                         {$or:[
                             {'returnValues.2': project_ref_hex},
                             {'returnValues.3': project_ref_hex},
                           ]},
                           {flag:{$not:/^error$/}},
                 ]}, function(err, events) {
         if(err) console.log("err: " + err);

         for(var i=0; i<events.length; i++)
         {
           var event = events[i].toObject();
           if(event.event == 'Deposit'){
             if(event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase()) {
               project_balance += Number(event.returnValues[1]); 
             }
           }
           else if(event.event == 'Transfered' && event.returnValues[1].toLowerCase() == config.disberse_admin_address.toLowerCase()){

             if(event.returnValues[1].substring(2).toLowerCase() == this_user.address.toLowerCase())
               project_balance += Number(event.returnValues[2]); 
             else 
               if(event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase()) 
                 project_balance -= Number(event.returnValues[2]); 
           }
           else if(event.event == 'Transfered' && (event.returnValues[1].substring(2).toLowerCase() == this_user.address.toLowerCase() || event.returnValues[0].substring(2).toLowerCase() == this_user.address.toLowerCase())) {
             // transfered to this_user.address
             if(event.returnValues[1].substring(2).toLowerCase() == this_user.address.toLowerCase())
               project_balance += Number(event.returnValues[2]); 
             else 
               project_balance -= Number(event.returnValues[2]); 
           }

//           project_balance = Number(project_balance).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
           console.log(project_balance);
         }

         Project.findOne({project_ref:project}, function(err, project) {
           if(err) console.log("line 688 err :: " + err);

           callback("", project_balance, project.currency);
         });
      });
    });
  }
}

/*---------------------------------------------------------------------*/
function projects_page(req, res, decoded) {

  var page_title = "Projects";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);


  var project_link = [];
  var projects = [];

  getUserOrg(id).then(function(account_org) {

  
  var data = {
               moment:moment,
               page_title:page_title,
               "my_var":err,
               address:address,
               username:email,
               account_org:account_org,
	       balance:balance,
               menu0:menu0,
               menu1:menu1,
               label:label,
               project_link:project_link,
               projects:projects,
               id:id,
             };

  User.findOne({_id:id},{},function(err,this_user) {
    console.log(this_user.address);
    Project.find({$or:[{user_id:id},
                      {addresses:{$all:[new RegExp(this_user.address, 'i')]}}
                 ]},
                 [],
                 {}, function(err, projects) {
      if(err)
      {
        console.log(err);
        res.render('pages/projects', data);
      }
      else
      {
        var projects_refs_hex = [];
        var project_ref_hex;

        for(x=0; x<projects.length; x++)
        {
          var project = projects[x];

          var project_ref_hex = web3.utils.fromAscii(project.project_ref);
//console.log("1:" + project.project_ref);
//console.log("1:" + project_ref_hex);

          projects_refs_hex.push({'returnValues.2': project_ref_hex}); 
          projects_refs_hex.push({'returnValues.3': project_ref_hex}); 

          data.projects.push(project);
        }
//console.log(projects_refs_hex);

        Event.find({$or:projects_refs_hex},
//                   {
//                     $or:[
//                       {'returnValues.2': project_ref_hex},
//                       {'returnValues.3': project_ref_hex},
//                     ]
//                   },
                   [],{},
                   function(err,events) {
          if(err) 
          {
            console.log("err: " + err);
            res.render('pages/projects', data);
          }
          else 
          {
            var project_balance = [];

            for(i=0; i<data.projects.length; i++)
            {
              var project = data.projects[i].toObject();

//              console.log("data.projects -> " + data.projects[i]);

              project_balance[i] = 0;

              for(j=0; j<events.length; j++)
              {
                var event = events[j].toObject();
                var this_project_ref = '';

//		console.log(event.returnValues);

                if(event.event == 'Deposit')
                  this_project_ref = event.returnValues[2];
                else if(event.event == 'Transfered')
                  this_project_ref = event.returnValues[3];

                var this_project_ref_hex = web3.utils.toAscii(this_project_ref);

                if(this_project_ref_hex == data.projects[i].project_ref)
                {
                  if(event.event == 'Deposit')
                    project_balance[i] += event.returnValues[1];  
                  else if(event.event == 'Transfered')
                  {
                    project_balance[i] -= event.returnValues[2];  
                  }
                  else if(event.event == 'Redeemed')
                  {
                    project_balance[i] -= event.returnValues[2];
                  }
                }
              }
              project.balance = Number(project_balance[i]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
              project.amount = Number(project.amount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
              data.projects[i] = project;
            }

	console.log(data.projects);
 
          res.render('pages/projects', data);
          }
        });    
      }
    });
  });
  });
}

/*---------------------------------------------------------------------*/

/*---------------------------------------------------------------------*/

function home_page(req, res, decoded) {

  var page_title = "Dashboard";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;
  var account_org = decoded.org;
//console.log(decoded)erOrg;



  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var promise = new Promise(function(resolve, reject) {
    Currencies.find({},[],{sort:{type:1}},function(err, projects) {
      if(err) reject(err);
      else resolve(projects);
    });
  });

  User.findOne({_id:id},{},function(err,this_user) {
   console.log(this_user);

    get_user_balance(decoded.id, function(error, balance) {

      console.log(balance);

    get_user_balance_all(decoded.id, decoded.address, function(err, currencies) {
console.log(err);
//process.exit(1);

  
      if(error)
        balance = error;

        console.log("balance: " + balance);
  
        var formated_balance_gbp = balance;
        var formated_balance_eur = balance;
        var formated_balance_usd = balance;
  
        var formated_balance = Number(balance).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
  
        var rate_link = [{value:'view fx rates',link:'?action=rates'}];
        var rates = [{balance:formated_balance_gbp,type:'GBP'}];
        rates.push({balance:formated_balance_eur,type:'EUR'});
        rates.push({balance:formated_balance_usd,type:'USD'});
  
        var history_link = [{value:'view tx history',link:'?action=tx'}];
        var history = [];
  
        var project_link = [{value:'view projects',link:'?action=projects'}];
        var projects = [];
  
        var events_link = [{value:'view events',link:'?action=events'}];
        var events = [];
  
        var data = {
                     page_title:page_title,
                     "my_var":err,
                     address:address,
                     username:email,
                     account_org:this_user.org,
    		   balance:formated_balance,
                     menu0:menu0,
                     menu1:menu1,
                     events:events,
                     events_link:events_link,
                     label:label,
                     rate_link:rate_link,
                     rates:rates,
                     history_link:history_link,
                     history:history,
                     project_link:project_link,
                     projects:projects,
                     currencies:currencies,
                     'id':id
                   };

        if(err) 
          res.render('pages/home', data);
        else {
///*
    
        var project_type = {};
  
        Project.find({},function(err, projects) {
          if(err)
          {
            console.log(err);
            res.render('pages/home', data);
          }
          else
          {
            for(i=0; i<projects.length; i++)
            {
              var project =  projects[i].toObject();
              project_type[project.project_ref] = project.currency; 
            }
  
            User.findOne({_id:id},{},function(err,this_user) {
              Event.find({$or:[{'returnValues.0':new RegExp(this_user.address, 'i')},{'returnValues.1':new RegExp(this_user.address, 'i')}]},[],{sort:{blockNumber:-1}},function(err, events) {
                if(err)
                {
                  console.log(err);
                  res.render('pages/home', data);
                }
                else
                {
                  for(i=0; i<events.length; i++)
                  {
                    var event = events[i].toObject();
    
                    event.value_code = "GBP";
    
                    if(event.event == 'Transfered')
                    {
                      var project_ref = web3.utils.toAscii(event.returnValues[3]);
                      event.value_code = project_type[project_ref];
    
                      if(event.returnValues['1'].toLowerCase() == config.disberse_admin_address.toLowerCase())
                      {
                        event.event = "Redeem";
                      }
                      else
                      {
                        event.event = "Transfer";
                      }
    //console.log(event.returnValues['1']);
                    }
                    else if(event.event == 'Deposit')
                    {
                      var project_ref = web3.utils.toAscii(event.returnValues[2]);
                      event.value_code = project_type[project_ref];
                    }
    
                    event.value = event.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    
                    data.events.push(event);
                  }    
      
                  Project.find({$or:[{user_id:id},
                                     {addresses:{$all:[new RegExp(this_user.address, 'i')]}}
                                ]},
                                [],
                                {},
                                function(err, projects) {
                    if(err)
                      console.log(err);
                    else
                    {
                      for(i=0; i<projects.length; i++)
                      {
                        var project = projects[i];
                        data.projects.push(project);
                      }    
          
                      res.render('pages/home', data);
                    }
                  });
                }
              });
            });
          }
        });
//*/      
        }
      });
    });
  });
}

/*---------------------------------------------------------------------*/

function authed_token_main(req, res) {

  console.log('authed_token_main')


  var action = req.body.action || req.query.action;
//console.log(req.body);
//console.log(req.query);

  var decoded = jwt.verify(authed_token, config.secret, function (err, decoded)   {
    if(err) 
    {
//console.log(decoded);
      console.log(err);
      localStorage.setItem('token', '');
      req.session.token["sessionData"] = "";
      res.status(400).render('pages/login_form', {"error":"Token Timeout",org:'',email:'',password:''});
      // set the status so we don't get proxy timeout
//      res.status(400).send('Token timeout');
//      return res.status(400).send('Token timeout');
    } else {

//        User.findOne({address:decoded.address},function(err, this_user) {
//          console.log(this_user);

    	  get_user_balance(decoded.id, function(error, balance) {

	  // set the balance in the decoded object
//	    decoded.balance = balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
     		decoded.balance = Number(balance).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');

    		console.log("balance is " + decoded.balance  )


	    	if(err)
	    	{
	      		console.log("ERR: " + err);
	      		localStorage.setItem('token', '');
	      		req.session.token["sessionData"] = "";
	      		res.render('pages/login_form', {"error":err,org:'',email:'',password:''});
	    	}
	    	else if(action == 'sendtest')
                {
    var mail_data = {};
    mail_data.to = "gav@eh7.co.uk";
    mail_data.from = decoded.email;
    mail_data.subject = "Disberse sendtest";
    mail_data.body = "Hi Admin,\n\n Reset account email:" + decoded.email + ",\n\nIf you think it is okay? Do some manual checks.\n\nThanks.";
    send_email_forgot(res, "", mail_data);
                  res.send('sendtest');
                }
	    	else if(action == 'tx')
	    	{
	      		tx_page(req, res, decoded);
	    	}
	    	else if(action == 'projects')
	    	{
	      		projects_page(req, res, decoded);
	    	}
	    	else if(action == 'project')
	    	{
	      		project_page(req, res, decoded);
	    	}
	    	else if(action == 'rates')
	    	{
	     	 	rates_page(req, res, decoded);
	    	}
	   	else if(action == 'support')
	    	{
	      		support_page(req, res, decoded);
	    	}
	    	else if(action == 'settings')
	    	{
	      		settings_page(req, res, decoded);
	    	}
	    	else if(action == 'deposit')
	    	{
	      		deposit_page(req, res, decoded);
	    	}
	    	else if(action == 'send')
	    	{
	      		send_page(req, res, decoded);
	    	}
	    	else if(action == 'send_chk')
	    	{
	      		send_chk_page(req, res, decoded);
	    	}
	    	else if(action == 'redeem')
	    	{
	      		redeem_page(req, res, decoded);
	    	}
	    	else if(action == 'redeem_chk')
	    	{
	      		redeem_chk_page(req, res, decoded);
	    	}
	    	else if(action == 'request')
	    	{
	      		request_page(req, res, decoded);
	    	}
	    	else if(action == 'key')
	    	{
	      		key_page(req, res, decoded);
	    	}
	    	else if(action == 'overview')
	    	{
                  if(decoded.email == "info@eh7.co.uk" || 
                     decoded.email  == "hello@disberse.com" || 
                     decoded.email == "a@a.com"
                    )
	      		overview_page(req, res, decoded);
	    	}
	    	else if(action == 'jobs')
	    	{
                  if(decoded.email == "info@eh7.co.uk" || 
                     decoded.email  == "hello@disberse.com" || 
                     decoded.email == "a@a.com"
                    )
	      		jobs_page(req, res, decoded);
	    	}
	    	else
	    	{
	    	  	home_page(req, res, decoded);
	    	}
          });
//  	});
      }
   });
}

/*---------------------------------------------------------------------*/
function overview_page(req, res, decoded) {

  var page_title = "Overview of network";

  var error = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var sub = req.body.sub || req.query.sub;
  var ref = req.body.ref || req.query.ref;

  var out = "";

  var data = {
               "my_var":error,
               address:address,
               page_title:page_title,
               username:email,
	       balance:balance,
               menu0:menu0,
               menu1:menu1,
               label:label,
               'id':id
             };

  var jobs = []; 

  var errors = [];

  var users = [];

  User.find({},function(err, users) {
    for(i=0;i<users.length;i++){
      var user = users[i];
      users[user.address] = user;
      console.log(users[user.address]);
    }

    
    var project_type = {};
    var project_start_block = {};

//    Project.find({addresses:{$exists: true, $not: {$size: 0}}},function(err, projects) {
    Project.find({},function(err, projects) {

      for(i=0; i<projects.length; i++) {
        var project =  projects[i].toObject();

        project_type[project.project_ref] = project.currency; 
/*
        if(!project_start_block[project_ref]){
          project_start_block[project_ref] = event.blockNumber;
          projects[i].startBlock = event.blockNumber;
        }
*/

//console.log(project.project_ref);
//if(project.project_ref == 'ab6ac6eb') console.log(project_type[project.project_ref]);
//console.log(projects[i].project_ref);
//        console.log(project.currency + " :: " + project_type[project.project_ref])
      }

      Event.find({$and:[
                   {blockNumber:{$exists: true}},
                   {"event" : {$ne:"NewType"}}

                 ]},[],{},function(err, events) {


//      Event.find({},{},[],{sort:{blockNumber:-1}},function(err, events) {
//        if(err)
//	  console.log("ERR: " + err);

        for(i=0; i<events.length; i++)
        {
          var event = events[i].toObject();

          if(!project_start_block[project_ref]){
            project_start_block[project_ref] = event.blockNumber;
          }

//console.log(event.returnValues);
//process.exit(0);
          if(event.returnValues.project_ref) 
            if(event.returnValues.project_ref.search(/^0x/) == 0) {

              var project_ref = web3.utils.toAscii(event.returnValues.project_ref);
              events[i].value_code = project_type[project_ref];

            }  

          if(event.returnValues['1'].toLowerCase() == config.disberse_admin_address.toLowerCase())
          {
            events[i].event = "Redeem"
          }

        }

        for(var i=0; i<projects.length; i++) {
          if(!project_start_block[projects[i].project_ref]) 
            project_start_block[projects[i].project_ref] = 0;
          projects[i].startBlock = Number(project_start_block[projects[i].project_ref]);
//console.log(projects[i].name + " :: " + projects[i].startBlock);
//          console.log(project_start_block[projects[i].project_ref])
        }
//        console.log(project_start_block);

        data.jobs = jobs;
        data.errors = errors;
        data.txs = events;
        data.projects = projects;
        res.render('pages/overview', data);

      });
    });
  });
}

/*---------------------------------------------------------------------*/
function jobs_page(req, res, decoded) {

  var page_title = "Jobs";

  var error = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var sub = req.body.sub || req.query.sub;
  var ref = req.body.ref || req.query.ref;

  var out = "";

  var data = {
               "my_var":error,
               address:address,
               page_title:page_title,
               username:email,
	       balance:balance,
               menu0:menu0,
               menu1:menu1,
               label:label,
               'id':id
             };

  var jobs = []; 

  var errors = [];

  var users = [];

  User.find({},function(err, users) {
    for(i=0;i<users.length;i++){
      var user = users[i];
      users[user.address] = user;
      console.log(users[user.address]);
    }

    Project.find({status:'new'},function(err, projects) {

      if(sub == 'auth_deposit')
      {
        errors.push("Deposit Authed for " + ref + " Thanks");
        data.errors = errors;
        for(i=0; i<projects.length; i++)
        {
          var project =  projects[i].toObject();
          if(project.status == 'new')
            project.status = "New Deposit";
          if(project.project_ref != ref)
            jobs.push({ref:project.project_ref,name:project.name,status:project.status});
        }
        data.jobs = jobs;
        auth_deposit_for_project(res, ref, sub, data);
//      res.render('pages/jobs', data);
      }
      else
      {
        for(i=0; i<projects.length; i++)
        {
          var project =  projects[i].toObject();
          var user = users[project.owner_address];
console.log(user);
console.log(project.amount);
//console.log(project.owner_address);
//console.log(users[project.owner_address]);
          if(project.status == 'new')
            project.status = "New Deposit";
          jobs.push({
            ref:project.project_ref,
            name:project.name,
            status:project.status,
            amount:project.amount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'),
            org:user.org,
            currency:project.currency,
          });
        }
        data.jobs = jobs;
        data.errors = errors;
        res.render('pages/jobs', data);
      }
    });
  });
}

/*---------------------------------------------------------------------*/
function auth_deposit_for_project(res, ref, sub, data) {

  console.log("auth the deposit for " + ref);

  data.errors = [];

  Project.findOne({project_ref:ref},function(err, project) {

    console.log(project.name + " -- " + project.owner_address); 

    var amount = project.amount;
    var project_ref = project.project_ref;
    var project_name = project.name;
    var project_currency = project.currency;
    var owner_address = project.owner_address;

    Currencies.findOne({type:project.currency},[],{},function(err, currency) {
      if(err) console.log(err);

      var type_id = currency.id;

      User.findOne({address:owner_address},function(err, this_user) {

        console.log(this_user.email + " -- " + this_user.address); 

        var address_from = this_user.address;
        var key_password = this_user.password + this_user.pincode + this_user.org;
        var keyObject = keythereum.importFromFile(address_from, path.join(__dirname + '/'));
        var privateKey = keythereum.recover(key_password, keyObject);

        var disberse_abi = config.abi;
        var owner_address = config.owner_address;
        var contract_address = config.contract_address;
        var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

        web3.eth.getGasPrice(function(err, gasPrice) {
          if(err) 
            console.log(err); 
  
          console.log(gasPrice);

          var gasPriceHex = web3.utils.toHex(gasPrice);
          var gasLimitHex = web3.utils.toHex(2000000);

          Disberse.methods.deposit(amount,web3.utils.fromAscii(project_ref),type_id).estimateGas(function(error, gasAmount){
            if(error)
              console.log(error);
            else
              console.log("gasAmount: " + gasAmount);
          });

          web3.eth.getTransactionCount(this_user.address, function(err,nonce) {
            if(err)
              console.log(err); 
            else 
            {
              var nonceHex = web3.utils.toHex(nonce);
              var transValue = web3.utils.toHex(0);


              var lodash = require('lodash');
              var this_function_abi = lodash.find(config.abi, { name: 'deposit' });
              var payloadData = [amount,web3.utils.fromAscii(project_ref),type_id];
              var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData);
           
              var thisTx = {
                             from: "0x"+this_user.address,
                             to: contract_address,
                             value: transValue,
                             data: txPayloadData,
                             nonce: nonceHex,
                             gasPrice: gasPriceHex,
                             gasLimit: gasLimitHex,
                           };
//console.log(thisTx);

               var signedTx = new Tx(thisTx);
               signedTx.sign(privateKey);
               var serializedTx = signedTx.serialize();
//console.log("------------------------");
//console.log(serializedTx);
  
               web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), function(err,hash){
                if(err)
                {
                  console.log(err);
                  data.errors.push(err);
                  res.render('pages/jobs', data);
                }  
                else
                {
/*
                  var mail_data = {};
                  var decoded = {};
                  decoded.email = this_user.email;
                  mail_data.subject = "Disberse Transaction Receipt - Deposit";
                  mail_data.body = "Hi " + this_user.email + ",\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                  send_email(res, data, decoded, mail_data);
*/
                  var mail_data = {};
                  mail_data.to = this_user.email;
//                  mail_data.from = "support@eh7.co.uk";
                  mail_data.from = "hello@disberse.com";
                  mail_data.subject = "Disberse Transaction Receipt - Deposit";
                  mail_data.body = "Hi " + this_user.email + ",\n\nYour deposit of " + project_currency + " " + amount  + " for project \"" + project_name + "\" was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                  send_email_forgot(res, "", mail_data);

                  var mail_data = {};
                  mail_data.to = config.admin_emails;
//                  mail_data.from = "support@eh7.co.uk";
                  mail_data.from = "hello@disberse.com";
                  mail_data.subject = "Disberse Transaction Receipt - Deposit";
                  mail_data.body = "Hi admin,\n\nThe deposit  of "  + project_currency + " " + amount  + " for  project \"" + project_name + "\" by user \"" + this_user.email + "\" was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                  send_email_forgot(res, "", mail_data);
  
                  update_deposit_authed(project);
  
                  console.log(hash);
                  //data.errors.push("Thank You - your transaction is being processed (" + hash + ")");
//                data.errors.push("Thank You - your transaction is being processed ");
                  data.errors.push("Thank you, your transaction is being processed ");
                  res.render('pages/jobs', data);
                }
              });
            }
          });
        });
      });
    });
  });
}
/*---------------------------------------------------------------------*/
function update_deposit_authed(project) {

  Project.updateOne(
    {project_ref:project.project_ref},
    {$set:{
      status:'authed',
    }},
    {upsert: true}, function(error,result) {
      if(error)
        console.log("Project.updateOne: " + error);
      else
      {
        console.log(JSON.stringify(result));
      }
    
  });
}
/*---------------------------------------------------------------------*/


function key_page(req, res, decoded) {

  var error = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var out = "";

  User.findOne({_id:id},function(err, this_user) {
    console.log("found ok " + this_user);

    var password = this_user.password + this_user.pincode + this_user.org;

    if(this_user.address)
    {
       out = "keystore: " + this_user.address;
       var keyObject = keythereum.importFromFile(this_user.address, config.app_path);
       var privateKey = keythereum.recover(password, keyObject);
//       out += "key: " + privateKey.toString('hex');

    }
    else
    {

      var params = { keyBytes: 32, ivBytes: 16 };
      var dk = keythereum.create(params);
      var kdf = "pbkdf2";
      var options = {
        kdf: "pbkdf2",
        cipher: "aes-128-ctr",
        kdfparams: {
            c: 262144,
            dklen: 32,
            prf: "hmac-sha256"
        }
      };
      var keyObject = keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options);
//      out = JSON.stringify(keyObject);
//      console.log(keyObject);

      var keyFile = keythereum.exportToFile(keyObject);

      console.log("keyObject.address: " + keyObject.address);
      out = "newKey: " + keyObject.address;

      User.findOneAndUpdate({_id:id},{$set:{address:keyObject.address}}, function(err, user) {
        if (err) throw err;
        console.log("USER UPDATE: " + user);
      });
    }

  res.render('pages/key', {
                            "my_var":error,
                             username:email,
		 	     balance:balance,
                             menu0:menu0,
                             menu1:menu1,
                             label:label,
                             key:out,
                             'id':id
                           });
  });
}

/*---------------------------------------------------------------------*/

function request_page(req, res, decoded) {

  var page_title = "Request";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var errors = [];

  var project_ref = req.body.project_ref || ""; 
  var amount      = req.body.amount || ""; 
  var address_to  = req.body.address_to || ""; 

  if(!project_ref)
  {
    errors.push("Select Project");
  }
  if(!amount)
  {
    errors.push("Enter Amount");
  }
  if(!address_to)
  {
    errors.push("Enter Address To");
  }

  var data = {
               page_title:page_title,
               "my_var":err,
               errors:errors,
               project_ref:project_ref,
               amount:amount,
               address_to:address_to,
               username:email,
	       balance:balance,
               menu0:menu0,
               menu1:menu1,
               label:label,
               'id':id
             };


  if(errors.length > 0)
    res.render('pages/request', data);
  else
    request_page_send(req, res, decoded, data, project_ref, amount, address_to);
}

/*---------------------------------------------------------------------*/

function request_page_send(req, res, decoded, data, project_ref, amount, address_to) {

  console.log("request_page_send");

// request(address _to, uint _amount, bytes8 _ref)

  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  
  var project_key = project_ref;
  var project_ref = web3.utils.fromAscii(project_key);

  User.findOne({_id:id},function(err, this_user) {
    if(err)
    {
      data.errors.push(err);
      res.render('pages/request', data); 
    }
    else
    {
      var address_from = this_user.address;
      var key_password = this_user.password + this_user.pincode + this_user.org;

      var keyObject = keythereum.importFromFile(address_from, path.join(__dirname + '/'));
      var privateKey = keythereum.recover(key_password, keyObject);

      var disberse_abi = config.abi;
      var owner_address = config.owner_address;
      var contract_address = config.contract_address;
      var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

      web3.eth.getGasPrice(function(err, gasPrice) {
        if(err) 
          console.log(err); 

//        console.log(gasPrice);

        var gasPriceHex = web3.utils.toHex(gasPrice);
        var gasLimitHex = web3.utils.toHex(2000000);

        Disberse.methods.request(address_to,amount,project_ref).estimateGas(function(error, gasAmount){
          if(error)
            console.log(error);
          else
            console.log("gasAmount: " + gasAmount);
        });

        web3.eth.getTransactionCount(this_user.address, function(err,nonce) {
          if(err)
            console.log(err); 
          else 
          {
            var nonceHex = web3.utils.toHex(nonce);
            var transValue = web3.utils.toHex(0);


            var lodash = require('lodash');
            var this_function_abi = lodash.find(config.abi, { name: 'request' });
            var payloadData = [address_to,amount,project_ref];
            var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData);
           
            var thisTx = {
                           from: "0x"+this_user.address,
                           to: contract_address,
                           value: transValue,
                           data: txPayloadData,
                           nonce: nonceHex,
                           gasPrice: gasPriceHex,
                           gasLimit: gasLimitHex,
                         };
//console.log(thisTx);

             var signedTx = new Tx(thisTx);
             signedTx.sign(privateKey);
             var serializedTx = signedTx.serialize();
//console.log("------------------------");
//console.log(serializedTx);
  
             web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), function(err,hash){
              if(err)
              {
//                console.log(err);
                data.errors.push(err);
                res.render('pages/request', data);
              }  
              else
              {

                var mail_data = {};
                mail_data.subject = "Disberse Transaction Receipt - Request";
                mail_data.body = "Hi " + email + ",\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                send_email(res, data, decoded, mail_data);

                console.log(hash);
                res.render('pages/request', data);
               }
             });
          }
        });
      });
//      res.render('pages/request', data);
    }
  });

}
/*---------------------------------------------------------------------*/
function redeem_chk_page(req, res, decoded) {

  var page_title = "Redeem Tx Confirmation";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var currencies = config.currencies;

  var data = {
    page_title:page_title,
    error:'',
    errors:[],
    address:address,
    username:email,
    balance:balance,
    currencies:currencies,
    menu0:menu0,
    menu1:menu1,
    label:label,
    'id':id
  };

  var hash = req.body.hash || req.query.hash;

  data.txhash = hash;

  web3.eth.getTransaction(hash).then(function(txHash){
    console.log(txHash);
    if(txHash.blockNumber > 0) {
      data.errors.push("Your tx blockNumber is " + txHash.blockNumber);
      data.txhashBlockNumber = txHash.blockNumber;
    } else {
//      data.errors.push("tx NOT completed reload " + txHash.blockNumber);
      data.errors.push("tx NOT completed please wait!!!");
    }
    data.errors.push("The tx hash is "+ hash);

    res.render('pages/redeem_tx', data);
  });
}

/*---------------------------------------------------------------------*/
function redeem_page(req, res, decoded) {

  var page_title = "Redeem";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var currencies = config.currencies;

  var errors = [];

  var project = req.body.project || "";
  var project_ref = req.body.project_ref || "";
  var amount      = req.body.amount || "";
  var purpose     = req.body.purpose || "";

  get_my_balance_for_this_project(id, project, function(err, balance, balance_type) {
    console.log("this p bal: " + balance + " " + balance_type);

    if(!project)
    {
      errors.push("Select Project");
    }
    if(amount == '0')
    {
      error = "Enter amount more than 0";
      errors.push(error);
    }
    if(amount == '')
    {
      errors.push("Enter Amount");
    }
    if(!purpose)
    {
//      errors.push("Select Redemption method");
      errors.push("Enter tracking code");
    }
    if(Number(amount) > 0 && Number(amount) > Number(balance))
    {
      error = "The balance for this wallet is " + Number(balance).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + " " + balance_type;
      errors.push(error);
      var formatted_amount = Number(amount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + " " + balance_type;
      error = "Funds not available in wallet for amount (" + formatted_amount + ") entered";
      errors.push(error);
    }

    var curreny_type = balance_type || "GBP";

    getUserOrg(id).then(function(account_org) {
  
      data = {
             page_title:page_title,
             "my_var":err,
             errors:errors,
             address:address,
             username:email,
             balance:balance,
             account_org:account_org,
             currencies:currencies,
             currency:curreny_type,
             menu0:menu0,
             menu1:menu1,
             label:label,
             project_ref:project_ref,
             project_options:[],
             amount:amount,
             'id':id
           };



    User.findOne({_id:id},function(err, this_user) {
      var user_address = this_user.address;
      Project.find({$and:[{$or:[{user_id:id},{addresses:{$all:[new RegExp(this_user.address, 'i')]}}]},{status:{$ne:"complete"}}]},function(err, projects) {
        var selected = ""; 
        for(i=0; i<projects.length; i++)
        {
          if(projects[i].project_ref == req.body.project) selected = "selected";
          var project = projects[i];
//console.log(project);
//console.log("----------------------------");
          data.project_options.push({
  				    currency:project.currency,
                                      ref:project.project_ref,
                                      name:project.name, 
                                      selected:selected
                                    });
        }

        if(errors.length > 0)
          res.render('pages/redeem', data);
        else
          do_redeem(data, req, res, decoded, project_ref, amount, project.name, this_user); 
//        res.render('pages/redeem', data);

      });
    });
    });
  });
}

/*---------------------------------------------------------------------*/

function do_redeem(data, req, res, decoded, project_ref, amount, project, this_user)
{
  var project = project;
  var amount  = amount;
  
  var project_ref = web3.utils.fromAscii(req.body.project);

  var disberse_abi = config.abi;
  var owner_address = config.owner_address;
  var contract_address = config.contract_address;
  var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

  console.log("Do Redeem '" + project + "' " +amount);

  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;

  var address_to = config.disberse_admin_address; 
//"0xb88600aa4b10fe827213eb760835af55f46a0e36";
  var address_from = this_user.address;
  var key_password = this_user.password + this_user.pincode + this_user.org;

  var keyObject = keythereum.importFromFile(address_from, path.join(__dirname + '/'));

  var privateKey = keythereum.recover(key_password, keyObject);

  console.log(project + "'" + amount + "'"+ address_to +"'"+ address_from +"'"+ key_password + keyObject);
//  console.log(privateKey.toString('hex'));

  Currencies.findOne({type:data.currency},[],{},function(err, currency) {
    if(err) console.log(err);

    var type_id = currency.id;

  var this_address_from     = "0x" + address_from;
  var this_address_to       = address_to;
  var this_contract_address = "0x" + config.contract_address;

  web3.eth.getGasPrice(function(err, gasPrice) {
    if(err) {
      console.log(err); 
      res.render('pages/redeem', data);
    }
    else 
    {
      var gasPriceHex = web3.utils.toHex(gasPrice);
      var gasLimitHex = web3.utils.toHex(2000000);

      Disberse.methods.transfer(this_address_to,amount,project_ref,type_id).estimateGas(function(error, gasAmount){
        if(error)
          console.log(error);
        else
          console.log("gasAmount: " + gasAmount);
      });


      web3.eth.getBalance(this_address_from, function(error,out) { 
        if(error)
          console.log(err); 
        else 
        {
          console.log("Balance for " + this_address_from + " is " +out); 
        } 
      });


      web3.eth.getTransactionCount(address_from, function(err,nonce) {
        if(err)
        {
          console.log(err); 
          res.render('pages/redeem', data);
        }
        else 
        {
          var nonceHex = web3.utils.toHex(nonce);
          var transValue = web3.utils.toHex(0);

          var lodash = require('lodash');
          var this_function_abi = lodash.find(config.abi, { name: 'transfer' });
          var payloadData = [this_address_to,amount,project_ref,type_id];
          var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData);
           
          var thisTx = {
                         from: this_address_from,
                         to: contract_address,
                         value: transValue,
                         data: txPayloadData,
                         nonce: nonceHex,
                         gasPrice: gasPriceHex,
                         gasLimit: gasLimitHex,
                       };

           var signedTx = new Tx(thisTx);
           signedTx.sign(privateKey);
           var serializedTx = signedTx.serialize();


           web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), function(err,hash){
            if(err)
            {
//              console.log(err);
              data.errors.push(err);
              res.render('pages/redeem', data);
            }
            else
            {
/*
              var mail_data = {};
              mail_data.to = config.admin_emails;
//              mail_data.from = "support@eh7.co.uk";
              mail_data.from = "hello@disberse.com";
              mail_data.subject = "Disberse Transaction Receipt - Redeem";
              mail_data.body = "Hi " + email + ",\n\nThe redeem request was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
              send_email_forgot(res, "", mail_data);
*/

              Project.findOne({project_ref:req.body.project}, function(err, project) {
                if(err) console.log(err);
                User.findOne({_id:project.user_id}, function(err, user) {
                  if(err) console.log(err);
console.log(user);
                  var mail_data = {};
//                  mail_data.to = user.email;
                  mail_data.to = email;
//                  mail_data.from = "support@eh7.co.uk";
                  mail_data.from = "hello@disberse.com";
                  mail_data.subject = "Disberse Transaction Receipt - Redeem";
                  mail_data.body = "Hi " + email + ",\n\nThe redeem request from " + email + " for " + project.currency + " " + amount + " against project " + project.name + " was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                  send_email_forgot(res, "", mail_data);

                  var mail_data = {};
                  mail_data.to = config.admin_emails;
                  mail_data.from = "hello@disberse.com";
                  mail_data.subject = "Disberse Transaction Receipt - Redeem";
                  mail_data.body = "Hi " + user.email + ",\n\nThe redeem request from " + email + " for " + project.currency + " " + amount + " against project " + project.name + " was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                  send_email_forgot(res, "", mail_data);

/*
                  var mail_data = {};
                  mail_data.subject = "Disberse Transaction Receipt - Redeem";
                  mail_data.body = "Hi " + email + ",\n\nYour redeem request for " + project.currency + " " + amount + " against project " + project.name + " was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                  send_email(res, data, decoded, mail_data);
*/
                });
              });

              console.log(hash);
              //data.errors.push("Thank You - your transaction is being processed (" + hash + ")");
//              data.errors.push("Thank You - your transaction is being processed ");
              data.errors.push("Your transaction hash is " + hash);
              data.txhash = hash;
              res.render('pages/redeem_tx', data);
//              res.render('pages/redeem', data);
            }
          });
        }
      });
    }
  });
  });
}
/*---------------------------------------------------------------------*/

function deposit_page(req, res, decoded) {

  var page_title = "Deposit";

  var err = "";
  var errors = [];
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;
  var currencies = config.currencies;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var project_name = req.body.project_name || ""; 
  var project_code = req.body.project_code || "";
  var amount = req.body.amount || "";
  var currency = req.body.currency || "";

  if(currency == "") {
     errors.push("Select Currency");
     currency = "GBP";
  }
  if(amount == "") {
     errors.push("Enter Amount");
  }
  if(project_name == "") {
     errors.push("Enter Project Name");
  }
  if(project_code == "") {
     errors.push("Enter Project Code");
  }

  
  Currencies.find({},[],{sort:{type:1}},function(err, currencies) {
    if(err) console.log(err);

    getUserOrg(id).then(function(account_org) {

      var data = {
                   page_title:page_title,
                   errors:errors,
                   "my_var":err,
                   project_name:project_name,
                   project_code:project_code,
                   amount:amount,
      	           currencies:currencies,
                   currency:currency,
                   address:address,
                   username:email,
                   account_org:account_org,
	           balance:balance,
                   menu0:menu0,
                   menu1:menu1,
                   label:label,
                   'id':id
                 };

      if(errors.length == 0)
      {
//        res.render('pages/deposit', data);
        deposit_funds(res, req, decoded, data);
      }
      else  
        res.render('pages/deposit', data);

    });
  });
}


/*---------------------------------------------------------------------*/

function deposit_funds(res, req, decoded, data) {

  console.log("deposit funds");

  var errors = [];
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;

  // FOR LIVE SYSTEM
  // * Print out bank deposit details with transfer ref.
  // * wait for funds to be sent to account
  // * call smart contract to credit account with Disberse GBP 
  // with amount stored in db for address/project 

  // FOR DEV SYSTEM
  // * Print out bank deposit details with transfer ref.
  // * Call smart contract to credit account with Disberse GBP 
  // based on your input amount.

  var name = req.body.project_name; 
  var code = req.body.project_code;
  var amount = req.body.amount;
  var currency = req.body.currency;

  
  User.findOne({_id:id},function(err, this_user) {
    if(err)
    {
      data.errors.push(err);
      res.render('pages/deposit', data); 
    }
    else
    {
      var project_key = name + code;
      var project_ref = web3.utils.sha3(project_key).substring(2,10);

      var owner_address = this_user.address;

      var project_db = new Project({
                                     name: name,
                                     code: code,
                                     currency: currency,
                                     owner_address:owner_address,
                                     amount:amount,
                                     project_key:project_key,
                                     project_ref:project_ref,
                                     user_id:id,
                                     status:'new',
                                   });
      project_db.save(function(err, save_user) {
        if(err)
          console.log(err);
        else
          console.log(save_user);
      });

      data.errors.push("Thank you, your transaction is being processed ");
//      data.errors.push("Your Address: " + this_user.address);
//      data.errors.push("Project Currency: " + currency);
//      data.errors.push("Project Transfer Ref: " + project_ref);
//      data.errors.push("Sort code: 12-34-56");
//      data.errors.push("Account: 23415687");

//      data.errors.push("Call smart contract to credit account with Disberse GBP based on your input amount.");

/*
      var address_from = this_user.address;
      var key_password = this_user.password + this_user.pincode + this_user.org;
      var keyObject = keythereum.importFromFile(address_from, path.join(__dirname + '/'));
      var privateKey = keythereum.recover(key_password, keyObject);
//console.log(privateKey);

      var disberse_abi = config.abi;
      var owner_address = config.owner_address;
      var contract_address = config.contract_address;
      var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

      web3.eth.getGasPrice(function(err, gasPrice) {
        if(err) 
          console.log(err); 

        console.log(gasPrice);

        var gasPriceHex = web3.utils.toHex(gasPrice);
        var gasLimitHex = web3.utils.toHex(2000000);

        Disberse.methods.deposit(amount,web3.utils.fromAscii(project_ref)).estimateGas(function(error, gasAmount){
          if(error)
            console.log(error);
          else
            console.log("gasAmount: " + gasAmount);
        });

        web3.eth.getTransactionCount(this_user.address, function(err,nonce) {
          if(err)
            console.log(err); 
          else 
          {
            var nonceHex = web3.utils.toHex(nonce);
            var transValue = web3.utils.toHex(0);


            var lodash = require('lodash');
            var this_function_abi = lodash.find(config.abi, { name: 'deposit' });
            var payloadData = [amount,web3.utils.fromAscii(project_ref)];
            var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData);
           
            var thisTx = {
                           from: "0x"+this_user.address,
                           to: contract_address,
                           value: transValue,
                           data: txPayloadData,
                           nonce: nonceHex,
                           gasPrice: gasPriceHex,
                           gasLimit: gasLimitHex,
                         };
//console.log(thisTx);

             var signedTx = new Tx(thisTx);
             signedTx.sign(privateKey);
             var serializedTx = signedTx.serialize();
//console.log("------------------------");
//console.log(serializedTx);
  
             web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), function(err,hash){
              if(err)
              {
//                console.log(err);
                data.errors.push(err);
                res.render('pages/deposit', data);
              }  
              else
              {
                var mail_data = {};
                mail_data.subject = "Disberse Transaction Receipt - Deposit";
                mail_data.body = "Hi " + email + ",\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                send_email(res, data, decoded, mail_data);

                console.log(hash);
                //data.errors.push("Thank You - your transaction is being processed (" + hash + ")");
                data.errors.push("Thank You - your transaction is being processed ");
                res.render('pages/deposit', data);
               }
             });
          }
        });
      });
*/
//      data.errors.push("Thank You - your transaction is being processed ");
      res.render('pages/tx-twhankyou', data);
//      res.render('pages/deposit', data);

    }
  }); 
}
/*---------------------------------------------------------------------*/

function send_page(req, res, decoded) {

  var page_title = "Send";

  var error = "";
  var errors = [];
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var currencies = config.currencies;

  var disberse_abi = config.abi;
  var owner_address = config.owner_address;
  var contract_address = config.contract_address;
  var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

/*
  Disberse.methods.balanceOf(user_address).call({from: owner_address}, function(err,res) {
    callback(err, res + " GBP");
  });
*/

  var action = req.body.action || req.query.action;

  var project = req.body.project || req.query.project || '';
  var amount = req.body.amount || '';
  var purpose = req.body.purpose || '';
  var address_to = req.body.address_to || '';
  var currency = req.body.currency || 'GB-crypto';

  get_my_balance_for_this_project(id, project, function(err, balance, balance_type) {
    console.log("this p bal: " + balance + " " + balance_type);

    currency = balance_type || "GBP";
//console.log(currency);

    User.findOne({_id:id},function(err, this_user) {
      var user_address = this_user.address;

      if(!project)
      {
        error = "Select Project";
        errors.push(error);
      }

      if(!purpose)
      {
        error = "Enter tracking code";
        errors.push(error);
      }

      if(amount == '0')
      {
        error = "Enter amount more than 0";
        errors.push(error);
      }
      if(amount == '')
      {
        error = "Enter Amount";
        errors.push(error);
      }
      if(Number(amount) > 0 && Number(amount) > Number(balance))
      {
        error = "The balance for this wallet is " + Number(balance).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + " " + balance_type;
  //        error = "You do not have enough funds to make that transfer";
        errors.push(error);
        var formatted_amount = Number(amount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + " " + balance_type;
        error = "Funds not available in wallet for amount (" + formatted_amount + ") entered";
        errors.push(error);
      }

      if(!address_to)
      {
        error = "Enter receiver's email or wallet address";
        errors.push(error);
      }

      if(String(address_to).match(/\@/))
      {
        console.log("address_to email: " + address_to);
      }
      else if(!web3.utils.isAddress(address_to))
        errors.push("Wallet Address " + address_to + " is not valid");

/*
    if(!web3.utils.isAddress(address_to))
    {
      User.findOne({email:address_to},function(err, user) {
        if(err)
        {
          console.log(err);
        }
        else
        {
          console.log(user);
          if(user.address)
          {
            console.log("email match for address " + user.address);
          }
          else
            console.log("no email match " + user.address);
        }
      });
    }
*/

      var project_options = [];

      getUserOrg(id).then(function(account_org) {

      var data = {
                   page_title:page_title,
                   error:error,
                   errors:errors,
                   address:address,
                   account_org:account_org,
                   username:email,
                   balance:balance,
                   currencies:currencies,
                   menu0:menu0,
                   menu1:menu1,
                   label:label,
                   amount:amount,
                   balance:balance,
                   purpose:purpose,
                   project_options:project_options,
                   currency:currency,
                   address_to:address_to,
                   'id':id
                 };

//      Project.find({$and:[{user_id:id},{status:{$ne:"complete"}}]},function(err, projects) {

      Project.find({$and:[{$or:[{user_id:id},{addresses:{$all:[new RegExp(this_user.address, 'i')]}}]},{status:{$ne:"complete"}}]},function(err, projects) {

  //        console.log("p: " + projects);

        if(err)
        {
          data.errors.push(err);
          res.render('pages/send', data);
        }
        else if(data.errors.length == 0)
        {
          data.project_options = [];
          for(i=0; i<projects.length; i++)
          {
            var selected = ""; 
            if(projects[i].project_ref == req.body.project) selected = "selected";
  
            var project = projects[i];
  
  	  console.log(project.currency);
  
            data.project_options.push({
                                        currency:project.currency,
                                        ref:project.project_ref,
                                        name:project.name, 
                                        selected:selected
                                      });
          }
  
          if(String(address_to).match(/\@/))
          {
//console.log({email:address_to});
            User.findOne({email:new RegExp(address_to, 'i')},function(err, address_user) {
              console.log("err: " + err);
              console.log(address_user);
//            console.log("email to addr: " + address_user.email);
//            console.log("email to addr: " + address_user.address);
              if(!address_user)
              {
                data.errors.push("\"Receiver's email\" does not have an associated address");
                res.render('pages/send', data);
              }
              else
              {
                console.log("do_transfer for address: " + address_user.address);
                address_to = address_user.address;
                do_transfer(purpose, amount, address_to, Disberse, this_user, owner_address, contract_address, data, res, req, decoded);
              }
            });
          }
          else
          {
            do_transfer(purpose, amount, address_to, Disberse, this_user, owner_address, contract_address, data, res, req, decoded);
          }
        }
        else
        {
          data.project_options = [];
          for(i=0; i<projects.length; i++)
          {
            var selected = ""; 
            var project_ref = req.body.project || req.query.project;
            if(projects[i].project_ref == project_ref) selected = "selected";

            var project = projects[i];
  	  console.log(project.currency);
            data.project_options.push({
  				      currency:project.currency,
                                        ref:project.project_ref,
                                        name:project.name, 
                                        selected:selected
                                      });
          }

          res.render('pages/send', data);
        }
      });
    });
    });
  });
}


/*---------------------------------------------------------------------*/
function send_chk_page(req, res, decoded) {

  var page_title = "Send Tx Confirmation";

  var error = "";
  var errors = [];
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var currencies = config.currencies;

  var disberse_abi = config.abi;
  var owner_address = config.owner_address;
  var contract_address = config.contract_address;
  var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

  var data = {
                   page_title:page_title,
                   error:error,
                   errors:[],
                   address:address,
                   username:email,
                   balance:balance,
                   currencies:currencies,
                   menu0:menu0,
                   menu1:menu1,
                   label:label,
                   'id':id
                 };

  var hash = req.body.hash || req.query.hash;

  data.txhash = hash;

  web3.eth.getTransaction(hash).then(function(txHash){
    console.log(txHash);
    if(txHash.blockNumber > 0) {
      data.errors.push("Your tx blockNumber is " + txHash.blockNumber);
      data.txhashBlockNumber = txHash.blockNumber;
    } else {
//      data.errors.push("tx NOT completed reload " + txHash.blockNumber);
      data.errors.push("tx NOT completed please wait!!!");
    }
    data.errors.push("The tx hash is "+ hash);

    res.render('pages/send_tx', data);
  });
}
/*---------------------------------------------------------------------*/

function send_page_load(data) {
  res.render('pages/send', data);
}
/*---------------------------------------------------------------------*/

function do_transfer(purpose, amount, address_to, Disberse, this_user, owner_address, contract_address, data, res, req, decoded) {

  console.log("do_transfer")

  var email = this_user.email;
   

  var address_from = this_user.address;
  var key_password = this_user.password + this_user.pincode + this_user.org;

//  console.log(purpose+"'"+ amount+"'"+ address_to+"'"+ Disberse+"'"+ this_user);

  var keyObject = keythereum.importFromFile(address_from, path.join(__dirname + '/'));
  var privateKey = keythereum.recover(key_password, keyObject);

//  var project_key = purpose;
//  var project_ref = web3.utils.fromAscii(web3.utils.sha3(project_key).substring(2,10));

  var project_ref = web3.utils.fromAscii(req.body.project);
//console.log(req.body.project);

  var this_address_from     = "0x" + address_from;
  var this_address_to       = "0x" + address_to;
  var this_contract_address = "0x" + contract_address;
//console.log("data.currency: " + data.currency);

  Currencies.findOne({type:data.currency},[],{},function(err, this_currency) {
    if(err) console.log(err);
// try to get 
    console.log(this_currency);

    web3.eth.getGasPrice(function(err, gasPrice) {
      if(err) 
        console.log(err); 
      else 
      {
        var gasPriceHex = web3.utils.toHex(gasPrice);
        var gasLimitHex = web3.utils.toHex(2000000);

        var type_id = this_currency.id;

        Disberse.methods.transfer(this_address_to,amount,project_ref,type_id).estimateGas(function(error, gasAmount){
          if(error)
            console.log(error);
          else
            console.log("gasAmount: " + gasAmount);
        });

        web3.eth.getBalance(this_address_from, function(error,out) { 
          if(error)
            console.log(err); 
          else 
          {
            console.log("Balance for " + this_address_from + " is " +out); 
          } 
        });

        web3.eth.getTransactionCount(address_from, function(err,nonce) {
          if(err)
            console.log(err); 
          else 
          {
            var nonceHex = web3.utils.toHex(nonce);
            var transValue = web3.utils.toHex(0);
  
            var lodash = require('lodash');
            var this_function_abi = lodash.find(config.abi, { name: 'transfer' });
            var payloadData = [this_address_to,amount,project_ref,type_id];
//console.log(payloadData);
            var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData);
           
            var thisTx = {
                           from: this_address_from,
                           to: contract_address,
                           value: transValue,
                           data: txPayloadData,
                           nonce: nonceHex,
                           gasPrice: gasPriceHex,
                           gasLimit: gasLimitHex,
                         };

             var signedTx = new Tx(thisTx);
             signedTx.sign(privateKey);
             var serializedTx = signedTx.serialize();


             web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), function(err,hash){
              if(err)
              {
  //              console.log(err);
                data.errors.push(err);
                res.render('pages/send', data);
              }
              else
              {
//                data.errors.push("Thank you, your transaction is being processed ");
                data.errors.push("tx hash is "+ hash);
i/*  
                var mail_data = {};
                mail_data.to = config.admin_emails;
                mail_data.from = "support@eh7.co.uk";
                mail_data.subject = "Disberse Transaction Receipt - Transfer";
                mail_data.body = "Hi " + email + ",\n\nYour Transfer was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                send_email_forgot(res, "", mail_data);
*/

                Project.findOne({project_ref:req.body.project}, function(err, project) {
                  if(err) console.log(err);
                  User.findOne({_id:project.user_id}, function(err, user) {
                    if(err) console.log(err);
console.log(user);
                    var mail_data = {};
                    mail_data.to = user.email;
//                    mail_data.from = "support@eh7.co.uk";
                    mail_data.from = "hello@disberse.com";
                    mail_data.subject = "Disberse Transaction Receipt - Transfer";
                    mail_data.body = "Hi " + user.email + ",\n\nThe transfer request from " + email + " for " + project.currency + " " + amount + " against project \"" + project.name + "\" was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                    send_email_forgot(res, "", mail_data);

                    var mail_data = {};
                    mail_data.subject = "Disberse Transaction Receipt - Transfer";
                    mail_data.body = "Hi " + email + ",\n\nYour transfer request for " + project.currency + " " + amount + " against project " + project.name + " was completed.\n\nThe transaction hash is,\n\n " + hash + "\n\nThanks.";
                    send_email(res, data, decoded, mail_data);
                  });
                });
  
                console.log(hash);
                data.txhash = hash;
                res.render('pages/send_tx', data);
               }
             });
          }
        });
      }
    });
  });

//console.log(privateKey);
//console.log(web3.getGasPrice());
//console.log(gasPriceHex);
//console.log(gasLimitHex);
//console.log(nonce);
//console.log(nonceHex);

  // 
  // thoughts needs ether in account????
  //
}
/*---------------------------------------------------------------------*/


/*---------------------------------------------------------------------*/

function send_support_email(res, data, decoded) {

//  console.log("send support email: " + JSON.stringify(data));

  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;

  nodemailer.createTestAccount((err, account) => {

    let transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    });
/*
    let transporter = nodemailer.createTransport({
      host: 'mail1.eh7.co.uk',
      port: 25,
    });
*/
    let mailOptions = {
        from: email, 
        to: 'info@eh7.co.uk', 
        subject: data.subject,
        text: data.body, 
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
//        return console.log(error);
        render_support_page(res,data,error);
      }
      console.log('Message sent: %s', info.messageId);

      render_support_page(res,data,info.messageId);
    });
  });
}
/*---------------------------------------------------------------------*/
function send_email_forgot(res, data, mail_data) {

  var from  = mail_data.from;
  var to    = mail_data.to;

  nodemailer.createTestAccount((err, account) => {

    let transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    });

    let mailOptions = {
        from: from, 
        to: to, 
        subject: mail_data.subject,
        text: mail_data.body, 
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
//        return console.log(error);
      }
      if(info && info.messageId)
        console.log('Message sent: %s', info.messageId);
    });
  });
}

/*---------------------------------------------------------------------*/

function send_email(res, data, decoded, mail_data) {

//  console.log("send support email: " + JSON.stringify(data));

  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;

  nodemailer.createTestAccount((err, account) => {

    let transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    });
/*
    let transporter = nodemailer.createTransport({
      host: 'mail1.eh7.co.uk',
      port: 25,
    });
*/
    let mailOptions = {
//        from: 'support@eh7.co.uk', 
        from: 'hello@disberse.com', 
        to: email, 
        subject: mail_data.subject,
        text: mail_data.body, 
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
//        return console.log(error);
      }
      if(info && info.messageId)
        console.log('Message sent: %s', info.messageId);
    });
  });
}
/*---------------------------------------------------------------------*/

function support_page(req, res, decoded) {

  var page_title = "Support";

  var err = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var project_link = [];
  var projects = [
                   {
                     desc:'project 1',
                     status:'complete',
                     name:'project 1',
                     location:'Location',
                     balance:'100.00',
                     type:'GBP',
                     budget:'1000.00',
                     code:'p1aa',
                   },
  ];

  var subject = req.body.subject || "Enter subject";
  var body = req.body.body || "Enter support request here.";

  if(req.body.subject && req.body.body)
    send_support_email(res,{
                          page_title:page_title,
                          "my_var":err,
                          address:address,
                          username:email,
		 balance:balance,
                          menu0:menu0,
                          menu1:menu1,
                          label:label,
                          project_link:project_link,
                          projects:projects,
                          subject:subject,
                          body:body,
                          send_disable:false,
                          'id':id
                        }, decoded);
  else
    render_support_page(res,{
                          page_title:page_title,
                          "my_var":err,
                          address:address,
                          username:email,
		 balance:balance,
                          menu0:menu0,
                          menu1:menu1,
                          label:label,
                          project_link:project_link,
                          projects:projects,
                          subject:subject,
                          body:body,
                          send_disable:false,
                          'id':id
                        });
  
}
/*---------------------------------------------------------------------*/

function render_support_page(res, data, out) {
  
  if(out)
  {
    data.my_var = "Support Contact MessageId " + out  + " sent.";
    data.send_disable = true;
  }

//  console.log(out);
//  console.log(data);

  res.render('pages/support', data);
}

/*---------------------------------------------------------------------*/

function settings_page(req, res, decoded) {

  var page_title = "Settings";

  var error = "";
  var email = decoded.email;
  var id = decoded.id;
  var balance = decoded.balance;
  var address = decoded.address;

  var menu0 = topMenu(email);
  var menu1 = footMenu();
  var label = getLabel(email);

  var sub = req.body.sub || req.query.sub;

  var phone = req.body.phone || '';
  var name = req.body.name || '';
  var address = req.body.address || '';
  var org = req.body.org || '';
  var city = req.body.city || '';
  var country = req.body.country || '';
  var role = req.body.role || '';
  var email = req.body.email || '';

  User.findOne({_id:id},function(err, this_user) {
    if(this_user)
    {
      phone = req.body.phone || this_user.phone || '';
      email = req.body.email || this_user.email || '';
      name = req.body.name || this_user.name || '';
      address = this_user.address || '';
      org = req.body.org || this_user.org || '';
      city = req.body.city || this_user.city || '';
      country = req.body.country || this_user.country || '';
      role = req.body.role || this_user.role || '';

      var account = [
                   {
                     address:address,
                     org:org,
                     city:city,
                     country:country,
                     name:name,
                     role:role,
                     email:email,
                     phone:phone,
                   },
      ];
      var personal = [
                   {
                     email:this_user.email,
                   },
      ];

      if(sub == 'security')
      {
        var cur_password = req.body.cur_password;
        var new_password = req.body.new_password;
        var new_password_chk = req.body.new_password_chk;
        var pincode = req.body.pincode;

        User.findOne({_id:id},function(err, this_user) {
          console.log("found ok " + this_user);

          if(cur_password == this_user.password &&
              (new_password != '' && new_password == new_password_chk)
            )
          {
            console.log("old password checked okay");
            console.log("new password checked okay");

            var key_password_old = this_user.password + this_user.pincode + this_user.org;
            var key_password_new = new_password + pincode + this_user.org;
      
            update_users_keystore(id, this_user.address, key_password_old,key_password_new, pincode, new_password);

          }
       
        });

      }
      else if(sub == 'account')
      {
        User.findOne({_id:id},function(err, this_user) {
          var key_password_old = this_user.password + this_user.pincode + this_user.org;
          var key_password_new = this_user.password + this_user.pincode + org;
console.log(key_password_old + " :: " + key_password_new);
          
          update_users_keystore_nopass(address, key_password_old,key_password_new);
        });

        User.updateOne(
          {_id:id},
          {$set:{
            name:name,
            org:org,
            city:city,
            country:country,
            role:role,
            email:email,
            phone:phone,
          }},
          {upsert: true}, function(error,result) {
            if(error)
              console.log("User.updateOne error: " + error);
            else
              console.log(JSON.stringify(result));
        });
      }
  
      res.render('pages/settings', {
                                 page_title:page_title,
                                 "my_var":error,
                                 address:address,
                                 username:email,
		 balance:balance,
                                 menu0:menu0,
                                 menu1:menu1,
                                 label:label,
                                 account: account,
                                 personal: personal,
                                 'id':id
                               });
    }   
    else
    {
      res.render('pages/settings', {
                                 "my_var":error,
                                 address:address,
                                 username:email,
		 balance:balance,
                                 menu0:menu0,
                                 menu1:menu1,
                                 label:label,
                                 account: '',
                                 personal: '',
                                 'id':id
                               });
    }
  });
}

/*---------------------------------------------------------------------*/

function update_users_keystore_nopass(address, key_password_old,key_password_new) {

  var testFolder = path.join(__dirname + '/keystore/');

  fs.readdir(testFolder, function(error, files) {

    var keyObject = keythereum.importFromFile(address, path.join(__dirname + '/'));
    var privateKey = keythereum.recover(key_password_old, keyObject);

    files.forEach(file => {
      if(file.includes(address))
      {
        fs.unlink(testFolder + file, function() {

          var params = { keyBytes: 32, ivBytes: 16 };
          var dk = keythereum.create(params);
          var kdf = "pbkdf2";
          var options = { kdf: "pbkdf2", cipher: "aes-128-ctr", kdfparams: { c: 262144, dklen: 32, prf: "hmac-sha256" } };
          dk.privateKey = privateKey;
          var newKeyObject = keythereum.dump(key_password_new, dk.privateKey, dk.salt, dk.iv, options);
          var keyFile = keythereum.exportToFile(newKeyObject);

          console.log("DELETED " + testFolder + file);
        });
      }
    });
  });
}
/*---------------------------------------------------------------------*/
function update_users_keystore(id, address, key_password_old,key_password_new,pincode, new_password)
{
  var testFolder = path.join(__dirname + '/keystore/');

  User.updateOne(
    {_id:id},
    {$set:{
      password:new_password,
      pincode:pincode,
    }},
    {upsert: true}, function(error,result) {
      if(error)
        console.log("User.updateOne security setting update error: " + error);
      else
      {
        console.log(JSON.stringify(result));
      }
    
  });

  fs.readdir(testFolder, function(error, files) {

    var keyObject = keythereum.importFromFile(address, path.join(__dirname + '/'));
    var privateKey = keythereum.recover(key_password_old, keyObject);

    files.forEach(file => {
      if(file.includes(address))
      {
        fs.unlink(testFolder + file, function() {

          var params = { keyBytes: 32, ivBytes: 16 };
          var dk = keythereum.create(params);
          var kdf = "pbkdf2";
          var options = { kdf: "pbkdf2", cipher: "aes-128-ctr", kdfparams: { c: 262144, dklen: 32, prf: "hmac-sha256" } };
          dk.privateKey = privateKey;
          var newKeyObject = keythereum.dump(key_password_new, dk.privateKey, dk.salt, dk.iv, options);
          var keyFile = keythereum.exportToFile(newKeyObject);

          console.log("DELETED " + testFolder + file);
        });
      }
    });

  });
}
/*---------------------------------------------------------------------*/

function main_old(req, res) {

  var action = req.body.action || req.query.action;

//  authed_token = localStorage.getItem('token');
  
  authed_token = req.session.token["sessionData"];

//  console.log(req.session.token["sessionData"]);
  //console.log("authed_token: " + req.session.token["sessionData"]);


//  console.log("action: " + action);

  if(action == "logout")
  {
    localStorage.setItem('token', '');
    req.session.token["sessionData"] = "";
//    console.log("localStorage token: " + localStorage.getItem("token"));
    login(req, res);
  }
  else if(authed_token && authed_token != "")
  {
//    console.log("localStorage token: " + localStorage.getItem("token"));
    authed_token_main(req, res);
  }
  else if(action == "authcode")
  {
    authcode_chk(req, res); 
  }
  else if(action == "forgot")
  {
    forgot(req, res);
  }
  else if(action == "regend")
  {
    regend(req, res);
  }
  else if(action == "regpin")
  {
    regpin(req, res);
  }  
  else if(action == "reg")
  {
    reg(req, res);
  }
  else if(action == "login")
  {
    check_login(req, res);
  }
  else if(action == "login_pincode")
  {
    check_login_pincode(req, res);
  }
  else
  {
    login(req, res);
  }
}

/*---------------------------------------------------------------------*/

function authcode_chk(req, res){

  var action = req.query.action || req.body.action || "";
  var authcode = req.query.authcode || req.body.authcode || "";

  var email = req.query.email || req.body.email || "";
  var password = req.query.password || req.body.password || "";
  var password_chk = req.query.password_chk || req.body.password_chk || "";
  var pincode = req.query.pincode || req.body.pincode || "";
  var pincode_chk = req.query.pincode_chk || req.body.pincode_chk || "";

//  console.log(code);

//  console.log(authcode_password_reset[code]);

  var data = {
           authcode:authcode,
           auth_chk: authcode_password_reset[authcode],
           errors:['Please enter your new details below'],
           error:'',
           email:email,
           password:password,
           password_chk:password_chk,
           pincode_chk:pincode_chk,
         };

  if(action == "authcode") {

    if(!authcode_password_reset[authcode]) {
      data.errors.push("Authcode invalid");
      data.errors.push("Enter Your Registered Email");
      data.email = "";
      res.render('pages/forgot', data);
    } else if(email && password && pincode) {

      if(email == authcode_password_reset[authcode].email) {
        data.errors = [];
        data.errors.push("Authcode Checks");
        data.errors.push("Authcode Checks okay");

        var cur_password;
        var password = req.body.password;
        var password_chk = req.body.password_chk;
        var pincode = req.body.pincode;
        var pincode_chk = req.body.pincode_chk;

        if(password == password_chk && pincode == pincode_chk) {
          User.findOne({email:email},function(err, this_user) {
            if(err) 
             res.render('pages/reset_form', data);
            else {

              console.log("found ok " + this_user);

              var key_password_old = this_user.password + this_user.pincode + this_user.org;
              var key_password_new = password + pincode + this_user.org;

              update_users_keystore(this_user.id, this_user.address, key_password_old,key_password_new, pincode, password);

              res.render('pages/login_form', data);
            }
          });
        } else {
          if(password != password_chk)
            data.errors.push("Password does not match Password Chk");
          if(pincode != pincode_chk)
            data.errors.push("Pincode does not match Pincode Chk");
          res.render('pages/reset_form', data);
        }
      } else 
        res.render('pages/reset_form', data);

    } else {
//      data.errors.push("Enter all the fields please");
      res.render('pages/reset_form', data);
    }
  } else 
    res.render('pages/reset_form', data);

}
/*---------------------------------------------------------------------*/

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,config.secret)
console.log("text: " + text);
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 

/*---------------------------------------------------------------------*/
function decrypt(text){
  var dec;
  var decipher = crypto.createDecipher(algorithm,config.secret)
  var dec = decipher.update(text,'hex','utf8')
/*
  dec += decipher.final('utf8');
*/
  return dec;
}


/*---------------------------------------------------------------------*/

function home(req, res) {
  var error = '';

  res.render('pages/home', {
                             "my_var":error,
                             username:authed_email,
                             menu0:'menu0',
                             menu1:'menu1',
                             label:'label',
                             rates:'rates',
                             history:'history',
                             projects:'projects',
                             'id':authed_id
  });
}

/*---------------------------------------------------------------------*/

function check_login_pincode(req, res) {

console.log('check_login_pincode');

  var error = '';
  var this_id;

  dec_this_id = decrypt(req.body.id);
  var tmp = dec_this_id.split("::");
  var email = tmp[0];
  var id = tmp[1];

//console.log("pin: " + req.body.pincode);

  User.findOne({_id:id,pincode:req.body.pincode},function(err, this_user) {
    if(this_user)
    {
      console.log(err + " :: " + this_user.email);
      var data = {id:id,email:this_user.email,address:this_user.address};
      var token = jwt.sign(data, app.get('superSecret'), {
        expiresIn: '120m' 
//        expiresIn: '120m' 
      });
//console.log("jwt token: " + token);
      res.header('token' , token );
      localStorage.setItem('token', token);
      req.session.token["sessionData"] = token;
      
      // because decoded is not this_user

      this_user.balance = "updating";
 
      home_page(req, res, this_user);
/*
      res.render('pages/home', {
                                 "my_var":"err"+error,
                                 username:this_user.email,
                                 menu0:'menu0',
                                 menu1:'menu1',
                                 label:'label',
                                 rates:'rates',
                                 history:'history',
                                 projects:'projects',
                                 'id':req.body.id
                               });
*/
    }
    else
      res.render('pages/login_pincode_form', {"my_var":"Wrong pin code. Please re-enter.",'id':req.body.id});
/*
    jwt.verify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU5ZDRmOGVmZmY1YWE3MWJhZWVmMzcwOCIsImVtYWlsIjoiZ2F2QGVoNy5jby51ayIsImlhdCI6MTUwNzI4NTk0MSwiZXhwIjoxNTA3Mjg2NTQxfQ.IfkdsSSgyNjvm9wtIPY_Y5e3lNzlib7XBPCNePkqBmo", app.get('superSecret'), function(err, decoded) {
//    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        console.log("err: " + err);
      } else {
        console.log(decoded.exp);
        console.log("decoded: " + decoded +  "::" + decoded.email);
      }
    });
*/
  });

}

/*---------------------------------------------------------------------*/

function check_login(req, res) {

  console.log('check_login');

  var error = '';
  var this_id;

  if(req.query.error)
    error = req.query.error;

  console.log(req.body.email);
  console.log(req.body.password);

  User.findOne({email: req.body.email, password: req.body.password},function(err, this_user) {
    if(err)
    {
      console.log("check_login.err: " + err);
      res.render('pages/login_form', {"error":error,org:'',email:req.body.email,password:''});
    }
    else
    {
      if(this_user)
      {
        this_id = this_user._id
        console.log("this_user: " + this_user._id);
        enc_this_id = encrypt(this_user.email+"::"+this_user._id);

//console.log(this_id)
//console.log(this_id + " : " + enc_this_id)
//dec_this_id = decrypt(enc_this_id);
//console.log(this_id + " : out:" + dec_this_id)

        res.render('pages/login_pincode_form', {"my_var":error,id:enc_this_id});
      } else {
        if(req.body.email == "")
          error = "Enter Email and Password";
        else
          error = "Username/Password invalid";
        res.render('pages/login_form', {"error":error,org:'',email:req.body.email,password:''});
      }
    }
  });
}

/*---------------------------------------------------------------------*/

function login(req, res) {

  // 
  // need to check lgin against mongo and then set jwt
  //

  var error = '';

  if(req.query.error)
    error = req.query.error;

//console.log("login");

  res.render('pages/login_form', {"error":error,org:'',email:'',password:''});
}

/*---------------------------------------------------------------------*/
function forgot(req, res) {

  var error = "";
  var errors = [];

  var email = req.body.email || "";

  if(!email)
  {
    errors.push("Enter Your Registered Email");
    res.render('pages/forgot', {
                                       error:error,
                                       errors:errors,
                                       email:email,
                                  });
  }
  else
  {
//    var mail_data = {};
//    mail_data.to = "gav@eh7.co.uk,paul@disberse.com,ben@disberse.com";
//    mail_data.from = email;
//    mail_data.subject = "Disberse Password Reset Request";
//    mail_data.body = "Hi Admin,\n\n Reset account email:" + email + ",\n\nIf you think it is okay? Do some manual checks.\n\nThanks.";
//    send_email_forgot(res, "", mail_data);

    send_password_forgoten_link(res, email);

//    errors.push("Thanks, your request has been sent to the administrator you should receive an email with instructions to proceed.");
    errors.push("Thank you! Your request has been sent to an administrator. You will receive an email with further instructions soon.");

    res.render('pages/forgot', {
                                       error:error,
                                       errors:errors,
                                       email:email,
                                  });
  }
}

/*---------------------------------------------------------------------*/
function send_password_forgoten_link(res, email) {

  var url;
  var timestamp;
  var code = crypto.randomBytes(16).toString("hex");

  url = "http://eh1-15.eh7.co.uk:8083/wallet?action=authcode&authcode=" + code;
  timestamp = Math.floor(Date.now() / 1000);

//  authcode_password_reset.push({code:code,email:email,timestamp:timestamp});
  authcode_password_reset[code] = {email:email,timestamp:timestamp};

  var mail_data = {};
  mail_data.to = email;
//  mail_data.from = "support@eh7.co.uk";
  mail_data.from = "hello@disberse.com";
  mail_data.subject = "Disberse Password Reset";
//  mail_data.body = "Hi " + email + ",\n\nFollow this link to reset your account password:\n\n" + url + ",\n\nThanks.";
  mail_data.body = "Hi " + email + ",\n\nFollow this link to reset your account password:\n\n" + url + ",\n\nThanks.";
  send_email_forgot(res, "", mail_data);
}
/*---------------------------------------------------------------------*/

function regend(req, res) {

  var action = req.body.action;
  var id = req.body.id;

  var error = '';
  if(req.query.error)
    error = req.query.error;

  if(!req.body.pincode)
    error = " Enter Pincode and Pincode Check";
  if(!req.body.pincode_chk)
    error = " Enter Pincode and Pincode Check";
  if(req.body.pincode_chk != req.body.pincode)
    error = " Pincode and Pincode Check must be the same";
  
  var pincode = req.body.pincode;

  if(error)
    res.render('pages/register_pincode_form', {
                                                error:error,
                                                pincode:pincode,
                                                "id":id
                                              });
  else
  {
    User.findOne({_id: req.body.id},function(err, this_user) {
      if(this_user)
      {
        console.log('User found for pincode insert: ' + id);

        var key_password_new = this_user.password + pincode + this_user.org;
        var params = { keyBytes: 32, ivBytes: 16 };
        var dk = keythereum.create(params);
        var kdf = "pbkdf2";
        var options = { kdf: "pbkdf2", cipher: "aes-128-ctr", kdfparams: { c: 262144, dklen: 32, prf: "hmac-sha256" } };
        var keyObject = keythereum.dump(key_password_new, dk.privateKey, dk.salt, dk.iv, options);
        var keyFile = keythereum.exportToFile(keyObject);

        User.where({ _id: this_user._id}).update({ $set: {
          pincode: req.body.pincode,
          address:keyObject.address,
        }}).exec();

        this_user.address = keyObject.address;
        credit_new_account_with_some_eth(this_user, keyObject);

      }
      res.render('pages/login_form', {
                                       error:error,
                                       pincode:pincode,
                                       id:id,
                                     });
    });
    
  }
}

/*---------------------------------------------------------------------*/

function reg(req, res) {
  var error = '';

  if(req.query.error)
    error = req.query.error;

  var org = req.body.org || "";
  var email = req.body.email || "";
  var password = req.body.password || "";

  res.render('pages/register_form', {
                                      "error":error,
                                      org:org,
                                      email:email,
                                      password:password,
                                    });
}

/*---------------------------------------------------------------------*/

function regpin(req, res) {
  var error = '';
  if(req.query.error)
    error = req.query.error;

  if(!req.body.org)
    error += " Org,";
  if(!req.body.email)
    error += " Email,";
  if(!req.body.password)
    error += " Password,";
  if(!req.body.password_chk)
    error += " Password Check";
  if(error)
  {
    error = error.replace(/\,$/,"");
    error = error.replace(/\,([ a-zA-Z0-9\.]+)$/,", and $1");
    error = "Please enter value for " + error + ".";
  }

  if(!error && req.body.password != req.body.password_chk)
    error = "Password check does not match.";

  if(error)
    res.render('pages/register_form', {
                                        error:error,
                                        org:req.body.org,
                                        email:req.body.email,
                                        password:req.body.password
                                      });
  else 
  {
    var pincode = req.body.pincode;

    var user = new User({
      org: req.body.org,
      email: req.body.email,
      password: req.body.password,
      pincode: "",
      flag: "new",
      admin: true
    });

    User.findOne({email: req.body.email},function(err, this_user) {
      if(this_user != null)
        if(this_user.pincode != null)
        {
//          console.log("already a user");
          error = "Account already registered";
          res.render('pages/register_form', {
                                              error:error,
                                              org:req.body.org,
                                              email:req.body.email,
                                              password:req.body.password
                                            });
        }
        else
        {
          console.log("update user");
          console.log('User found: ' + req.body.email);
          User.where({ _id: this_user._id}).update({ $set: {
            org: req.body.org,
            email: req.body.email,
            password: req.body.password,
            pincode: "",
            flag: "new",
            admin: true
          }}).exec();
          res.render('pages/register_pincode_form', {
                                                      error:error,
                                                      pincode:pincode,
                                                      id:this_user._id
                                                    });
        }
      else
      {
        console.log("add new user");
        user.save(function(err, this_user) {
          if (err) throw err;
          console.log('User saved successfully: ' + req.body.email);
       
          // send notification email
          var mail_data = {};
          mail_data.to = req.body.email;//config.admin_emails;
//          mail_data.from = "support@eh7.co.uk";
          mail_data.from = "hello@disberse.com";
          mail_data.subject = "Disberse New User Registration Receipt";
          mail_data.body = "Hi " + req.body.email + ",\n\nYou have just registered to use the Disberse platform.\n\nThanks.";
          send_email_forgot(res, "", mail_data);

          var mail_data = {};
//          mail_data.to = "gav@eh7.co.uk";
          mail_data.to = "hello@disberse.com";
          mail_data.from = req.body.email;
          mail_data.subject = "Disberse sendtest";
          mail_data.body = "Hi Admin,\n\n"+ req.body.email + " has just registered to use the Disberse platform.\n\nThanks.";
          send_email_forgot(res, "", mail_data);

          res.render('pages/register_pincode_form', {
                                                      "error":error,
                                                      pincode:pincode,
                                                      id:this_user._id
                                                    });
        });
      }
    });
  }
}

/*---------------------------------------------------------------------*/
function credit_new_account_with_some_eth(this_user, keyObject) {

  console.log("credit_new_account_with_some_eth"); 
//  console.log(this_user); 
//  console.log(keyObject); 
//  console.log(""); 

  var address_from = config.disberse_admin_address;
  var key_password = "password" + "321" + "eh7 Internet info";
  var keyObject = keythereum.importFromFile(address_from, path.join(__dirname + '/'));
  var privateKey = keythereum.recover(key_password, keyObject);

  web3.eth.getGasPrice(function(err, gasPrice) {
    if(err) 
      console.log(err); 

    var gasPriceHex = web3.utils.toHex(gasPrice);
    var gasLimitHex = web3.utils.toHex(2000000);
    var eth_amount = 1;

    web3.eth.estimateGas({from: config.disberse_admin_address, to: "0x"+this_user.address, amount: web3.utils.toWei(eth_amount, "ether")},function(error, gasAmount){
      if(error)
        console.log(error);
      else
        console.log("gasAmount: " + gasAmount);
    });

    web3.eth.getTransactionCount(config.disberse_admin_address, function(err,nonce) {
      if(err)
        console.log(err); 
      else 
      {
        var nonceHex = web3.utils.toHex(nonce);
        var transValue = web3.utils.toHex(web3.utils.toWei(eth_amount, "ether"));

        var thisTx = {
                       from: config.disberse_admin_address,
                       to: "0x"+this_user.address,
                       value: transValue,
                       nonce: nonceHex,
                       gasPrice: gasPriceHex,
                       gasLimit: gasLimitHex,
                     };
//console.log(thisTx);
//console.log(privateKey);
        var signedTx = new Tx(thisTx);
        signedTx.sign(privateKey);
        var serializedTx = signedTx.serialize();

        web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), function(err,hash){
          if(err)
          {
            console.log(err);
          }  
          else
          {
            console.log(hash);
          }
        });
      }
    });
  });
}

/*---------------------------------------------------------------------*/
function get_user_balance_all(id, address, callback){
  console.log('get_user_balance_all');

  var promises = [];

   Currencies.find({},[],{sort:{type:1}},function(err, currencies) {
     if(err) console.log(err);
     else {
       for(var i=0; i<currencies.length; i++) {
//         console.log(currencies[i]);
         var token_type    = currencies[i].type;
         var token_type_id = currencies[i].id;
console.log(id, address, token_type_id, token_type)
         promises.push(get_user_balance_for_type(id, address, token_type_id, token_type));
       }
       Promise.all(promises)
         .catch(function (err) {
           callback(err,[]);
       })
         .then(results => {
           callback(null, results);
         });
     }
   });
/*
  var promise = new Promise(function(resolve, reject) {
    Currencies.find({},[],{sort:{type:1}},function(err, projects) {
      if(err) reject(err);
      else resolve(projects);
    });
  });
*/
}

/*---------------------------------------------------------------------*/
function get_user_balance_for_type(id, address, token_type_id, token_type){
  return new Promise(function(resolve, reject) {
/*
    Currencies.find({},[],{sort:{type:1}},function(err, projects) {
      if(err) reject(err);
      else resolve(projects);
    });
*/

  console.log('get_user_balance_all ');
    var balance = 0;
    var disberse_abi = config.abi;
    var owner_address = config.owner_address;
    var contract_address = config.contract_address;
    var Disberse = new web3.eth.Contract(disberse_abi, contract_address);
    Disberse.methods.getBalance(address,token_type_id).call({from:address}, function(err,res) {
      if(err) 
        reject(err)
      else {
        var return_val = {id:token_type_id,type:token_type,balance:Number(res).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')};
        resolve(return_val);
      }
    });
  });
}

/*---------------------------------------------------------------------*/
function get_user_balance(id, callback)
{
  var balance = 0;

  var disberse_abi = config.abi;
  var owner_address = config.owner_address;
  var contract_address = config.contract_address;

  var Disberse = new web3.eth.Contract(disberse_abi, contract_address);

  var project_type = {};

/*
  Disberse.methods.balanceOf(owner_address).call({from: owner_address}, function(err,res) {
    callback(err,res);
  });
*/

//  var disberse_abi = JSON.parse(disberse_abi_out.contracts["DisberseToken.sol:DisberseToken"].abi);

  Project.find({},function(err, projects) {
    if(err) console.log(err);

    for(var i = 0; i<projects.length; i++)
    {
      var project =  projects[i].toObject();
      project_type[project.project_ref] = project.currency; 
    }

    User.findOne({_id:id},function(err, this_user) {
      var user_address = this_user.address;
      try
      {
//        Disberse.methods.balanceOf(user_address).call({from: owner_address}, function(err,res) {
        Disberse.methods.getBalance(user_address,3).call({from: user_address}, function(err,res) {
          callback(err, res);
        });
      }
      catch(error)
      {
        callback(error);
      }
    });
  });
}

/*---------------------------------------------------------------------*/
/*
app.post('/wallet', function(req, res) {

  var token = req.headers['eh7-token'];
//console.log("eh7-token: " + token);
  var action = req.body.action;

  main(req, res);
});
*/
/*---------------------------------------------------------------------*/
/*
app.get('/wallet', function(req, res) {

//  console.log('app.get wallet')

  var token = req.headers['eh7-token'];
  var action = req.body.action || "register";

  main(req, res);

//console.log("action: " + action);


});
*/

/*---------------------------------------------------------------------*/

function format_timestamp(timestamp)
{
  var date = new Date(timestamp * 1000),

  datevalues = [
    pad(date.getFullYear(), 4),
    pad(date.getMonth()+1, 2),
    pad(date.getDate(), 2),
    pad(date.getHours(), 2),
    pad(date.getMinutes(), 2),
    pad(date.getSeconds(), 2),
  ];

  return datevalues;

//  console.log(datevalues);
}
/*---------------------------------------------------------------------*/

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
/*---------------------------------------------------------------------*/
function getUserOrg(id) {
  return new Promise(function(resolve, reject) {
    User.findOne({_id:id},function(err, this_user) {
      if(err) reject(err);
      else resolve(this_user.org);
    });
  });
}
/*---------------------------------------------------------------------*/
/*---------------------------------------------------------------------*/
