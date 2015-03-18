/**
 * Created by joeabrams on 3/18/15.
 */

/**
 * Created by joeabrams on 3/15/15.
 */
var assert = require("assert"),
    locker = require('../index.js');


describe('Test getting lock', function () {
    var lockClient = locker.createClient('Lock', {});
    this.timeout(20000);

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


