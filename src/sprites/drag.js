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
        $.Point(),
        $.Dimension(32, 32)
    ),
    strips: {
        'drag': $.AnimationStrip({
            sheet: $.SpriteSheet({
                src: 'drag.png'
            })
        })
    },
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
        }
        this.base.update();
    }
});
