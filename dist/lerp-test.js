(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function () {
    throw Error('[BaseClass] Abstract method was called without definition.');
};

},{}],2:[function(require,module,exports){
var rebind = require('./rebind.js');

function contructor(root) {
    root.extend = function (child) {
        var key, base = {
            base: root.base
        };
        child = child || {};

        for (key in root) {
            if (typeof root[key] === 'function') {
                base[key] = root[key].bind(root);
            }
        }
        for (key in child) {
            if (typeof child[key] === 'function') {
                root[key] = rebind(key, root, base, child);
            } else {
                root[key] = child[key];
            }
        }

        root.base = base;
        return root;
    };

    root.implement = function () {
        var i, len = arguments.length;
        for (i = 0; i < len; i += 1) {
            arguments[i](root);
        }
        return root;
    };

    return root;
}

contructor.Abstract = require('./abstract.js');
contructor.Stub = require('./stub.js');
contructor.Interface = require('./interface.js');

module.exports = contructor;

},{"./abstract.js":1,"./interface.js":3,"./rebind.js":4,"./stub.js":5}],3:[function(require,module,exports){
module.exports = function (child) {
    return function (root) {
        var key;
        for (key in child) {
            root[key] = child[key];
        }
        return root;
    };
};

},{}],4:[function(require,module,exports){
module.exports = function (key, root, base, self) {
    return function () {
        var out,
            oldbase = root.base;

        // Rebind base and self for this specific method.
        root.base = base;
        root.self = self;
        out = self[key].apply(root, arguments);

        // Restore the original base object.
        root.base = oldbase;
        return out;
    };
};

},{}],5:[function(require,module,exports){
module.exports = function () {};

},{}],6:[function(require,module,exports){
module.exports = function () {
    var i,
        str = arguments[0],
        len = arguments.length;
    for (i = 1; i < len; i += 1) {
        str = str.replace(/%s/, arguments[i]);
    }
    return str;
};

},{}],7:[function(require,module,exports){
(function (global){
/**
 * # Lumberjack
 * Set `localStorage.lumberjack` to `on` to enable logging.
 * @param {Boolean} enabled True to force logging regardless of
 * the localStorage setting.
 * @return {Object} A new Lumberjack.
 * @see GitHub-Page http://github.com/cobbdb/lumberjack
 */
module.exports = function (enabled) {
    var log,
        record = {},
        cbQueue = {},
        master = [],
        ls = global.localStorage || {};

    /**
     * ## log(channel, data)
     * Record a log entry for an channel.
     * @param {String} channel A string describing this channel.
     * @param {String|Object|Number|Boolean} data Some data to log.
     */
    log = function (channel, data) {
        var i, len, channel, entry;
        var channelValid = typeof channel === 'string';
        var dataType = typeof data;
        var dataValid = dataType !== 'undefined' && dataType !== 'function';
        if (ls.lumberjack !== 'on' && !enabled) {
            // Do nothing unless enabled.
            return;
        }
        if (channelValid && dataValid) {
            /**
             * All log entries take the form of:
             * ```javascript
             *  {
             *      time: // timestamp when entry was logged
             *      data: // the logged data
             *      channel: // channel of entry
             *      id: // id of entry in master record
             *  }
             * ```
             */
            entry = {
                time: new Date(),
                data: data,
                channel: channel,
                id: master.length
            };
            // Record the channel.
            record[channel] = record[channel] || []
            record[channel].push(entry);
            master.push(entry);

            // Perform any attached callbacks.
            cbQueue[channel] = cbQueue[channel] || [];
            len = cbQueue[channel].length;
            for (i = 0; i < len; i += 1) {
                cbQueue[channel][i](data);
            }
        } else {
            throw Error('Lumberjack Error: log(channel, data) requires an channel {String} and a payload {String|Object|Number|Boolean}.');
        }
    };

    /**
     * ## log.clear([channel])
     * Clear all data from a the log.
     * @param {String} [channel] Name of a channel.
     */
    log.clear = function (channel) {
        if (channel) {
            record[channel] = [];
        } else {
            record = {};
            master = [];
        }
    };

    /**
     * ## log.readback(channel, [pretty])
     * Fetch the log of an channel.
     * @param {String} channel A string describing this channel.
     * @param {Boolean} [pretty] True to create a formatted string result.
     * @return {Array|String} This channel's current record.
     */
    log.readback = function (channel, pretty) {
        var channelValid = typeof channel === 'string';
        if (channelValid) {
            if (pretty) {
                return JSON.stringify(record[channel], null, 4);
            }
            return record[channel] || [];
        }
        throw Error('log.readback(channel, pretty) requires an channel {String}.');
    };

    /**
     * ## log.readback.master([pretty])
     * Get a full readback of all channels' entries.
     * @param {Boolean} [pretty] True to create a formatted string result.
     * @return {Array|String} This log's master record.
     */
    log.readback.master = function (pretty) {
        if (pretty) {
            return JSON.stringify(master, null, 4);
        }
        return master;
    };

    /**
     * ## log.readback.channels([pretty])
     * Fetch list of log channels currently in use.
     * @param {Boolean} [pretty] True to create a formatted string result.
     * @return {Array|String} This log's set of used channels.
     */
    log.readback.channels = function (pretty) {
        var keys = Object.keys(record);
        if (pretty) {
            return JSON.stringify(keys);
        }
        return keys;
    };

    /**
     * ## log.flush([channel])
     * Flush all logs from a single channel or from the entire
     * system if no channel name is provided.
     * @param {String} [channel] Optional name of channel to flush.
     * @return {Array}
     */
    log.flush = function (channel) {
        var logs;
        if (channel) {
            logs = record[channel];
            record[channel] = [];
        } else {
            record = {};
            master = [];
            logs = [];
        }
        return logs;
    };

    /**
     * ## log.on(channel, cb)
     * Attach a callback to run anytime a channel is logged to.
     * @param {String} channel A string describing this channel.
     * @param {Function} cb The callback.
     */
    log.on = function (channel, cb) {
        var channelValid = typeof channel === 'string';
        var cbValid = typeof cb === 'function';
        if (channelValid && cbValid) {
            cbQueue[channel] = cbQueue[channel] || [];
            cbQueue[channel].push(cb);
        } else {
            throw Error('log.on(channel, cb) requires an channel {String} and a callback {Function}.');
        }
    };

    /**
     * ## log.off(channel)
     * Disable side-effects for a given channel.
     * @param {String} channel A string describing this channel.
     */
    log.off = function (channel) {
        var channelValid = typeof channel === 'string';
        if (channelValid) {
            cbQueue[channel] = [];
        } else {
            throw Error('log.off(channel) requires an channel {String}.');
        }
    };

    /**
     * ## log.enable()
     * Activate logging regardless of previous settings.
     */
    log.enable = function () {
        enabled = true;
    };

    /**
     * ## log.disable()
     * Force logging off.
     */
    log.disable = function () {
        enabled = false;
    };

    return log;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
var Dimension = require('./dimension.js'),
    Point = require('./point.js'),
    log = require('./log.js');

/**
 * @param {SpriteSheet} opts.sheet
 * @param {Point} [opts.start] Defaults to (0,0). Index in the
 * sprite sheet of the first frame.
 * @param {Dimension} [opts.size] Defaults to (0,0). Size of
 * each frame in the sprite sheet.
 * @param {Number} [opts.frames] Defaults to 1. Number of
 * frames in this strip.
 * @param {Number} [opts.speed] Number of frames per second.
 * @param {Boolean} [opts.sinusoid] Defaults to false. True
 * to cycle the frames forward and backward per cycle.
 */
module.exports = function (opts) {
    var timeLastFrame,
        timeSinceLastFrame = 0,
        updating = false,
        frames = opts.frames || 1,
        size = opts.size || Dimension(),
        start = opts.start || Point(),
        firstFrame = Point(),
        direction = 1;

    return {
        size: size,
        frame: 0,
        speed: opts.speed || 0,
        load: function (cb) {
            cb = cb || function () {};
            opts.sheet.load(function (img) {
                size.width = size.width || img.width;
                size.height = size.height || img.height;
                firstFrame = Point(
                    size.width * start.x,
                    size.height * start.y
                );
                cb(img);
            });
        },
        start: function () {
            timeLastFrame = Date.now();
            updating = true;
        },
        /**
         * Pausing halts the update loop but
         * retains animation position.
         */
        pause: function () {
            updating = false;
        },
        /**
         * Stopping halts update loop and
         * resets the animation.
         */
        stop: function () {
            updating = false;
            timeSinceLastFrame = 0;
            this.frame = 0;
            direction = 1;
        },
        update: function () {
            var now, elapsed, timeBetweenFrames;

            if (updating && this.speed) {
                timeBetweenFrames = (1 / this.speed) * 1000;
                now = Date.now();
                elapsed = now - timeLastFrame;
                timeSinceLastFrame += elapsed;
                if (timeSinceLastFrame >= timeBetweenFrames) {
                    timeSinceLastFrame = 0;
                    this.nextFrame();
                }
                timeLastFrame = now;
            }
        },
        nextFrame: function () {
            this.frame += direction;
            if (opts.sinusoid) {
                if (this.frame % (frames - 1) === 0) {
                    direction *= -1;
                }
            } else {
                this.frame %= frames;
            }
            return this.frame;
        },
        /**
         * @param {Context2D} ctx Canvas 2D context.
         * @param {Point} pos Canvas position.
         * @param {Dimension} [scale] Defaults to (1,1).
         * @param {Number} [rotation] Defaults to 0.
         */
        draw: function (ctx, pos, scale, rotation) {
            var finalSize,
                offset = this.frame * size.width;
            scale = scale || Dimension(1, 1);
            rotation = rotation || 0;
            finalSize = Dimension(
                size.width * scale.width,
                size.height * scale.height
            );

            // Apply the canvas transforms.
            ctx.save();
            ctx.translate(
                pos.x + finalSize.width / 2,
                pos.y + finalSize.height / 2
            );
            ctx.rotate(rotation);

            // Draw the frame and restore the canvas.
            ctx.drawImage(opts.sheet,
                firstFrame.x + offset,
                firstFrame.y,
                size.width,
                size.height,
                -finalSize.width / 2,
                -finalSize.height / 2,
                finalSize.width,
                finalSize.height
            );
            ctx.restore();
        }
    };
};

},{"./dimension.js":19,"./log.js":30,"./point.js":35}],9:[function(require,module,exports){
/**
 * @param {String} opts.src
 * @param {Boolean} [opts.loop] Defaults to false.
 * @param {Number} [opts.volume] Defaults to 1. Volume
 * level between 0 and 1.
 * @param {Function} [opts.on.load]
 * @param {Function} [opts.on.play]
 * @param {Function} [opts.on.playing]
 * @param {Function} [opts.on.ended]
 * @return {Audio}
 */
module.exports = function (opts) {
    var audio = document.createElement('audio'),
        oldplay = audio.play;
    audio.loop = opts.loop || false;
    audio.volume = opts.volume || 1;

    /**
     * @param {Boolean} [force] Defaults to false. Force
     * immediate play from the start, even if the audio
     * is already playing.
     */
    audio.play = function (force) {
        if (force) {
            this.currentTime = 0;
        }
        oldplay.call(this);
    };
    /**
     * Pause playback and reset time index.
     */
    audio.stop = function () {
        this.pause();
        this.currentTime = 0;
    };

    opts.on = opts.on || {};
    audio.onloadeddata = opts.on.load;
    audio.onplay = opts.on.play;
    audio.onplaying = opts.on.playing;
    audio.onended = opts.on.ended;

    audio.src = 'assets/sound/' + opts.src;
    return audio;
};

},{}],10:[function(require,module,exports){
var mobile = require('./detect-mobile.js'),
    canvas = document.createElement('canvas');

if (mobile) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
} else {
    if (localStorage.drago === 'landscape') {
        canvas.width = 480;
        canvas.height = 320;
    } else {
        canvas.width = 320;
        canvas.height = 480;
    }
    canvas.style.border = '1px solid #000';
}

document.body.appendChild(canvas);
canvas.mobile = mobile;
canvas.ctx = canvas.getContext('2d');

module.exports = canvas;

},{"./detect-mobile.js":18}],11:[function(require,module,exports){
var Shape = require('./shape.js'),
    Vector = require('./vector.js'),
    Point = require('./point.js'),
    Dimension = require('./dimension.js');

/**
 * @param {Point} [pos] Defaults to (0,0).
 * @param {Number} [rad] Defaults to 0.
 */
module.exports = function (pos, rad) {
    pos = pos || Point();
    rad = rad || 0;

    return Shape({
        pos: pos,
        name: 'circle',
        intersects: {
            rectangle: function (rect) {
                var vect,
                    pt = Point(this.x, this.y);

                if (this.x > rect.right) pt.x = rect.right;
                else if (this.x < rect.x) pt.x = rect.x;
                if (this.y > rect.bottom) pt.y = rect.bottom;
                else if (this.y < rect.y) pt.y = rect.y;

                vect = Vector(
                    this.x - pt.x,
                    this.y - pt.y
                );
                return vect.magnitude < this.radius;
            },
            circle: function (circ) {
                var vect = Vector(
                    circ.x - this.x,
                    circ.y - this.y
                );
                return vect.magnitude < this.radius + circ.radius;
            }
        }
    }).extend({
        radius: rad,
        width: rad * 2,
        height: rad * 2,
        top: pos.y - rad,
        right: pos.x + rad,
        bottom: pos.y + rad,
        left: pos.x - rad,
        draw: function (ctx) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(250, 50, 50, 0.5)';
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            ctx.stroke();
        },
        move: function (x, y) {
            this.x = x;
            this.y = y;
            this.top = y - this.radius;
            this.right = x + this.radius;
            this.bottom = y + this.radius;
            this.left = x - this.radius;
        },
        resize: function (rad) {
            this.radius = rad;
            this.width = rad * 2;
            this.height = rad * 2;
            this.top = this.y - rad;
            this.right = this.x + rad;
            this.bottom = this.y + rad;
            this.left = this.x - rad;
        }
    });
};

},{"./dimension.js":19,"./point.js":35,"./shape.js":40,"./vector.js":49}],12:[function(require,module,exports){
var BaseClass = require('baseclassjs'),
    Sprite = require('./sprite.js');

/**
 * # Clear Sprite
 * An invisible sprite without any collision or
 * update logic. This is a blank canvas used for
 * edge cases such as ui's Label and Decal classes.
 */
module.exports = function (opts) {
    opts = opts || {};
    return Sprite(opts).extend({
        load: function (cb) {
            cb();
        },
        drawing: opts.drawing === false ? false : true,
        updating: opts.updating === false ? false : true,
        start: function () {
            this.drawing = true;
            this.updating = true;
        },
        pause: function () {
            this.drawing = true;
            this.updating = false;
        },
        stop: function () {
            this.drawing = false;
            this.updating = false;
        },
        update: BaseClass.Stub,
        draw: BaseClass.Stub
    });
};

},{"./sprite.js":42,"baseclassjs":2}],13:[function(require,module,exports){
var Item = require('./item.js');

module.exports = function () {
    var removed = false;
    return Item().extend({
        name: 'dragon-collection',
        set: [],
        map: {},
        /**
         * @param {Array Of Items} items
         */
        add: function (items) {
            if (items.length) {
                items.forEach(function (item) {
                    this.set.push(item);
                    this.map[item.name] = item;
                    item.trigger('ready');
                }, this);
                // Larger depth value is closer to viewer.
                this.set.sort(function (a, b) {
                    return a.depth - b.depth;
                });
            }
            return this;
        },
        /**
         * @param {String} name
         */
        remove: function (name) {
            this.map[name].removed = true;
            removed = true;
        },
        clear: function () {
            this.set = [];
            this.map = {};
        },
        /**
         * @param {String} name
         */
        get: function (name) {
            return this.map[name];
        },
        update: function () {
            this.set.forEach(function (item) {
                if (this.updating && item.updating && !item.removed) {
                    item.update();
                }
            }, this);
        },
        draw: function (ctx) {
            this.set.forEach(function (item) {
                if (this.drawing && item.drawing && !item.removed) {
                    item.draw(ctx);
                }
            }, this);
        },
        teardown: function () {
            this.set.forEach(function (item) {
                if (this.updating && item.updating && !item.removed) {
                    item.teardown();
                }
            }, this);
            if (removed) {
                // Remove any stale sprites.
                this.set = this.set.filter(function (item) {
                    // true to keep, false to drop.
                    return !item.removed;
                });
                removed = false;
            }
        }
    });
};

},{"./item.js":28}],14:[function(require,module,exports){
var Counter = require('./id-counter.js'),
    EventHandler = require('./event-handler.js'),
    Rectangle = require('./rectangle.js'),
    Point = require('./point.js'),
    Item = require('./item.js');

/**
 * @param {Shape} [opts.mask] Defaults to Rectangle.
 * @param {String} [opts.name]
 * @param {Boolean} [opts.solid] True to collide with other
 * solid sprites.
 * @param {Array|CollisionHandler} [opts.collisionSets]
 * @param {Map Of Functions} [opts.on] Dictionary of events.
 * @param {Map of Functions} [opts.one] Dictionary of one-time events.
 */
module.exports = function (opts) {
    var activeCollisions = {},
        collisionsThisFrame = {},
        collisionSets = [],
        updated = false,
        lastPos = Point();

    if (opts.collisionSets) {
        collisionSets = [].concat(opts.collisionSets);
    }

    opts.on = opts.on || {};
    opts.on['dragon/colliding/solid'] = function (other) {
            if (this.name === 'drag' && lastPos.x !== this.pos.x) {
                var logit = true;
                console.debug('>>>', lastPos.x, lastPos.y);
            }
        this.move(
            lastPos.x,
            lastPos.y
        );
            if (logit)
                console.debug('\t>', lastPos.x, lastPos.y);
    };

    return Item().extend({
        id: Counter.nextId,
        name: opts.name || 'dragon-collidable',
        solid: opts.solid || false,
        mask: opts.mask || Rectangle(),
        offset: opts.offset || Point(),
        move: function (pos) {
            lastPos = this.mask.pos();
            this.mask.move(
                pos.x + this.offset.x,
                pos.y + this.offset.y
            );
        },
        intersects: function (mask) {
            return this.mask.intersects(mask);
        },
        update: function () {
            if (!updated) {
                updated = true;
                collisionSets.forEach(function (handler) {
                    handler.update(this);
                }, this);
            }
        },
        teardown: function () {
            updated = false;
            collisionsThisFrame = {};
        },
        addCollision: function (id) {
            activeCollisions[id] = true;
            collisionsThisFrame[id] = true;
        },
        removeCollision: function (id) {
            activeCollisions[id] = false;
        },
        clearCollisions: function () {
            activeCollisions = {};
        },
        isCollidingWith: function (id) {
            return activeCollisions[id] || false;
        },
        canCollideWith: function (id) {
            var self = this.id === id,
                already = collisionsThisFrame[id];
            return !self && !already;
        }
    }).implement(
        EventHandler({
            events: opts.on,
            singles: opts.one
        })
    );
};

},{"./event-handler.js":22,"./id-counter.js":26,"./item.js":28,"./point.js":35,"./rectangle.js":38}],15:[function(require,module,exports){
/**
 * @param {String} opts.name
 */
module.exports = function (opts) {
    var activeCollisions = [];

    return {
        name: opts.name,
        draw: function (ctx) {
            activeCollisions.forEach(function (collidable) {
                collidable.mask.draw(ctx);
            });
        },
        clearCollisions: function () {
            activeCollisions = [];
        },
        update: function (collidable) {
            activeCollisions.push(collidable);
        },
        handleCollisions: function () {
            activeCollisions.forEach(function (pivot) {
                activeCollisions.forEach(function (other) {
                    var intersects, colliding,
                        valid = pivot.canCollideWith(other.id);

                    if (valid) {
                        intersects = pivot.intersects(other.mask),
                        colliding = pivot.isCollidingWith(other.id);
                        /**
                         * (colliding) ongoing intersection
                         * (collide) first collided: no collide -> colliding
                         * (separate) first separated: colliding -> no collide
                         * (miss) ongoing separation
                         */
                        if (intersects) {
                            pivot.addCollision(other.id);
                            if (!colliding) {
                                pivot.trigger('collide/' + other.name, other);
                            }
                            pivot.trigger('colliding/' + other.name, other);
                            if (pivot.solid && other.solid) {
                                pivot.trigger('dragon/colliding/solid', other);
                            }
                        } else {
                            if (colliding) {
                                pivot.removeCollision(other.id);
                                pivot.trigger('separate/' + other.name, other);
                            }
                            pivot.trigger('miss/' + other.name, other);
                        }
                    }
                });
            });
        },
        teardown: function () {
            this.clearCollisions();
        }
    };
};

},{}],16:[function(require,module,exports){
var Game = require('./game.js'),
    Util = require('./util.js');

module.exports = {
    Shape: require('./shape.js'),
    Circle: require('./circle.js'),
    Rectangle: require('./rectangle.js'),

    Dimension: require('./dimension.js'),
    Point: require('./point.js'),
    Vector: require('./vector.js'),
    Polar: require('./polar.js'),

    FrameCounter: require('./frame-counter.js'),
    IdCounter: require('./id-counter.js'),
    random: require('./random.js'),
    range: Util.range,
    shuffle: Util.shuffle,
    mergeLeft: Util.mergeLeft,
    mergeDefault: Util.mergeDefault,
    Mouse: require('./mouse.js'),
    Keyboard: require('./keyboard.js'),

    EventHandler: require('./event-handler.js'),
    SpriteSheet: require('./spritesheet.js'),
    AnimationStrip: require('./animation-strip.js'),
    Audio: require('./audio.js'),
    Font: require('./font.js'),

    CollisionHandler: require('./collision-handler.js'),
    collisions: require('./dragon-collisions.js'),

    screen: Game.screen,
    addScreens: Game.addScreens,
    removeScreen: Game.removeScreen,
    run: Game.run.bind(Game),
    kill: Game.kill,

    canvas: require('./canvas.js'),
    Screen: require('./screen.js'),
    Collidable: require('./collidable.js'),
    Sprite: require('./sprite.js'),
    ClearSprite: require('./clear-sprite.js'),

    ui: {
        Slider: require('./ui/slider.js'),
        Button: require('./ui/button.js'),
        Label: require('./ui/label.js'),
        Decal: require('./ui/decal.js')
    }
};

},{"./animation-strip.js":8,"./audio.js":9,"./canvas.js":10,"./circle.js":11,"./clear-sprite.js":12,"./collidable.js":14,"./collision-handler.js":15,"./dimension.js":19,"./dragon-collisions.js":20,"./event-handler.js":22,"./font.js":23,"./frame-counter.js":24,"./game.js":25,"./id-counter.js":26,"./keyboard.js":29,"./mouse.js":34,"./point.js":35,"./polar.js":36,"./random.js":37,"./rectangle.js":38,"./screen.js":39,"./shape.js":40,"./sprite.js":42,"./spritesheet.js":43,"./ui/button.js":44,"./ui/decal.js":45,"./ui/label.js":46,"./ui/slider.js":47,"./util.js":48,"./vector.js":49}],17:[function(require,module,exports){
module.exports = {
    show: {
        fps: function () {}
    }
};

},{}],18:[function(require,module,exports){
/**
 * @see https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
 */
module.exports = 'ontouchstart' in window;

},{}],19:[function(require,module,exports){
function Dimension(w, h) {
    return {
        width: w || 0,
        height: h || 0,
        clone: function () {
            return Dimension(this.width, this.height);
        },
        equals: function (other) {
            return (
                this.width === other.width &&
                this.height === other.height
            );
        },
        scale: function (scale) {
            return Dimension(
                this.width * scale,
                this.height * scale
            );
        }
    };
}

module.exports = Dimension;

},{}],20:[function(require,module,exports){
var CollisionHandler = require('./collision-handler.js'),
    Dimension = require('./dimension.js');

module.exports = CollisionHandler({
    name: 'dragon'
});

},{"./collision-handler.js":15,"./dimension.js":19}],21:[function(require,module,exports){
var Collection = require('./collection.js'),
    Collidable = require('./collidable.js'),
    Rectangle = require('./rectangle.js'),
    Point = require('./point.js'),
    Dimension = require('./dimension.js'),
    canvas = require('./canvas.js'),
    dragonCollisions = require('./dragon-collisions.js');

module.exports = Collection().add([
    require('./mask-screentap.js'),
    require('./mask-screendrag.js'),
    require('./mask-screenhold.js'),
    Collidable({
        name: 'screenedge/top',
        mask: Rectangle(
            Point(0, -9),
            Dimension(canvas.width, 10)
        ),
        collisionSets: dragonCollisions
    }),
    Collidable({
        name: 'screenedge/right',
        mask: Rectangle(
            Point(canvas.width - 1, 0),
            Dimension(10, canvas.height)
        ),
        collisionSets: dragonCollisions
    }),
    Collidable({
        name: 'screenedge/bottom',
        mask: Rectangle(
            Point(0, canvas.height - 1),
            Dimension(canvas.width, 10)
        ),
        collisionSets: dragonCollisions
    }),
    Collidable({
        name: 'screenedge/left',
        mask: Rectangle(
            Point(-9, 0),
            Dimension(10, canvas.height)
        ),
        collisionSets: dragonCollisions
    })
]);

},{"./canvas.js":10,"./collection.js":13,"./collidable.js":14,"./dimension.js":19,"./dragon-collisions.js":20,"./mask-screendrag.js":31,"./mask-screenhold.js":32,"./mask-screentap.js":33,"./point.js":35,"./rectangle.js":38}],22:[function(require,module,exports){
var BaseClass = require('baseclassjs');

/**
 * @param {Object} [opts.events]
 * @param {Object} [opts.singles]
 */
module.exports = function (opts) {
    var events = {},
        singles = {},
        name;

    opts = opts || {};
    for (name in opts.events) {
        events[name] = [
            opts.events[name]
        ];
    }
    for (name in opts.singles) {
        singles[name] = [
            opts.singles[name]
        ];
    }

    return BaseClass.Interface({
        on: function (name, cb) {
            events[name] = events[name] || [];
            events[name].push(cb);
        },
        one: function (name, cb) {
            singles[name] = singles[name] || [];
            singles[name].push(cb);
        },
        off: function (name) {
            events[name] = [];
            singles[name] = [];
        },
        trigger: function (name, data) {
            if (name in events) {
                events[name].forEach(function (cb) {
                    cb.call(this, data);
                }, this);
            }
            if (name in singles) {
                singles[name].forEach(function (cb) {
                    cb.call(this, data);
                }, this);
                singles[name] = [];
            }
        }
    });
};

},{"baseclassjs":2}],23:[function(require,module,exports){
var str = require('curb'),
    tpl = "@font-face{font-family:'%s';font-style:%s;font-weight:%s;src:url(assets/fonts/%s);unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2212,U+2215,U+E0FF,U+EFFD,U+F000}",
    cache = {};

module.exports = {
    /**
     * @param {String} opts.name
     * @param {String} [opts.style]
     * @param {String|Number} [opts.weight]
     * @param {String} opts.src
     */
    load: function (opts) {
        var style;
        if (!cache[opts.name]) {
            style = document.createElement('style');
            style.innerHTML = str(tpl,
                opts.name,
                opts.style || 'normal',
                opts.weight || '400',
                opts.src
            );
            document.body.appendChild(style);
            cache[opts.name] = true;
        }
    }
};

},{"curb":6}],24:[function(require,module,exports){
var timeSinceLastSecond = frameCountThisSecond = frameRate = 0,
    timeLastFrame = Date.now();

module.exports = {
    countFrame: function () {
        var timeThisFrame = Date.now(),
            elapsedTime = timeThisFrame - timeLastFrame;

        frameCountThisSecond += 1;
        timeLastFrame = timeThisFrame;

        timeSinceLastSecond += elapsedTime;
        if (timeSinceLastSecond >= 1000) {
            timeSinceLastSecond -= 1000;
            frameRate = frameCountThisSecond;
            frameCountThisSecond = 0;
        }
    },
    get frameRate () {
        return frameRate;
    },
    draw: function (ctx) {
        ctx.font = '30px Verdana';
        ctx.fillStyle = 'rgba(250, 50, 50, 0.5)';
        ctx.fillText(frameRate, 20, 50);
    }
};

},{}],25:[function(require,module,exports){
var Point = require('./point.js'),
    Circle = require('./circle.js'),
    Collidable = require('./collidable.js'),
    FrameCounter = require('./frame-counter.js'),
    Mouse = require('./mouse.js'),
    canvas = require('./canvas.js'),
    ctx = canvas.ctx,
    Counter = require('./id-counter.js'),
    dragonCollisions = require('./dragon-collisions.js'),
    debug = false,
    screens = [],
    screenMap = {},
    screensToAdd = [],
    screenRemoved = false,
    loadQueue = {},
    running = false,
    masks = require('./dragon-masks.js');

module.exports = {
    debug: require('./debug-console.js'),
    screen: function (name) {
        return screenMap[name];
    },
    /**
     * Loads screen into the game together
     * as a batch. None of the batch will be
     * loaded into the game until all screens
     * are ready.
     * @param {Array|Screen} set
     */
    addScreens: function (set) {
        var id;
        if (set) {
            set = [].concat(set);
            id = Counter.nextId;

            loadQueue[id] = set.length;
            set.forEach(function (screen) {
                screen.load(function () {
                    loadQueue[id] -= 1;
                    if (loadQueue[id] === 0) {
                        screensToAdd = screensToAdd.concat(set);
                    }
                });
            });
        }
    },
    /**
     * @param {String} name
     */
    removeScreen: function (name) {
        screenMap[name].removed = true;
        screenRemoved = true;
    },
    /**
     * @param {Boolean} [debugMode] Defaults to false.
     */
    run: function (debugMode) {
        var that = this,
            step = function () {
                that.update();
                that.draw();
                that.teardown();
                FrameCounter.countFrame();
                if (running) {
                    window.requestAnimationFrame(step);
                }
            };

        debug = debugMode;
        if (debugMode) {
            window.Dragon = this;
        }

        if (!running) {
            running = true;
            window.requestAnimationFrame(step);
        }
    },
    kill: function () {
        running = false;
        screens.forEach(function (screen) {
            screen.stop();
        });
    },
    update: function () {
        var addQueue;

        masks.update();

        // Update the screen.
        screens.forEach(function (screen) {
            if (screen.updating) {
                screen.update();
            }
        });

        // Settle screen tap events.
        dragonCollisions.handleCollisions();

        if (screensToAdd.length) {
            addQueue = screensToAdd;
            screensToAdd = [];
            // Update the master screen list after updates.
            addQueue.forEach(function (screen) {
                screens.push(screen);
                if (screen.name) {
                    screenMap[screen.name] = screen;
                }
                screen.trigger('ready');
            });
            // Larger depth value is closer to viewer.
            screens.sort(function (a, b) {
                return a.depth - b.depth;
            });
        }
    },
    draw: function () {
        screens.forEach(function (screen) {
            if (screen.drawing) {
                screen.draw(ctx, debug);
            }
        });
        if (debug) {
            FrameCounter.draw(ctx);
            dragonCollisions.draw(ctx);
        }
    },
    teardown: function () {
        dragonCollisions.teardown();
        masks.teardown();

        screens.forEach(function (screen) {
            screen.teardown();
        });
        if (screenRemoved) {
            // Remove any stale screens.
            screens = screens.filter(function (screen) {
                // true to keep, false to drop.
                return !screen.removed;
            });
            screenRemoved = false;
        }
    }
};

},{"./canvas.js":10,"./circle.js":11,"./collidable.js":14,"./debug-console.js":17,"./dragon-collisions.js":20,"./dragon-masks.js":21,"./frame-counter.js":24,"./id-counter.js":26,"./mouse.js":34,"./point.js":35}],26:[function(require,module,exports){
var counter = 0;

module.exports = {
    get lastId () {
        return counter;
    },
    get nextId () {
        counter += 1;
        return counter;
    }
};

},{}],27:[function(require,module,exports){
module.exports = function (src) {
    var img = new Image();
    img.ready = false;
    img.cmd = [];

    img.processLoadEvents = function () {
        this.cmd.forEach(function (cb) {
            cb(img);
        });
        this.cmd = [];
    };

    img.onload = function () {
        this.ready = true;
        this.processLoadEvents();
    };

    /**
     * @param {Function} [cb] Defaults to noop. Callback
     * for onload event.
     */
    img.load = function (cb) {
        cb = cb || function () {};
        if (this.ready) {
            cb(img);
        } else {
            this.cmd.push(cb);
            this.src = 'assets/img/' + src;
        }
    };

    return img;
};

},{}],28:[function(require,module,exports){
var BaseClass = require('baseclassjs'),
    Eventable = require('./event-handler.js');

module.exports = function () {
    return BaseClass({
        name: 'dragon-item',
        depth: 0,
        updating: true,
        drawing: true,
        update: BaseClass.Abstract,
        draw: BaseClass.Abstract,
        teardown: BaseClass.Abstract
    }).implement(
        Eventable()
    );
};

},{"./event-handler.js":22,"baseclassjs":2}],29:[function(require,module,exports){
var nameMap = {
        alt: false,
        ctrl: false,
        shift: false
    },
    codeMap = {};

function getCode(event) {
    return event.charCode || event.keyCode || event.which;
}

document.onkeydown = function (event) {
    var code = getCode(event),
        name = String.fromCharCode(code);
    codeMap[code] = true;
    nameMap[name] = true;
    nameMap.alt = event.altKey;
    nameMap.ctrl = event.ctrlKey;
    nameMap.shift = event.shiftKey;
};
document.onkeyup = function (event) {
    var code = getCode(event),
        name = String.fromCharCode(code);
    codeMap[code] = false;
    nameMap[name] = false;
    nameMap.alt = event.altKey;
    nameMap.ctrl = event.ctrlKey;
    nameMap.shift = event.shiftKey;
};

/**
 * **Example**
 * KeyDown.alt
 * KeyDown.name(' ')
 * KeyDown.code(32)
 */
module.exports = {
    get alt () {
        return nameMap.alt;
    },
    get ctrl () {
        return nameMap.ctrl;
    },
    get shift () {
        return nameMap.shift;
    },
    arrow: {
        get left () {
            return codeMap[37] || false;
        },
        get up () {
            return codeMap[38] || false;
        },
        get right () {
            return codeMap[39] || false;
        },
        get down () {
            return codeMap[40] || false;
        }
    },
    name: function (name) {
        return nameMap[name] || false;
    },
    code: function (code) {
        return codeMap[code] || false;
    }
};

},{}],30:[function(require,module,exports){
var Lumberjack = require('lumberjackjs');

module.exports = Lumberjack();

},{"lumberjackjs":7}],31:[function(require,module,exports){
var Collidable = require('./collidable.js'),
    Circle = require('./circle.js'),
    Point = require('./point.js'),
    Mouse = require('./mouse.js'),
    dragonCollisions = require('./dragon-collisions.js');

module.exports = Collidable({
    name: 'screendrag',
    mask: Circle(Point(), 8),
    collisionSets: dragonCollisions
}).extend({
    update: function () {
        if (Mouse.is.dragging) {
            this.move(Mouse.offset);
        } else {
            this.move(
                Point(-999, -999)
            );
        }
        this.base.update();
    }
});

},{"./circle.js":11,"./collidable.js":14,"./dragon-collisions.js":20,"./mouse.js":34,"./point.js":35}],32:[function(require,module,exports){
var Collidable = require('./collidable.js'),
    Circle = require('./circle.js'),
    Point = require('./point.js'),
    Mouse = require('./mouse.js'),
    dragonCollisions = require('./dragon-collisions.js');

module.exports = Collidable({
    name: 'screenhold',
    mask: Circle(Point(), 8),
    collisionSets: dragonCollisions
}).extend({
    update: function () {
        if (Mouse.is.down && !Mouse.is.dragging) {
            this.move(Mouse.offset);
        } else {
            this.move(
                Point(-999, -999)
            );
        }
        this.base.update();
    }
});

},{"./circle.js":11,"./collidable.js":14,"./dragon-collisions.js":20,"./mouse.js":34,"./point.js":35}],33:[function(require,module,exports){
var Collidable = require('./collidable.js'),
    Circle = require('./circle.js'),
    Point = require('./point.js'),
    Mouse = require('./mouse.js'),
    dragonCollisions = require('./dragon-collisions.js'),
    tapping = false;

Mouse.on.down(function () {
    tapping = true;
});

module.exports = Collidable({
    name: 'screentap',
    mask: Circle(Point(), 8),
    collisionSets: dragonCollisions
}).extend({
    update: function () {
        if (tapping) {
            tapping = false;
            this.move(Mouse.offset);
        } else {
            this.move(
                Point(-999, -999)
            );
        }
        this.base.update();
    }
});

},{"./circle.js":11,"./collidable.js":14,"./dragon-collisions.js":20,"./mouse.js":34,"./point.js":35}],34:[function(require,module,exports){
(function (global){
var Point = require('./point.js'),
    Vector = require('./vector.js'),
    canvas = require('./canvas.js'),
    isDown = false,
    isDragging = false,
    isHolding = false,
    current = Point(),
    last = Point(),
    shift = Vector(),
    startEventName,
    moveEventName,
    endEventName;

if (canvas.mobile) {
    startEventName = 'touchstart';
    moveEventName = 'touchmove';
    endEventName = 'touchend';
} else {
    startEventName = 'mousedown';
    moveEventName = 'mousemove';
    endEventName = 'mouseup';
}

/**
 * @return {Point}
 */
function getOffset(event) {
    if (canvas.mobile) {
        return Point(
            event.touches[0].clientX,
            event.touches[0].clientY
        );
    }
    return Point(
        event.offsetX,
        event.offsetY
    );
}

canvas.addEventListener(
    startEventName,
    function (event) {
        isDown = true;
        current = getOffset(event);
        global.setTimeout(function () {
            if (isDown) {
                isHolding = true;
            }
        }, 200);
    }
);
document.addEventListener(
    endEventName,
    function (event) {
        isDown = isDragging = isHolding = false;
    }
);
canvas.addEventListener(
    moveEventName,
    function (event) {
        last = current;
        current = getOffset(event);

        if (isDown) {
            shift.x = current.x - last.x;
            shift.y = current.y - last.y;
            // Drag threshold.
            if (shift.magnitude > 1) {
                isDragging = true;
            }
        }
    }
);

module.exports = {
    is: {
        get down () {
            return isDown;
        },
        get dragging () {
            return isDragging;
        },
        get holding () {
            return isHolding;
        }
    },
    /**
     * @return {Point}
     */
    get offset () {
        return current;
    },
    on: {
        down: function (cb, thisArg) {
            canvas.addEventListener(
                startEventName,
                cb.bind(thisArg)
            );
        },
        click: function (cb) {},
        dclick: function (cb) {},
        up: function (cb, thisArg) {
            document.addEventListener(
                endEventName,
                cb.bind(thisArg)
            );
        },
        move: function (cb, thisArg) {
            canvas.addEventListener(
                moveEventName,
                cb.bind(thisArg)
            );
        }
    },
    eventName: {
        start: startEventName,
        move: moveEventName,
        end: endEventName
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./canvas.js":10,"./point.js":35,"./vector.js":49}],35:[function(require,module,exports){
function Point(x, y) {
    return {
        x: x || 0,
        y: y || 0,
        clone: function () {
            return Point(this.x, this.y);
        },
        equals: function (other) {
            return (
                this.x === other.x &&
                this.y === other.y
            );
        }
    };
}

module.exports = Point;

},{}],36:[function(require,module,exports){
var Vector = require('./vector.js');

function isEqual(my, other, tfactor, mfactor) {
    var mag = my.magnitude === mfactor * other.magnitude,
        mytheta = (my.theta % Math.PI).toFixed(5),
        otheta = ((other.theta + tfactor) % Math.PI).toFixed(5);
    return mag && (mytheta === otheta);
}

/**
 * @param {Number} [theta] Defaults to 0.
 * @param {Number} [mag] Defaults to 0.
 */
function Polar(theta, mag) {
    return {
        theta: theta || 0,
        magnitude: mag || 0,
        invert: function () {
            return Polar(
                this.theta + Math.PI,
                this.magnitude * -1
            );
        },
        clone: function () {
            return Polar(
                this.theta,
                this.magnitude
            );
        },
        toVector: function () {
            return Vector(
                this.magnitude * Math.cos(this.theta),
                this.magnitude * Math.sin(this.theta)
            );
        },
        equals: function (other) {
            return (
                isEqual(this, other, 0, 1) ||
                isEqual(this, other, Math.PI, -1)
            );
        }
    };
}

module.exports = Polar;

},{"./vector.js":49}],37:[function(require,module,exports){
(function (global){
var i,
    len = 50,
    set = [],
    curr = 0;

for (i = 0; i < len; i += 1) {
    set.push(
        global.Math.random()
    );
}

/**
 * # random()
 * Fetch a random number in [0, 1).
 */
module.exports = function () {
    curr += 1;
    curr %= len;
    return set[curr];
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],38:[function(require,module,exports){
var Shape = require('./shape.js'),
    Point = require('./point.js'),
    Dimension = require('./dimension.js'),
    Vector = require('./vector.js');

/**
 * @param {Point} [pos] Defaults to (0,0).
 * @param {Dimension} [size] Defaults to (0,0).
 */
module.exports = function (pos, size) {
    pos = pos || Point();
    size = size || Dimension();

    return Shape({
        pos: pos,
        name: 'rectangle',
        intersects: {
            rectangle: function (rect) {
                return (
                    this.x < rect.right &&
                    this.right > rect.x &&
                    this.y < rect.bottom &&
                    this.bottom > rect.y
                );
            },
            circle: function (circ) {
                var vect,
                    pt = Point(circ.x, circ.y);

                if (circ.x > this.right) pt.x = this.right;
                else if (circ.x < this.x) pt.x = this.x;
                if (circ.y > this.bottom) pt.y = this.bottom;
                else if (circ.y < this.y) pt.y = this.y;

                vect = Vector(
                    circ.x - pt.x,
                    circ.y - pt.y
                );
                return vect.magnitude < circ.radius;
            }
        }
    }).extend({
        width: size.width || 0,
        height: size.height || 0,
        top: pos.y || 0,
        right: pos.x + size.width || 0,
        bottom: pos.y + size.height || 0,
        left: pos.x || 0,
        move: function (x, y) {
            this.x = x;
            this.y = y;
            this.top = y;
            this.right = x + this.width;
            this.bottom = y + this.height;
            this.left = x;
        },
        resize: function (size) {
            this.width = size.width;
            this.height = size.height;
            this.right = this.x + size.width;
            this.bottom = this.y + size.height;
        },
        draw: function (ctx) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(250, 50, 50, 0.5)';
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.stroke();
        }
    });
};

},{"./dimension.js":19,"./point.js":35,"./shape.js":40,"./vector.js":49}],39:[function(require,module,exports){
var BaseClass = require('baseclassjs'),
    EventHandler = require('./event-handler.js'),
    Counter = require('./id-counter.js'),
    SpriteSet = require('./sprite-set.js');

/**
 * @param {Array|Sprite} [opts.spriteSet]
 * @param {Array|CollisionHandler} [opts.collisionSets]
 * @param {String} opts.name
 * @param {Number} [opts.depth] Defaults to 0.
 * @param {Object} [opts.on] Dictionary of events.
 * @param {Object} [opts.one] Dictionary of one-time events.
 */
module.exports = function (opts) {
    var loaded = false,
        collisionMap = {};

    return SpriteSet().extend({
        name: opts.name,
        updating: false,
        drawing: false,
        load: function (cb) {
            if (!loaded) {
                this.addCollisionSets(opts.collisionSets);
                this.base.add({
                    set: opts.spriteSet,
                    onload: cb,
                    force: true
                });
                loaded = true;
            }
        },
        start: function () {
            this.updating = true;
            this.drawing = true;
            this.trigger('start');
        },
        pause: function () {
            this.updating = false;
            this.drawing = true;
            this.trigger('pause');
        },
        stop: function () {
            this.updating = false;
            this.drawing = false;
            this.trigger('stop');
        },
        depth: opts.depth || 0,
        collision: function (name) {
            return collisionMap[name];
        },
        /**
         * @param {Array|CollisionHandler} set
         */
        addCollisionSets: function (set) {
            if (set) {
                set = [].concat(set);
                set.forEach(function (handler) {
                    collisionMap[handler.name] = handler;
                });
            }
        },
        sprite: function (name) {
            return this.base.get(name);
        },
        /**
         * Loads sprites into this screen together
         * as a batch. None of the batch will be
         * loaded into the screen until all sprites
         * are ready.
         * @param {Array|Sprite} opts.set
         * @param {Function} [onload]
         * @param {Boolean} [force] Defaults to false. True
         * to ingest sprites immediately outside of the normal
         * game pulse.
         */
        addSprites: function (opts) {
            this.base.add(opts);
        },
        /**
         * @param {String} name
         */
        removeSprite: function (name) {
            this.base.remove(name);
        },
        /**
         * Flush all sprites from this screen immediately.
         */
        clearSprites: function () {
            this.base.clear();
        },
        update: function () {
            var i;

            if (this.updating) {
                // Update sprites.
                this.base.update();

                // Process collisions.
                for (i in collisionMap) {
                    collisionMap[i].handleCollisions();
                }
            }
        },
        draw: function (ctx, debug) {
            var name;
            if (this.drawing) {
                this.base.draw(ctx);
                if (debug) {
                    for (name in collisionMap) {
                        collisionMap[name].draw(ctx);
                    }
                }
            }
        },
        teardown: function () {
            var i;

            this.base.teardown();

            for (i in collisionMap) {
                collisionMap[i].teardown();
            }
        }
    }).implement(
        EventHandler({
            events: opts.on,
            singles: opts.one
        })
    );
};

},{"./event-handler.js":22,"./id-counter.js":26,"./sprite-set.js":41,"baseclassjs":2}],40:[function(require,module,exports){
var BaseClass = require('baseclassjs'),
    Point = require('./point.js');

/**
 * @param {Point} [opts.pos] Defaults to (0,0).
 * @param {Object} [opts.intersects] Dictionary of collision tests.
 */
module.exports = function (opts) {
    var pos, intersectMap;

    opts = opts || {};
    intersectMap = opts.intersects || {};
    pos = opts.pos || Point();

    return BaseClass({
        x: pos.x,
        y: pos.y,
        pos: function () {
            return Point(this.x, this.y);
        },
        name: opts.name,
        move: BaseClass.Abstract,
        resize: BaseClass.Abstract,
        intersects: function (other) {
            return intersectMap[other.name].call(this, other);
        },
        draw: BaseClass.Stub
    });
};

},{"./point.js":35,"baseclassjs":2}],41:[function(require,module,exports){
var Counter = require('./id-counter.js'),
    Collection = require('./collection.js');

module.exports = function () {
    var spritesToAdd = [],
        loadQueue = {};

    return Collection().extend({
        add: function (opts) {
            var id, onload, set, addQueue,
                thatbase = this.base;
            opts = opts || {};
            onload = opts.onload || function () {};
            set = [].concat(opts.set);

            if (set.length) {
                id = Counter.nextId;
                loadQueue[id] = set.length;
                set.forEach(function (sprite) {
                    sprite.removed = false;
                    sprite.load(function () {
                        loadQueue[id] -= 1;
                        if (loadQueue[id] === 0) {
                            spritesToAdd = spritesToAdd.concat(set);
                            if (opts.force) {
                                addQueue = spritesToAdd;
                                spritesToAdd = [];
                                thatbase.add(addQueue);
                            }
                            onload();
                        }
                    });
                });
            } else {
                onload();
            }
        },
        update: function () {
            var addQueue;
            this.base.update();

            addQueue = spritesToAdd;
            spritesToAdd = [];
            this.base.add(addQueue);
        }
    });
};

},{"./collection.js":13,"./id-counter.js":26}],42:[function(require,module,exports){
(function (global){
var BaseClass = require('baseclassjs'),
    Collidable = require('./collidable.js'),
    Point = require('./point.js'),
    Dimension = require('./dimension.js'),
    Rectangle = require('./rectangle.js');

/**
 * ##### Sprite
 * @param {Map Of AnimationStrip} [opts.strips]
 * @param {String} [opts.startingStrip] Defaults to first
 * strip name.
 * @param {Point} [opts.pos] Defaults to (0,0).
 * @param {Number} [opts.scale] Defaults to 1.
 * @param {Dimension} [opts.size] Defaults to strip size.
 * @param {Number} [opts.depth] Defaults to 0.
 * @param {Number} [opts.rotation] Defaults to 0.
 * @param {Point} [opts.speed] Defaults to (0,0).
 * @param {Boolean} [opts.freemask] Defaults to false. True
 * to decouple the position of the mask from the position
 * of the sprite.
 * @param {Boolean} [opts.solid] True to collide with other
 * solid sprites.
 * @param {Boolean} [opts.drawing] Defaults to false.
 * @param {Boolean} [opts.updating] Defaults to false.
 * @param {Shape} [opts.mask] Defaults to Rectangle.
 * @param {String} [opts.name]
 * @param {Array|CollisionHandler} [opts.collisionSets]
 * @param {Object} [opts.on] Dictionary of events.
 * @param {Object} [opts.one] Dictionary of one-time events.
 */
module.exports = function (opts) {
    var loaded = false,
        stripMap = opts.strips || {},
        pos = opts.pos || Point();

    opts.name = opts.name || 'dragon-sprite';
    opts.startingStrip = (
        opts.startingStrip || global.Object.keys(stripMap)[0]
    );

    if (!opts.freemask) {
        opts.mask = opts.mask || Rectangle();
        opts.offset = Point(
            opts.mask.x,
            opts.mask.y
        );
        opts.mask.move(
            pos.x + opts.offset.x,
            pos.y + opts.offset.y
        );
    }
    opts.one = opts.one || {};
    opts.one.ready = opts.one.ready || function () {
        this.start();
    };

    return Collidable(opts).extend({
        strip: stripMap[opts.startingStrip],
        updating: opts.updating || false,
        drawing: opts.drawing || false,
        useStrip: function (name) {
            // Do nothing if already using this strip.
            if (this.strip !== stripMap[name]) {
                this.strip.stop();
                this.strip = stripMap[name];
                this.strip.start();
            }
        },
        getStrip: function (name) {
            return stripMap[name];
        },
        pos: pos,
        scale: opts.scale || 1,
        size: opts.size || (stripMap[opts.startingStrip] || {}).size,
        trueSize: function () {
            return this.size.scale(this.scale);
        },
        rotation: opts.rotation || 0,
        depth: opts.depth || 0,
        speed: opts.speed || Point(),
        start: function () {
            this.updating = true;
            this.drawing = true;
            this.strip.start();
            this.trigger('start');
        },
        pause: function () {
            this.updating = false;
            this.drawing = true;
            this.strip.pause();
            this.trigger('pause');
        },
        stop: function () {
            this.updating = false;
            this.drawing = false;
            this.strip.stop();
            this.trigger('stop');
        },
        update: function () {
            if (this.updating) {
                this.shift();
                this.strip.update();
                this.base.update();
            }
        },
        draw: function (ctx) {
            var stripSize;

            if (this.drawing) {
                stripSize = this.strip.size;
                this.strip.draw(
                    ctx,
                    this.pos,
                    Dimension(
                        this.scale * this.size.width / stripSize.width,
                        this.scale * this.size.height / stripSize.height
                    ),
                    this.rotation
                );
            }
        },
        load: function (onload) {
            var name, loadQueue;
            onload = onload || function () {};
            if (!loaded) {
                loadQueue = global.Object.keys(stripMap).length;
                for (name in stripMap) {
                    stripMap[name].load(function () {
                        loadQueue -= 1;
                        if (loadQueue === 0) {
                            onload();
                            loaded = true;
                        }
                    });
                }
            } else {
                onload();
            }
        },
        move: function (x, y) {
            this.pos.x = x;
            this.pos.y = y;
            if (!opts.freemask) {
                this.base.move(this.pos);
            }
        },
        shift: function (vx, vy) {
            this.pos.x += vx || this.speed.x;
            this.pos.y += vy || this.speed.y;
            if (!opts.freemask) {
                this.base.move(this.pos);
            }
        }
    });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./collidable.js":14,"./dimension.js":19,"./point.js":35,"./rectangle.js":38,"baseclassjs":2}],43:[function(require,module,exports){
var createImage = require('./image.js'),
    cache = {};

/**
 * Duplicate calls to constructor will only
 * load a single time - returning cached
 * data on subsequent calls.
 * @param {String} opts.src
 * @return {Image} HTML5 Image instance.
 */
module.exports = function (opts) {
    var img,
        src = opts.src;

    if (src in cache) {
        img = cache[src];
    } else {
        img = createImage(src);
        cache[src] = img;
    }

    return img;
};

},{"./image.js":27}],44:[function(require,module,exports){
var Sprite = require('../sprite.js'),
    Dimension = require('../dimension.js'),
    Rectangle = require('../rectangle.js'),
    Point = require('../point.js'),
    AnimationStrip = require('../animation-strip.js'),
    SpriteSheet = require('../spritesheet.js'),
    collisions = require('../dragon-collisions.js');

/**
 * @param {Function} opts.onpress
 * @param {String} opts.up.src
 * @param {Dimension} opts.up.size
 * @param {String} [opts.down.src]
 * @param {Dimension} [opts.down.size]
 * @param {Point} opts.pos
 * @param {Dimension} opts.size
 * @param {String} [opts.name] Defaults to `dragon-ui-button`.
 */
module.exports = function (opts) {
    opts.down = opts.down || {};

    return Sprite({
        name: opts.name || 'dragon-ui-button',
        collisionSets: [
            collisions
        ],
        mask: Rectangle(
            Point(),
            opts.size
        ),
        strips: {
            up: AnimationStrip({
                sheet: SpriteSheet({
                    src: opts.up.src
                }),
                size: opts.up.size
            }),
            down: AnimationStrip({
                sheet: SpriteSheet({
                    src: opts.down.src || opts.up.src
                }),
                size: opts.down.size || opts.up.size
            })
        },
        startingStrip: 'up',
        pos: opts.pos,
        size: opts.size,
        on: {
            'colliding/screentap': function () {
                this.useStrip('down');
                opts.onpress.call(this);
            },
            'colliding/screenhold': function () {
                this.useStrip('down');
            }
        }
    }).extend({
        update: function () {
            this.useStrip('up');
            this.base.update();
        }
    });
};

},{"../animation-strip.js":8,"../dimension.js":19,"../dragon-collisions.js":20,"../point.js":35,"../rectangle.js":38,"../sprite.js":42,"../spritesheet.js":43}],45:[function(require,module,exports){
var Sprite = require('../sprite.js'),
    AnimationStrip = require('../animation-strip.js'),
    SpriteSheet = require('../spritesheet.js');

/**
 * # Decal (Sprite)
 * ### **$.ui.Decal()**
 * A decal is a sprite that has no collision logic and
 * displays as an image only.
 * @param {String} opts.strip.src
 * @param {Dimension} opts.strip.size
 * @param {Point} opts.pos
 * @param {Dimension} [opts.size]
 * @param {Number} [opts.scale]
 * @param {String} [opts.name] Defaults to `dragon-ui-decal`.
 */
module.exports = function (opts) {
    opts.name = opts.name || 'dragon-ui-decal';
    opts.strips = {
        decal: AnimationStrip({
            sheet: SpriteSheet({
                src: opts.strip.src
            }),
            size: opts.strip.size
        })
    };
    opts.startingStrip = 'decal';
    return Sprite(opts);
};

},{"../animation-strip.js":8,"../sprite.js":42,"../spritesheet.js":43}],46:[function(require,module,exports){
var ClearSprite = require('../clear-sprite.js');

/**
 * # Label (Sprite)
 * ### **$.ui.Label()**
 * Labels do not have collision logic nor are they displayed
 * from image assets. Labels instead contain only text.
 * @param {String} opts.text
 * @param {Function} [opts.style]
 * @param {Point} opts.pos
 * @param {String} [opts.name] Defaults to `dragon-ui-label`.
 */
module.exports = function (opts) {
    opts.style = opts.style || function () {};
    opts.name = opts.name || 'dragon-ui-label';

    return ClearSprite(opts).extend({
        text: opts.text,
        draw: function (ctx) {
            opts.style(ctx);
            ctx.fillText(
                this.text,
                this.pos.x,
                this.pos.y
            );
        }
    });
};

},{"../clear-sprite.js":12}],47:[function(require,module,exports){
var Sprite = require('../sprite.js'),
    Dimension = require('../dimension.js'),
    Rectangle = require('../rectangle.js'),
    Point = require('../point.js'),
    AnimationStrip = require('../animation-strip.js'),
    SpriteSheet = require('../spritesheet.js'),
    ClearSprite = require('../clear-sprite.js'),
    collisions = require('../dragon-collisions.js');

/**
 * @param {Function} [opts.onslide] Called on slide event. Accepts
 * current percentage as a number between 0 and 100.
 * @param {Point} opts.pos
 * @param {Dimension} opts.size
 * @param {String} src.lane
 * @param {String} src.knob
 */
module.exports = function (opts) {
    var pos = opts.pos,
        size = opts.size,
        buffer = 5,
        knobSize = Dimension(16, 32),
        lane = Sprite({
            name: 'slider-lane',
            collisionSets: [
                collisions
            ],
            mask: Rectangle(
                Point(),
                Dimension(
                    size.width,
                    size.height - buffer * 2
                )
            ),
            strips: {
                'slider': AnimationStrip({
                    sheet: SpriteSheet({
                        src: opts.src.lane
                    }),
                    size: Dimension(32, 8)
                })
            },
            startingStrip: 'slider',
            pos: Point(
                pos.x - size.width / 2,
                pos.y - size.height / 2 + buffer
            ),
            size: Dimension(
                size.width,
                size.height - buffer * 2
            ),
            on: {
                'colliding/screentap': function (mouse) {
                    var x, value;
                    x = Math.max(mouse.mask.x, this.mask.left);
                    x = Math.min(x, this.mask.right);
                    knob.pos.x = x - knobSize.width / 2;

                    value = x - this.mask.left;
                    value = (value / this.mask.width).toFixed(3);
                    opts.onslide(value);
                }
            }
        }),
        knob = Sprite({
            name: 'slider-knob',
            collisionSets: [
                collisions
            ],
            mask: Rectangle(
                Point(),
                knobSize
            ),
            strips: {
                'slider': AnimationStrip({
                    sheet: SpriteSheet({
                        src: opts.src.knob
                    }),
                    size: Dimension(8, 16)
                })
            },
            startingStrip: 'slider',
            pos: Point(
                pos.x - knobSize.width / 2,
                pos.y - knobSize.height / 2
            ),
            size: knobSize,
            on: {
                'colliding/screendrag': function (mouse) {
                    var x, value;
                    x = Math.max(mouse.mask.x, lane.mask.left);
                    x = Math.min(x, lane.mask.right);
                    this.pos.x = x - knobSize.width / 2;

                    value = x - lane.mask.left;
                    value = (value / lane.mask.width).toFixed(3);
                    opts.onslide(value);
                }
            }
        });

    opts.onslide = opts.onslide || function () {};

    return ClearSprite().extend({
        load: function (cb) {
            var queue = 2,
                done = function () {
                    queue -= 1;
                    if (!queue) {
                        cb();
                    }
                };
            lane.load(done);
            knob.load(done);
        },
        start: function () {
            lane.start();
            knob.start();
        },
        pause: function () {
            lane.pause();
            knob.start();
        },
        stop: function () {
            lane.stop();
            knob.stop();
        },
        update: function () {
            lane.update();
            knob.update();
        },
        draw: function (ctx) {
            lane.draw(ctx);
            knob.draw(ctx);
        },
        teardown: function () {
            lane.teardown();
            knob.teardown();
        }
    });
};

},{"../animation-strip.js":8,"../clear-sprite.js":12,"../dimension.js":19,"../dragon-collisions.js":20,"../point.js":35,"../rectangle.js":38,"../sprite.js":42,"../spritesheet.js":43}],48:[function(require,module,exports){
var random = require('./random.js');

module.exports = {
    shuffle: function (arr) {
        var i, j, x;
        for (i = 0; i < arr.length; i += 1) {
            j = parseInt(
                random() * (i + 1)
            );
            x = arr[i];
            arr[i] = arr[j];
            arr[j] = x;
        }
        return arr;
    },
    range: function (start, end) {
        var i, len,
            arr = [];

        if (!end) {
            end = start;
            start = 0;
        }

        len = end - start;
        for (i = 0; i < len; i += 1) {
            arr.push(i + start);
        }
        return arr;
    },
    /**
     * Merge properties from the right object into
     * the left object.
     * @param {Object} root
     * @param {Object} other
     */
    mergeLeft: function (root, other) {
        var key;
        for (key in other) {
            root[key] = other[key];
        }
    },
    mergeDefault: function (root, other) {
        var key;
        for (key in other) {
            if (!(key in root)) {
                root[key] = other[key];
            }
        }
    }
};

},{"./random.js":37}],49:[function(require,module,exports){
var Polar = require('./polar.js');

/**
 * @param {Number} [x] Defaults to 0.
 * @param {Number} [y] Defaults to 0.
 */
function Vector(x, y) {
    return {
        x: x || 0,
        y: y || 0,
        get magnitude () {
            return Math.abs(
                Math.sqrt(
                    (this.y * this.y) +
                    (this.x * this.x)
                )
            );
        },
        clone: function () {
            return Vector(
                this.x,
                this.y
            );
        },
        equals: function (other) {
            return (
                this.x === other.x &&
                this.y === other.y
            );
        },
        scale: function (scale) {
            return Vector(
                this.x * scale,
                this.y * scale
            );
        },
        toPolar: function () {
            return Polar(
                Math.atan(this.y / this.x),
                this.magnitude
            );
        }
    };
}

module.exports = Vector;

},{"./polar.js":36}],50:[function(require,module,exports){
var $ = require('dragonjs');

module.exports = $.CollisionHandler({
    name: 'lerp'
});

},{"dragonjs":16}],51:[function(require,module,exports){
var $ = require('dragonjs');

$.addScreens([
    require('./screens/lerp.js')
]);
$.run(false);

},{"./screens/lerp.js":52,"dragonjs":16}],52:[function(require,module,exports){
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

},{"../collisions/lerp.js":50,"../sprites/drag.js":53,"../sprites/static.js":54,"dragonjs":16}],53:[function(require,module,exports){
var $ = require('dragonjs');

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
            offset = $.Mouse.offset;
            this.move(
                offset.x - this.size.width / 2,
                offset.y - this.size.height / 2
            );
        }
        this.base.update();
    }
});

},{"../collisions/lerp.js":50,"dragonjs":16}],54:[function(require,module,exports){
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

},{"../collisions/lerp.js":50,"dragonjs":16}]},{},[51]);
