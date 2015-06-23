var $ = require('dragonjs');

/**
 * @param {Point} opts.pos
 */
module.exports = function (opts) {
    opts.pos.subtract($.Point(-32, -32), true);
    return $.ClearSprite({
        name: 'static',
        solid: true,
        collisionSets: require('../collisions/lerp.js'),
        mask: $.Rectangle(),
        size: $.Dimension(64, 64),
        pos: opts.pos
    }).extend({
        draw: function (ctx) {
            ctx.fillStyle = '#444';
            ctx.fillRect(
                this.pos.x,
                this.pos.y,
                this.size.width,
                this.size.height
            );
        }
    });
};
