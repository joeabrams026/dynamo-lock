/**
 * Created by joeabrams on 3/16/15.
 *
 *  Helper functions
 *
 */

/**
 * Returns a unique token
 */
exports.getRandomToken = function() {
    // from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 *  Check for empty object
 */
exports.isEmptyObject = function(obj) {
    return Object.keys(obj).length === 0;
};

/**
 *  Returns now + timeoutMillis
 */
exports.getNMillisInFuture = function (timeoutMillis) {
    return new Date() * 1 + timeoutMillis;
};