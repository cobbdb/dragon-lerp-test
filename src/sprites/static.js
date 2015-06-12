var $ = require('dragonjs');

module.exports = function (opts) {
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
