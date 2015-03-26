# dynamo-lock

A simple library for using a DynamoDB based shared lock

[![Build Status](https://travis-ci.org/joeabrams026/dynamo-lock.svg?branch=master)](https://travis-ci.org/joeabrams026/dynamo-lock)

## Example Usage

#### Setting up your lock table
First, you need to create a table in DynamoDb to hold your locks
```javascript
var dynamoLock = require('dynamo-lock'),
    options = {},
    lockTableName = 'Lock',
    lockClient = dynamoLock.createClient(lockTableName, options);

lockClient.createLockTable(function (err) {
    if (err) {
        console.log('Could not create lock table because ' + err);
    } else {
        console.log('Created lock table');
    }
});
```

#### Getting a lock
```javascript
var dynamoLock = require('dynamo-lock'),
    options = {},
    lockTimeoutInMillis = 10000,
    lockTableName = 'Lock',
    lockClient = dynamoLock.createClient(lockTableName, options);

lockClient.getLock('testLock', lockTimeoutInMillis, function (err) {
    if (err) {
        console.log('Could not get lock');
    } else {
        console.log('Got lock!');
    }
});
```

## API

### createClient (lockTableName, options)
Creates the lock client.  By default, the library will get configuration according to the rules specified at http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html.  That is, in the following order - IAM, shared credentials file, environment variables.  Alternately, you can pass in hardcoded credentials by specifying them in options.awsConfig property (see more info below) or pass in your own DynamoDb object.

*lockTableName* (required) - the name of the dynamo table that manages the locks

*options* (optional) - object for specifying additional client options
- awsConfig (optional) - your AWS configuration, in the standard aws-sdk format e.g. ```{ "accessKeyId": "akid", "secretAccessKey": "secret", "region": "us-east-1" }```
- db (optional) - DynamoDb object 


```javascript
var dynamoLock = require('dynamo-lock');

// Hardcoding credentials (not a good security practice, but handy for testing)
var client = dynamoLock.createClient('lockTable', {
      awsConfig:{ "accessKeyId": "akid", "secretAccessKey": "secret", "region": "us-east-1" },
      }
);

// Using your own Dynamo Object
var DynamoDb = new AWS.DynamoDB(params.awsConfig);
var client = dynamoLock.createClient('lockTable', {
      db:DynamoDb
    }
);
```
### client.getLock (lockName, lockTimeoutInMillis, callback)
Gets the lock specified in lockName, holding it for lockTimeoutInMillis, and executing callback when the lock has (un)successfully been acquired.

*lockName* (required) - the name of the lock

*lockTimeoutInMillis* (required) - the amount of time a lock stays locked for

*callback (err, success)* (required) - function called after the lock is (un)successfully aquired.  Lock was successfully acquired if err is falsey.  If err is truthy, lock could not be acquired.  If successful, success will be set to 'SUCCESS'.

### client.createLockTable (callback)
Creates the lock table whose name was specified in creation of the client.  You need to create this table before you can start using shared locks.  The table will be created with 1 read throughput and 1 write throughput, by default.  You can adjust this from the AWS console/API.

*callback (err, success)* required - function called on error/success creating table.  err has possible values of 'ERROR' and 'TABLE_EXISTS'.  success has value 'SUCCESS'

### client.deleteLockTable (callback)
Deletes the lock table (be careful)

*callback (err, success)* required - function called on error/success creating table.  err has value of 'ERROR'.  success has value 'SUCCESS'.
