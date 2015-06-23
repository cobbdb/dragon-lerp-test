var $ = require('dragonjs'),
    label = require('./label.js');

module.exports = $.ClearSprite({
    name: 'drag',
    solid: true,
    depth: 10,
    collisionSets: [
        $.collisions,
        require('../collisions/lerp.js')
    ],
    mask: $.Rectangle(),
    size: $.Dimension(32, 32),
    pos: $.Point(20, 20)
}).extend({
    update: function () {
        var offset;
        if (this.dragging) {
            label.stop();
            offset = $.Mouse.offset;
            this.move($.Point(
                offset.x - this.size.width / 2,
                offset.y - this.size.height / 2
            ));
        } else {
            this.speed.x = 0;
            this.speed.y = 0;
            if ($.Key.arrow.up) {
                this.speed.y -= 2;
            }
            if ($.Key.arrow.right) {
                this.speed.x += 2;
            }
            if ($.Key.arrow.down) {
                this.speed.y += 2;
            }
            if ($.Key.arrow.left) {
                this.speed.x -= 2;
            }
        }
        this.base.update();
    },
    draw: function (ctx) {
        ctx.fillStyle = '#b6ff00';
        ctx.fillRect(
            this.pos.x,
            this.pos.y,
            this.size.width,
            this.size.height
        );
    }
});
