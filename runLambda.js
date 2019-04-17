const debug = require('debug')('app:runLambda');

// function to generate functional api test requests
function lambdaEvent(method, endpoint, queryParams, body, other) {
    return Object.assign({
        "body": body,
        "httpMethod": method,
        "resource": endpoint,
        "queryStringParameters": queryParams,
        "stageVariables": null,
        "path": endpoint,
        "pathParameters": null,
        "isBase64Encoded": false
    }, other);
}

function runLambda(absHandlerPath, eventPayload, handlerName) {
    let lambdalocal = require('lambda-local');
    debug({absHandlerPath});
    let lambdaFunc = require(absHandlerPath);
    return lambdalocal.execute({
        event: eventPayload,
        lambdaFunc: lambdaFunc, //We are directly passing the lambda function
        lambdaHandler: handlerName || "lambdaHandler",
        // this makes the functional-tests timeout
        //callbackWaitsForEmptyEventLoop: true,
        timeoutMs: 0,
        // when set to 0, no debug( is visible)
        verboseLevel: process.env.DEBUG ? 5 : 0 //5 - prints a JSON of the final result
    });
};

module.exports = {
    runLambda,
    lambdaEvent
};