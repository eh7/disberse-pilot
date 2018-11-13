
# disberse-pilot

# Disbserse

The Disberse platform. Express.js and EJS.


## Installation

```$ npm i```

in the root folder.

## Required 

Create a mongodb instance running on localhost with the database ```wallet_disberse```

```'database': 'mongodb://disberse:letmeinnow@localhost/wallet_disberse'```


To start the server:

```$ npm start```


To use TestRPC

```$ testrpc```

then 

```$ geth attach http://localhost:8545```

## Disberse Token

```$ perl DisberseToken.pl```

Will set up and install a smart contract on the RPC test net. Just follow the instructions.

#
# associate scripts to import info from the blockchain to mongodb
# to allow quick access though the web interface
#
/usr/local/node-v8.11.1-linux-x64/bin/node EventImport.js
/usr/local/node-v8.11.1-linux-x64/bin/node UserTxImport.js
/usr/local/node-v8.11.1-linux-x64/bin/node EventsBlockInfo


#
# start the application server
#
HOST=demo.disberse.com PORT=8082 node Disberse.js

