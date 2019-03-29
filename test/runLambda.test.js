const debug = require('debug')('test:runLambda');

describe('runLambda', function(){

    const {runLambda, lambdaEvent} = require('../runLambda');
    const pathNode = require('path');

    it('should run a handler module', async function(){
        runLambda(pathNode.resolve(__dirname, './resources/testLambdaHandler'), lambdaEvent('GET', '/test'))
            .should.eventually.deepEqual({body: 'thanks', statusCode: 200});
    });
});