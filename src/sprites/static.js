var $ = require('dragonjs');

module.exports = $.Sprite({
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
    pos: $.Point(
        $.canvas.width / 2 - 32,
        $.canvas.height / 2 - 32
    )
});
