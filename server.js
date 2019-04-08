function runServer() {
    const koa = require('koa');
    const bodyParser = require('koa-bodyparser');
    const {routerMiddleware} = require('./sam2koaRouter');
    const createDebug = require('debug');
    const debug = createDebug('app:index');
    const commandLineArgs = require('command-line-args');
    require('dotenv').config();

// args
    const argsDef = [
        { name: 'verbose', alias: 'v', type: Boolean },
        { name: 'port', type: Number, alias: 'p'}
    ];
    const options = commandLineArgs(argsDef);


// vebose arg
    if (options.verbose) {
        createDebug.enable('*');
        debug('Verbose mode = ON');
    }

    var app = new koa();
    app.on('error', (err, ctx) => {
        debug('server error', err, ctx);
    });
    app.use(bodyParser());
    app.use(routerMiddleware(app));


    let port = options.port || 3001;
    app.listen(port);
    console.log('Listening on port ' + port);
}

module.exports = runServer;