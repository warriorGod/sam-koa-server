const debug = require('debug')('app:router');
const {runLambda, lambdaEvent} = require('./runLambda');


function matchRequest(koaRequest, samResource) {
    if (!samResource) {
        return false;
    }

    $match = false;
    if (samResource.data && samResource.data.Properties && samResource.data.Properties.Events) {
        for (let evKey in samResource.data.Properties.Events) {
            let ev = samResource.data.Properties.Events[evKey];
            if (ev.Properties) {
                let test = ev.Properties;
                if ((test.Method && test.Method.toUpperCase() === koaRequest.method) &&
                    (test.Path === koaRequest.path)
                ) {
                    $match = true;
                    break;
                }
            }
        }
    }

    return $match;
}

/**
 * Expects the koa request body to be parsed with koa-bodyparser or other middleware
 * @param request
 * @returns {*}
 */
function koaRequest2lambdaEvent(request) {
    // headers
    let other = {
        headers: request.header
    };
    return lambdaEvent(request.method, request.url, request.querystring, request.body, other);
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
            ctx.response.body = res.body;
            ctx.response.statusCode = 200;
            return;
        }
    }
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

    return router;
}

module.exports = {
    matchRequest,
    koaRequest2lambdaEvent,
    getLambdaHandler,
    router,
    routerMiddleware
};