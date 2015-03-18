/**
 * Created by joeabrams on 3/14/15.
 */

var AWS = require('aws-sdk'),
    util = require('./util'),
    logger = require('./logger'),
    AWS_API_VERSION = '2012-08-10';

/**
 * Set up the shared lock.
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
 */
LockerClient.prototype.getLock = function (name, timeoutMillis, cb) {

    // First get the row for 'name'
    var db = this.db,
        lockTableName = this.lockTableName,
        params = {
            Key: {
                name: {
                    S: name
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
                        S: name
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
                logger.error('Active lock not yet expired');
                return cb('Lock expires on ' + data.Item.expiresOn.N + ' currently its ' + new Date() * 1);
            }
            else {
                params.ExpressionAttributeValues = {
                    ':oldguid': {'S': data.Item.guid.S}
                };
                params.ConditionExpression = "guid = :oldguid";
            }

            db.putItem(params, function (err, data) {
                if (err) {
                    logger.error(err);
                    return cb(err);
                } else {
                    logger.info('Got lock');
                    cb(null, 'Lock acquired');
                }
            });
        }
    });
};



