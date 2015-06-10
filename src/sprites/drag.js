var $ = require('dragonjs');

/**
 * @return {Sprite}
 */
module.exports = function (opts) {
    return $.Sprite({
        name: 'drag',
        collisionSets: [
            $.collisions,
            require('../collisions/lerp.js')
        ],
        mask: $.Rectangle(
            $.Point(),
            $.Dimension(64, 64)
        ),
        strips: {
            'drag': $.AnimationStrip({
                sheet: $.SpriteSheet({
                    src: 'drag.png'
                }),
                start: $.Point(10, 10),
                size: $.Dimension(64, 64),
                frames: 5,
                speed: 10
            })
        },
        pos: $.Point(100, 100),
        depth: 2,
        on: {
            'colliding/screentap': function () {
            }
        }
    }).extend({
        update: function () {
            this.base.update();
        }
    });
};
