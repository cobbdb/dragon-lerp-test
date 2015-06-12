var $ = require('dragonjs'),
    Static = require('../sprites/static.js');

module.exports = $.Screen({
    name: 'lerp',
    collisionSets: [
        require('../collisions/lerp.js')
    ],
    spriteSet: [
        Static({
            pos: $.Point(
                $.canvas.width / 2 - 32,
                $.canvas.height / 2 - 32
            )
        }),
        Static({
            pos: $.Point(300, 200)
        }),
        require('../sprites/drag.js')
    ],
    one: {
        ready: function () {
            this.start();
        }
    }
}).extend({
    draw: function (ctx, debug) {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, $.canvas.width, $.canvas.height);
        this.base.draw(ctx, debug);
    }
});
