Sam Koa Server
==============

Start a server that can server lambda handlers as defined in the sam template.yaml file in current working folder.

It doesn't use docker containers but instead utilizes lambda-local package to execute the handlers. This
means that the handlers run in ms compared to a couple of seconds on MacOs through sam.

You are welcome.


Sam template
============

Tested only on a basic template. You can overwrite the handler by providing a comment inline the
resource definition. This means you can run a pure lambda locally, and use the same template to run a
compiled version when deployed.


Features
========

- support raw upload when content-type is "application/octet-stream"
- support application/json payload
- OPTIONS method needs to be handle manually
- has static file server

Examples
========

    # run on port 3001
    npx sam-koa-server
    
    # run with debugging enabled
    npx sam-koa-server --verbose
    
    # run on a specific port
    npx sam-koa-server --port 3002
    
    # enable static server
    # localhost:3000/whoa.png will return a whoa.png file
    npx sam-koa-server --static .
