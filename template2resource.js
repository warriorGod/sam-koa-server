const yaml = require('yaml');
const debug = require('debug')('app:t2r');

function comment2json(str) {
    return JSON.parse(JSON.stringify(require('querystring').parse(str)));
}

function buildRecursive(key, node, ctx) {
    if (node.type === 'DOCUMENT') {
        if (!node.contents || !node.contents.items || !node.contents.items.length) {
            return;
        }
        for (let item of node.contents.items) {
            buildRecursive(item.key.value, item.value, ctx);
        }
    } else if (node.type === 'MAP' && key === 'Resources') {
        for (let item of node.items) {
            let r = {Name: item.key.value};
            r.data = item.value.toJSON();
            let comment = (item.comment || '').trim();
            r.meta = comment2json(comment);
            ctx.resources.push(r);
        }
    }
}

function buildResources(node) {
    let ctx = {resources:[]};
    buildRecursive('root', node, ctx);
    return ctx;
}

function convert(samYmlString) {
    let doc = yaml.parseDocument(samYmlString);
    return buildResources(doc);
}

module.exports = {
    convert
};