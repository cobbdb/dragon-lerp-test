var $ = require('dragonjs');

module.exports = $.ui.Label({
    text: '< drag me!',
    pos: $.Point(60, 20),
    style: function (ctx) {
        ctx.font = '24px Comic Sans MS';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#666';
    }
});
