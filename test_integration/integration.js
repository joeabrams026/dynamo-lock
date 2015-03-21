/**
 * Created by joeabrams on 3/15/15.
 */
var assert = require("assert"),
    locker = require('../index.js'),
    lockClient = locker.createClient('MyLock', {});


describe('create lock table', function () {
    this.timeout(60000);
    it ('should create the lock table', function (done) {
        lockClient.createLockTable(function (err) {
            console.log(err);
            assert((!err) || (err === 'TABLE_EXISTS'));
            done();
        });
    });
});

describe('wait for 20 sec', function () {
    this.timeout(60000);
    it ('wait for 20 sec', function (done) {
        setTimeout(done, 20000);
    });
});

describe('test lock acquisition', function () {
    this.timeout(60000);

    // helper function to wait n millis before getting the lock
    function getLockAfter(n, cb) {
        setTimeout(function () {
            lockClient.getLock('testLock', 10000, function (err, result) {
                cb(err, result);
            });
        }, n);
    }

    describe('sleep 0 seconds', function () {
        it('should get the lock', function (done) {
            getLockAfter(0, function (err, res) {
                assert(!err);
                assert(res);
                done();
            });
        });
    });
    describe('sleep 5 seconds', function () {
        it('should not get the lock', function (done) {
            getLockAfter(5000, function (err, res) {
                assert(err);
                assert(!res);
                done();
            });
        });
    });
    describe('sleep 12 seconds', function () {
        it('should get the lock', function (done) {
            getLockAfter(12000, function (err, res) {
                assert(!err);
                assert(res);
                done();
            });
        });
    });
});

describe('delete lock table', function () {
    this.timeout(60000);

    it ('should delete the lock table', function (done) {
        setTimeout(function() {
            lockClient.deleteLockTable(function (err) {
                assert(!err);
                done();
            });
        },30000);
    });
});
