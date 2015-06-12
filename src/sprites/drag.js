var $ = require('dragonjs'),
    label = require('./label.js');

module.exports = $.Sprite({
    name: 'drag',
    solid: true,
    depth: 10,
    collisionSets: [
        $.collisions,
        require('../collisions/lerp.js')
    ],
    mask: $.Rectangle(
        $.Point(10, 5),
        $.Dimension(32, 32)
    ),
    strips: {
        'drag': $.AnimationStrip({
            sheet: $.SpriteSheet({
                src: 'drag.png'
            })
        })
    },
    pos: $.Point(20, 20),
    on: {
        'colliding/screendrag': function () {
            if (!this.dragging) {
                this.dragging = true;
                $.Mouse.on.up(function () {
                    this.dragging = false;
                }, this);
            }
        }
    }
}).extend({
    dragging: false,
    update: function () {
        var offset;
        if (this.dragging && $.Mouse.is.down) {
            label.stop();
            offset = $.Mouse.offset;
            this.move(
                offset.x - this.size.width / 2,
                offset.y - this.size.height / 2
            );
        }
        this.base.update();
    }
});
