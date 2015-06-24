var $ = require('dragonjs');

/**
 * @param {Point} opts.pos
 * @param {Boolean} opts.moving
 */
module.exports = function (opts) {
    var theta = 0;
    opts.pos.subtract($.Point(-32, -32), true);
    return $.ClearSprite({
        kind: 'solid',
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
        },
        update: function () {
            if (opts.moving) {
                theta += 0.1;
                theta %= 3.1415;
                this.speed.x = 2 * global.Math.sin(theta);
                this.speed.y = 2 * global.Math.cos(theta);
            }
            this.base.update();
        }
    });
};
