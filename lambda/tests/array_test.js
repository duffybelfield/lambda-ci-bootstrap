let assert = require('assert');
let helpers = require('../helpers');

describe('Stripping a string', function () {
    describe('', function () {
        it('Removes ARN from strings', function () {
            var test_array = ["arn/service-cluster-names"];
            var expected_array = ["service-cluster-names"];
            assert.strictEqual(helpers.stripArns(test_array).toString(), expected_array.toString());
        });
    });
});