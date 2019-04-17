const debug = require('debug')('app:router');
const {runLambda, lambdaEvent} = require('./runLambda');
const contentType = require('content-type');


function matchRequest(koaRequest, samResource) {
    if (!samResource) {
        return false;
    }

    let match = false;
    if (samResource.data && samResource.data.Properties && samResource.data.Properties.Events) {
        for (let evKey in samResource.data.Properties.Events) {
            let ev = samResource.data.Properties.Events[evKey];
            if (ev.Properties) {
                let test = ev.Properties;
                if ((test.Method && test.Method.toUpperCase() === koaRequest.method) &&
                    (test.Path === koaRequest.path)
                ) {
                    match = true;
                    break;
                }
            }
        }
    }
    debug({match});
    return match;
}

/**
 * Expects the koa request body to be parsed with koa-bodyparser and raw-body or other middleware
 * @param request
 * @returns {*}
 */
function koaRequest2lambdaEvent(request) {
    // sort out the headers
    let koaHeaders = {};
    for (let h in request.header) {
        koaHeaders[h.toLowerCase()] = request.header[h];
    }
    let other = {
        headers: koaHeaders
    };

    let body = request.body;

    // when the rawBody should replace the body ....
    // 1) when rawBody exists, and the header is application/octet-stream
    if (koaHeaders['content-type']
        && contentType.parse(koaHeaders['content-type']).type === 'application/octet-stream') {
        body = request.rawBody || request.body;
    } else if (koaHeaders['content-type']
        && (
            contentType.parse(koaHeaders['content-type']).type === 'application/json'
            || contentType.parse(koaHeaders['content-type']).type === 'application/ld+json')) {
        // already parsed body, stringified
        body = JSON.stringify(request.body);
    }

    // convert querystring to object
    let queryParams = require('querystring').parse(request.querystring || '');

    // create the lambda event
    let t = lambdaEvent(request.method, request.url, queryParams, body, other);
    return t;
}

function lambdaResponse2koa(runLambdaResponse, koaResponse) {
    let res = runLambdaResponse;
    koaResponse.body = res.body;
    koaResponse.statusCode = res.statusCode;
    koaResponse.set(res.headers);
}

/**
 * Get the defined handler, or the custom development handler when defined in the metadata
 * @param samResource
 * @returns {{handlerName: string, handlerPath: string}}
 */
function getLambdaHandler(samResource, dir) {
    let handlerPath, handlerName;
    if (!dir) {
        dir = __dirname;
    }
    let pathNode = require('path');
    if (samResource.data && samResource.data.Properties && samResource.data.Properties.Handler) {
        [handlerPath, handlerName] = samResource.data.Properties.Handler.split('.');
        if (samResource.data.Properties.CodeUri) {
            handlerPath = pathNode.resolve(samResource.data.Properties.CodeUri, handlerPath);
        }
    }


    if (samResource.meta && samResource.meta.handler) {
        [handlerPath, handlerName] = samResource.meta.handler.split('.');
    }

    handlerPath = pathNode.resolve(dir, handlerPath);


    return {handlerName, handlerPath};

    //throw new Error('Handler definition not found for resource ' + JSON.stringify(samResource));
}


async function router(ctx, next) {
    if (!ctx.sam) {
        await next();
        return;
    }

    await next();

    for (let r of ctx.sam.resources) {
        if (matchRequest(ctx.request, r)) {
            debug('match');
            let {handlerName, handlerPath} = getLambdaHandler(r, ctx.sam.templateDir);
            debug(handlerName);
            let res = await runLambda(handlerPath, koaRequest2lambdaEvent(ctx.request), handlerName);

            lambdaResponse2koa(res, ctx.response);
            debug({lambdaResponse:res});
            debug({koaResponse: ctx.response});
            return;
        }
    }
    debug('no match');
    ctx.response.statusCode = 404;
}


function routerMiddleware(app) {
    // assign the template to the context
    // expect the template to be in the route folder
    let samTemplate = require('fs').readFileSync('./template.yaml', 'utf-8');
    let {convert} = require('./template2resource');
    app.context.sam = Object.assign({
            templateDir: require('path').resolve('./')
        }, convert(samTemplate)
    );

    debug('Serving the following routes:');
    debug(app.context.sam);

    return router;
}

module.exports = {
    matchRequest,
    koaRequest2lambdaEvent,
    getLambdaHandler,
    router,
    routerMiddleware,
    lambdaResponse2koa
};