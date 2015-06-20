var $ = require('dragonjs');

/**
 * @param {Point} opts.pos
 */
module.exports = function (opts) {
    opts.pos.subtract($.Point(-32, -32), true);
    return $.Sprite({
        name: 'static',
        solid: true,
        collisionSets: [
            require('../collisions/lerp.js')
        ],
        mask: $.Rectangle(
            $.Point(),
            $.Dimension(64, 64)
        ),
        strips: {
            'static': $.AnimationStrip({
                sheet: $.SpriteSheet({
                    src: 'static.png'
                })
            })
        },
        pos: opts.pos
    });
};
