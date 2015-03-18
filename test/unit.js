/**
 * Created by joeabrams on 3/15/15.
 */
var assert = require("assert"),
    locker = require('../index.js');

describe('Test successful get', function(){

    var mockDynamoDB = {
        getItem: function (params, callback) {
            var data = {Item:{guid:{S:'myguid'}}};
            return callback(null, data);
        },
        putItem: function (params, callback) {
            return callback(null);
        }
        }, lockClient = locker.createClient('Lock', {db:mockDynamoDB});

    describe('sleep 0ms', function(){
        it('should get the lock', function(done){
            lockClient.getLock ('testLock', 100, function(err,res) {
                assert(!err);
                assert(res);
                done();
            });
        });
    });
});

describe('Test unsuccessful get', function(){

    var mockDynamoDB = {
        getItem: function (params, callback) {
            var data = {Item:{guid:{S:'myguid'}}};
            return callback(null, data);
        },
        putItem: function (params, callback) {
            return callback('Error getting lock');
        }
    }, lockClient = locker.createClient('Lock', {db:mockDynamoDB});

    describe('sleep 0ms', function(){
        it('should get the lock', function(done){
            lockClient.getLock ('testLock', 100, function(err,res) {
                assert(err);
                assert(!res);
                done();
            });
        });
    });
});

describe('Test no table name specified', function(){
        it('should throw an exception', function(){
            var caughtException = false;
            try {
                var lockClient = locker.createClient();
            }
            catch (ex) {
                caughtException = true;
            }
            assert(caughtException);
        });
});