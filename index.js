/**
 * Created by joeabrams on 3/14/15.
 */

var AWS = require('aws-sdk'),
    util = require('./util'),
    logger = require('./logger'),
    AWS_API_VERSION = '2012-08-10';

/**
 * Set up the shared lock.
 *
 * @param {string} lockTableName
 * @param {object} params
 * {
 *   // option 1 - reference to an existing aws-sdk DynamoDb client
 *   db        : myDynamoDbObject
 *
 *   // option 2 - hardcoded AWS config
 *   awsConfig : {
 *                  "accessKeyId": "akid",
 *                  "secretAccessKey": "secret",
 *                  "region": "us-east-1"
 *               }
 * }
 *
 * @returns {LockerClient}
 */
exports.createClient = function (lockTableName, params) {
    if (typeof lockTableName === 'undefined') {
        throw 'You need to include a value for lockTableName';
    }

    if (typeof params !== 'object') {
        params = {};
    }

    if (!params.awsConfig) {
        params.awsConfig = {};
    }

    // Don't allow custom setting of API_VERSION
    params.awsConfig.apiVersion = AWS_API_VERSION;

    return new LockerClient(lockTableName, params);
};

/**
 * Class that holds the locker functionality
 *
 * @param lockTableName
 * @param params - optional params for configuring the inner dynamodb client
 *
 * @constructor
 */
function LockerClient(lockTableName, params) {
    this.lockTableName = lockTableName;
    if (params.db) {
        this.db = params.db;
    } else {
        this.db = new AWS.DynamoDB(params.awsConfig);
    }
}

/**
 *  Gets a global lock or else returns an error
 * 
 * @param {string} lockName - string you'd like to lock on
 * @param {number} timeoutMillis - hold the lock for this amount of time
 * @param {function} cb
 */
LockerClient.prototype.getLock = function (lockName, timeoutMillis, cb) {

    // First get the row for 'name'
    var db = this.db,
        lockTableName = this.lockTableName,
        params = {
            Key: {
                name: {
                    S: lockName
                }
            },
            TableName: lockTableName,
            AttributesToGet: [
                'guid', 'expiresOn'
            ]
        };

    db.getItem(params, function (err, data) {
        if (err) {
            logger.error(err, err.stack);
            logger.error(err.message);
            if (err.message === 'Requested resource not found') {
                // Table doesn't exist
                // TODO: do what?
                // TODO: other errors
            }
        } // an error occurred
        else {
            var params = {
                Item: {
                    name: {
                        S: lockName
                    },
                    guid: {
                        S: util.getRandomToken()
                    },
                    expiresOn: {
                        N: util.getNMillisInFuture(timeoutMillis) + ''
                    }
                },
                TableName: lockTableName
            };

            logger.debug('GetItem returned:', data);

            if (util.isEmptyObject(data)) {
                logger.info('Lock not found, attempting to add');
                params.ConditionExpression = 'attribute_not_exists(guid)';
            }
            else if (data.Item.expiresOn && parseInt(data.Item.expiresOn.N) > new Date() * 1) {
                logger.info('Active lock not yet expired');
                return cb('Lock expires on ' + data.Item.expiresOn.N + ' currently its ' + new Date() * 1);
            }
            else {
                params.ExpressionAttributeValues = {
                    ':oldguid': {'S': data.Item.guid.S}
                };
                params.ConditionExpression = "guid = :oldguid";
            }

            db.putItem(params, function (err) {
                if (err) {
                    logger.error(err);
                    return cb('ERROR');
                } else {
                    logger.debug('Got lock');
                    cb(null, 'SUCCESS');
                }
            });
        }
    });
};


/**
 * Creates the table to hold locks.
 *
 * @param {function} cb - callback invoked after success/failure of table creation
 */
LockerClient.prototype.createLockTable = function (cb) {
    var
        tableName = this.lockTableName,
        db = this.db,
        params = {
        AttributeDefinitions: [
            {
                AttributeName: 'name',
                AttributeType: 'S'
            }
        ],
        KeySchema: [
            {
                AttributeName: 'name',
                KeyType: 'HASH'
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        },
        TableName: tableName
    };
    db.createTable(params, function(err) {
        if (err) logger.error(err);

        if (err && err.code === 'ResourceInUseException') {
            return cb('TABLE_EXISTS', null);
        }

        if (err) {
            logger.error(err);
            return cb('ERROR', null);
        }
        return cb(null, 'SUCCESS');
    });
};

/**
 * Deletes your lock table
 *
 * @param {function} cb
 */
LockerClient.prototype.deleteLockTable = function (cb) {
    var params = {
        TableName: this.lockTableName
    };
    this.db.deleteTable(params, function(err) {
        if (err) {
            logger.error(err);
            cb('ERROR');
        }
        cb(null, 'SUCCESS');
    });
};