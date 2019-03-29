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