function runServer() {
    const koa = require('koa');
    const bodyParser = require('koa-bodyparser');
    const {routerMiddleware} = require('./sam2koaRouter');
    const createDebug = require('debug');
    const debug = createDebug('app:index');
    const commandLineArgs = require('command-line-args');
    const getRawBody = require('raw-body');
    const contentType = require('content-type');
    require('dotenv').config();

    // args
    const argsDef = [
        { name: 'verbose', alias: 'v', type: Boolean },
        { name: 'port', type: Number, alias: 'p'},
        { name: 'static', type: String, alias: 's'},
    ];
    const options = commandLineArgs(argsDef);


    // vebose arg
    if (options.verbose) {
        createDebug.enable('*');
        debug('Verbose mode = ON');
    }

    let app = new koa();
    app.on('error', (err, ctx) => {
        debug('server error', err, ctx);
    });


    // keep the raw body in ctx.requeast.rawBody
    // npm raw-body
    app.use(async (ctx, next) => {
        // debug(ctx.request.header, ctx.request.header['content-type'] && contentType.parse(ctx.request.header['content-type']));
        // this will timeout when there is no body ...
        // require 'application/octet-stream' header
        if (ctx.request.header['content-type']
            && contentType.parse(ctx.request.header['content-type']).type === 'application/octet-stream') {
            ctx.request.rawBody = await getRawBody(ctx.req, {
                length: ctx.request.header['content-length'] || ctx.req.headers['Content-Length'],
                limit: '50mb',
                encoding: contentType.parse(ctx.request.header['content-type']).parameters.charset
            })
        }

        await next();
    });

    // TODO support multipart forms with koa-body

    // option of using the koa-bodyparser
    // by default text bodies will be ignored, these options
    // need to be set for uploads to work
    app.use(bodyParser({
            enableTypes: ['json', 'form', 'text'], extendTypes: {
            }
        })
    );

    // static server

    if (options.static) {
        app.use(require('koa-static')(options.static));
    }

    // our router
    app.use(routerMiddleware(app));


    let port = options.port || 3001;
    app.listen(port);
    console.log('Listening on port ' + port);
}

module.exports = runServer;