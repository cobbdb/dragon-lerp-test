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
});
