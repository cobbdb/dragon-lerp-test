var $ = require('dragonjs');

module.exports = $.Screen({
    name: 'lerp',
    collisionSets: [
        require('../collisions/lerp.js')
    ],
    spriteSet: [
        require('../sprites/static.js'),
        require('../sprites/drag.js')
    ],
    one: {
        ready: function () {
            this.start();
        }
    }
}).extend({
    draw: function (ctx) {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, $.canvas.width, $.canvas.height);
        this.base.draw(ctx);
    }
});
