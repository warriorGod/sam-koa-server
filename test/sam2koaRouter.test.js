const debug = require('debug')('test:sam2koaRouter');

describe('sam2koaRouter', function(){

    const {router, matchRequest, getLambdaHandler} = require('../sam2koaRouter');

    function getCtx(url, method, type, sam) {
        let urlNode = require('url');
        let parts = urlNode.parse(url);
        let ctx = {
            sam: Object.assign({templateDir: './', resources: []}, sam || {}),
            request: {
                method: method || 'GET',
                href: parts.href || '',
                path: parts.path || '',
                querystring: parts.query,
                type: type || 'application/json'
            },
            response: {}
        };

        return ctx;
    }

    describe('router', function(){

        function getNext() {
            return function(){};
        }

        xit('a', function(){
            debug(require('path').resolve(__dirname, 'test'));
        });

        it('should return a 404 on a non request', async function(){
            let ctx = getCtx('http://www.example.com', 'GET', '', {templateDir:'', resources:[]});
            await router(ctx, getNext());
            ctx.should.propertyByPath('response', 'statusCode').equal(404);
        });

        it('should run a lambda function', async function(){
            let sam = {templateDir: __dirname, resources:[
                    {
                        Name: 'TestResource',
                        data:
                            {
                                Type: 'AWS::Serverless::Function',
                                Properties:
                                    {
                                        CodeUri: 'bin',
                                        Handler: 'testLambdaHandler.lambdaHandler',
                                        Runtime: 'nodejs8.10',
                                        Timeout: 60,
                                        Events:
                                            {
                                                ExampleEvent:
                                                    {
                                                        Type: 'Api',
                                                        Properties: {Path: '/test', Method: 'get'}
                                                    }
                                            }
                                    }
                            },
                        meta: {handler: 'resources/testLambdaHandler.lambdaHandler'}
                    }
                ]};
            let ctx = getCtx('http://www.example.com/test', 'GET', 'application/json', sam);
            await router(ctx, getNext());

            ctx.should.propertyByPath('response', 'statusCode').equal(200);

        });
    });

    describe('matchRequest', function(){
        it('should not match non resource', function() {
            let koaRequest = getCtx('http://example.com/test').request;
            let samResource = {};
            should(matchRequest(koaRequest, samResource)).be.false();
        });

        it('should match path and method', function() {
            let koaRequest = getCtx('http://example.com/test').request;
            let samResource = {
                Name: 'TestResource',
                data:
                    {
                        Type: 'AWS::Serverless::Function',
                        Properties:
                            {
                                CodeUri: 'bin',
                                Handler: 'testModule.lambdaHandler',
                                Runtime: 'nodejs8.10',
                                Timeout: 60,
                                Events:
                                    {
                                        ExampleEvent:
                                            {
                                                Type: 'Api',
                                                Properties: {Path: '/test', Method: 'get'}
                                            }
                                    }
                            }
                    },
                meta: {handler: '/testModule.lambdaHandler'}
            };
            should(matchRequest(koaRequest, samResource)).be.true();
        });
    });

    describe('getLambdaHandler', function(){
        it('should resolve the Handler property and dir', function() {
            let samResource = {
                Name: 'TestResource',
                data:
                    {
                        Type: 'AWS::Serverless::Function',
                        Properties:
                            {
                                CodeUri: 'bin',
                                Handler: 'testModule.lambdaHandler',
                                Runtime: 'nodejs8.10',
                                Timeout: 60,
                                Events:
                                    {
                                        ExampleEvent:
                                            {
                                                Type: 'Api',
                                                Properties: {Path: '/test', Method: 'get'}
                                            }
                                    }
                            }
                    },
                meta: {handler: 'resources/testModule.lambdaHandler'}
            };

            let pathNode = require('path');
            getLambdaHandler(samResource, __dirname).should.deepEqual({
                handlerPath: pathNode.resolve(__dirname, 'resources/testModule'),
                handlerName: 'lambdaHandler'
            });
        });

        it('should match path and method', function() {
            let koaRequest = getCtx('http://example.com/test').request;
            let samResource = {
                Name: 'TestResource',
                data:
                    {
                        Type: 'AWS::Serverless::Function',
                        Properties:
                            {
                                CodeUri: 'bin',
                                Handler: 'testModule.lambdaHandler',
                                Runtime: 'nodejs8.10',
                                Timeout: 60,
                                Events:
                                    {
                                        ExampleEvent:
                                            {
                                                Type: 'Api',
                                                Properties: {Path: '/test', Method: 'get'}
                                            }
                                    }
                            }
                    },
                meta: {handler: '/testModule.lambdaHandler'}
            };
            should(matchRequest(koaRequest, samResource)).be.true();
        });
    });



});