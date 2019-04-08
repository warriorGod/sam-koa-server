require('should');
require('dotenv').config();

should.Assertion.add('nodeDeepEqual', function(cmpObj) {
    require('assert').deepEqual(this.obj, cmpObj);
});