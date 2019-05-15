const debug = require('debug')('sks:runLambda');
const debugLambdaLocal = require('debug')('sks:lambda-local');

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

function createCustomLogger() {
    // https://github.com/winstonjs/winston#transports
    const winston = require('winston');
    const Transport = require('winston-transport');

    class DebugOutput extends Transport {
        constructor(opts) {
            super(opts);
        }

        log(info, callback) {
            setImmediate(() => {
                this.emit('logged', info);
            });

            // log lambda local under a debug namespace, not the console
            debugLambdaLocal(info);
            callback();
        }
    }

    return winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            new DebugOutput()
        ]
    });
}

function runLambda(absHandlerPath, eventPayload, handlerName) {
    let lambdalocal = require('lambda-local');
    lambdalocal.setLogger(createCustomLogger());
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