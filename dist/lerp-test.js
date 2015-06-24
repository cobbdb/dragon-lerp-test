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
var Dimension = require('./geom/dimension.js'),
    Point = require('./geom/point.js'),
    log = require('./util/log.js');

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

},{"./geom/dimension.js":18,"./geom/point.js":19,"./util/log.js":49}],9:[function(require,module,exports){
var BaseClass = require('baseclassjs'),
    CollisionItem = require('./collision-item.js'),
    Point = require('./geom/point.js'),
    Vector = require('./geom/vector.js'),
    Dimension = require('./geom/dimension.js'),
    Rectangle = require('./geom/rectangle.js'),
    Util = require('./util/object.js');

/**
 * @class ClearSprite
 * @extends CollisionItem
 * @param {Point} [opts.pos] Defaults to (0,0).
 * @param {Number} [opts.scale] Defaults to 1.
 * @param {Dimension} [opts.size] Defaults to strip size.
 * @param {Number} [opts.depth] Defaults to 0.
 * @param {Number} [opts.rotation] Defaults to 0.
 * @param {Point} [opts.speed] Defaults to (0,0).
 * @param {Boolean} [opts.freemask] Defaults to false. True
 * to decouple the position of the mask from the position
 * of the sprite.
 * @param {Boolean} [opts.drawing] Defaults to false.
 * @param {Boolean} [opts.updating] Defaults to false.
 */
module.exports = function (opts) {
    var pos = opts.pos || Point(),
        size = opts.size || Dimension();

    Util.mergeDefaults(opts, {
        name: 'dragon-sprite',
        mask: Rectangle(),
        one: {}
    });
    opts.one.ready = opts.one.ready || function () {
        this.start();
    };

    if (!opts.freemask) {
        // Setup mask offset.
        opts.offset = opts.mask.pos();
        opts.mask.move(
            pos.add(opts.offset)
        );
        // Use entire sprite size if no mask size defined.
        if (!opts.mask.width && !opts.mask.height) {
            opts.mask.resize(size);
        }
    }

    return CollisionItem(opts).extend({
        updating: opts.updating || false,
        drawing: opts.drawing || false,
        pos: pos,
        scale: opts.scale || 1,
        size: size,
        trueSize: function () {
            return this.size.scale(this.scale);
        },
        rotation: opts.rotation || 0,
        depth: opts.depth || 0,
        speed: opts.speed || Vector(),
        update: function () {
            if (this.updating) {
                if (!this.speed.is.zero) {
                    this.shift();
                }
                this.base.update();
            }
        },
        load: function (onload) {
            onload();
        },
        /**
         * Move the Sprite and its mask unless freemask.
         * @param {Point} pos
         */
        move: function (pos) {
            this.pos.move(pos, true);
            if (!opts.freemask) {
                this.base.move(this.pos);
            }
        },
        /**
         * @param {Point|Vector} offset
         */
        shift: function (offset) {
            var target = this.pos.add(offset || this.speed);
            this.move(target);
        }
    });
};

},{"./collision-item.js":12,"./geom/dimension.js":18,"./geom/point.js":19,"./geom/rectangle.js":21,"./geom/vector.js":23,"./util/object.js":50,"baseclassjs":2}],10:[function(require,module,exports){
var Item = require('./item.js');

/**
 * @class Collection
 * Item Collections are sets of Items with methods for
 * for manipulating Items.
 * @extends Item
 */
module.exports = function (opts) {
    var removed = false;
    return Item(opts).extend({
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

},{"./item.js":33}],11:[function(require,module,exports){
/**
 * @param {String} opts.name
 */
module.exports = function (opts) {
    /**
     * @type {Array Of CollisionItem}
     */
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
                    var intersects, colliding, solids,
                        valid = pivot.canCollideWith(other.id);

                    if (valid) {
                        intersects = pivot.intersects(other.mask);
                        colliding = pivot.isCollidingWith(other.id);
                        solids = pivot.solid && other.solid;
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
                                if (solids) {
                                    pivot.trigger('collide/$/solid', other);
                                }
                            }
                            pivot.trigger('colliding/' + other.name, other);
                            if (solids) {
                                pivot.trigger('colliding/$/solid', other);
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

},{}],12:[function(require,module,exports){
(function (global){
var Counter = require('./util/id-counter.js'),
    Rectangle = require('./geom/rectangle.js'),
    Point = require('./geom/point.js'),
    Item = require('./item.js'),
    Mouse = require('./io/mouse.js');

/**
 * @class CollisionItem
 * @extends Item
 * @param {Shape} [opts.mask] Defaults to Rectangle.
 * @param {Boolean} [opts.solid] True to collide with other
 * solid sprites.
 * @param {Array|CollisionHandler} [opts.collisionSets]
 */
module.exports = function (opts) {
    var activeCollisions = {},
        collisionsThisFrame = {},
        updated = false,
        collisionSets = [].concat(opts.collisionSets || []);

    // Provide easy way to track when dragged.
    opts.on = opts.on || {};
    opts.on['collide/screendrag'] = [].concat(
        opts.on['collide/screendrag'] || [],
        function () {
            if (!this.dragging) {
                this.dragging = true;
                Mouse.on.up(function () {
                    this.dragging = false;
                }, this);
            }
        }
    );

    return Item(opts).extend({
        id: Counter.nextId,
        name: opts.name || 'dragon-collidable',
        dragging: false,
        solid: opts.solid || false,
        mask: opts.mask || Rectangle(),
        offset: opts.offset || Point(),
        /**
         * Move the mask.
         * @param {Point} pos
         */
        move: function (pos) {
            this.mask.move(
                pos.add(this.offset)
            );
        },
        /**
         * @param {CollisionItem} other
         */
        flushWith: function (other) {
            var top = this.mask.bottom - other.mask.top,
                right = other.mask.right - this.mask.left,
                bottom = other.mask.bottom - this.mask.top,
                left = this.mask.right - other.mask.left,
                min = global.Math.min(top, right, bottom, left),
                target = this.pos.clone();
            switch (min) {
                case top:
                    target.y = other.mask.y - this.mask.height;
                    break;
                case right:
                    target.x = other.mask.right;
                    break;
                case bottom:
                    target.y = other.mask.bottom;
                    break;
                default:
                    target.x = other.mask.x - this.mask.width;
                    break;
            }
            this.move(target);
        },
        /**
         * @param {Shape} mask
         */
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
        /**
         * @param {Number} id
         */
        addCollision: function (id) {
            activeCollisions[id] = true;
            collisionsThisFrame[id] = true;
        },
        /**
         * @param {Number} id
         */
        removeCollision: function (id) {
            activeCollisions[id] = false;
        },
        clearCollisions: function () {
            activeCollisions = {};
        },
        /**
         * @param {Number} id
         */
        isCollidingWith: function (id) {
            return activeCollisions[id] || false;
        },
        /**
         * @param {Number} id
         */
        canCollideWith: function (id) {
            var self = this.id === id,
                already = collisionsThisFrame[id];
            return !self && !already;
        }
    });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./geom/point.js":19,"./geom/rectangle.js":21,"./io/mouse.js":32,"./item.js":33,"./util/id-counter.js":48}],13:[function(require,module,exports){
var Game = require('./game.js'),
    SetUtil = require('./util/set.js'),
    ObjUtil = require('./util/object.js');

module.exports = {
    // Classes
    Shape: require('./geom/shape.js'),
    Circle: require('./geom/circle.js'),
    Rectangle: require('./geom/rectangle.js'),
    Dimension: require('./geom/dimension.js'),
    Point: require('./geom/point.js'),
    Vector: require('./geom/vector.js'),
    Polar: require('./geom/polar.js'),

    FrameCounter: require('./util/frame-counter.js'),
    IdCounter: require('./util/id-counter.js'),
    random: require('./util/random.js'),
    range: SetUtil.range,
    shuffle: SetUtil.shuffle,
    mergeLeft: ObjUtil.mergeLeft,
    mergeDefault: ObjUtil.mergeDefault,

    // I/O
    Mouse: require('./io/mouse.js'),
    Key: require('./io/keyboard.js'),
    Audio: require('./io/audio.js'),
    Font: require('./io/font.js'),
    canvas: require('./io/canvas.js'),

    SpriteSheet: require('./spritesheet.js'),
    AnimationStrip: require('./animation-strip.js'),

    CollisionHandler: require('./collision-handler.js'),
    collisions: require('./dragon-collisions.js'),

    screen: Game.screen,
    sprite: Game.sprite,
    addScreens: Game.addScreens,
    removeScreen: Game.removeScreen,
    run: Game.run.bind(Game),
    kill: Game.kill,

    Screen: require('./screen.js'),
    CollisionItem: require('./collision-item.js'),
    Sprite: require('./sprite.js'),
    ClearSprite: require('./clear-sprite.js'),

    // UI Builtins
    ui: {
        Slider: require('./ui/slider.js'),
        Button: require('./ui/button.js'),
        Label: require('./ui/label.js'),
        Decal: require('./ui/decal.js')
    },

    // Interfaces
    fadeable: require('./interface/fadeable.js'),
    Eventable: require('./interface/eventable.js')
};

},{"./animation-strip.js":8,"./clear-sprite.js":9,"./collision-handler.js":11,"./collision-item.js":12,"./dragon-collisions.js":14,"./game.js":16,"./geom/circle.js":17,"./geom/dimension.js":18,"./geom/point.js":19,"./geom/polar.js":20,"./geom/rectangle.js":21,"./geom/shape.js":22,"./geom/vector.js":23,"./interface/eventable.js":25,"./interface/fadeable.js":26,"./io/audio.js":27,"./io/canvas.js":28,"./io/font.js":29,"./io/keyboard.js":31,"./io/mouse.js":32,"./screen.js":37,"./sprite.js":39,"./spritesheet.js":40,"./ui/button.js":41,"./ui/decal.js":42,"./ui/label.js":43,"./ui/slider.js":44,"./util/frame-counter.js":47,"./util/id-counter.js":48,"./util/object.js":50,"./util/random.js":51,"./util/set.js":52}],14:[function(require,module,exports){
var CollisionHandler = require('./collision-handler.js');

module.exports = CollisionHandler({
    name: 'dragon'
});

},{"./collision-handler.js":11}],15:[function(require,module,exports){
var Collection = require('./collection.js'),
    CollisionItem = require('./collision-item.js'),
    Rectangle = require('./geom/rectangle.js'),
    Point = require('./geom/point.js'),
    Dimension = require('./geom/dimension.js'),
    canvas = require('./io/canvas.js'),
    dragonCollisions = require('./dragon-collisions.js');

module.exports = Collection().add([
    require('./mask/screentap.js'),
    require('./mask/screendrag.js'),
    require('./mask/screenhold.js'),
    CollisionItem({
        name: 'screenedge/top',
        mask: Rectangle(
            Point(0, -20),
            Dimension(canvas.width, 20)
        ),
        collisionSets: dragonCollisions
    }),
    CollisionItem({
        name: 'screenedge/right',
        mask: Rectangle(
            Point(canvas.width, 0),
            Dimension(20, canvas.height)
        ),
        collisionSets: dragonCollisions
    }),
    CollisionItem({
        name: 'screenedge/bottom',
        mask: Rectangle(
            Point(0, canvas.height),
            Dimension(canvas.width, 20)
        ),
        collisionSets: dragonCollisions
    }),
    CollisionItem({
        name: 'screenedge/left',
        mask: Rectangle(
            Point(-20, 0),
            Dimension(20, canvas.height)
        ),
        collisionSets: dragonCollisions
    })
]);

},{"./collection.js":10,"./collision-item.js":12,"./dragon-collisions.js":14,"./geom/dimension.js":18,"./geom/point.js":19,"./geom/rectangle.js":21,"./io/canvas.js":28,"./mask/screendrag.js":34,"./mask/screenhold.js":35,"./mask/screentap.js":36}],16:[function(require,module,exports){
var FrameCounter = require('./util/frame-counter.js'),
    canvas = require('./io/canvas.js'),
    ctx = canvas.ctx,
    Counter = require('./util/id-counter.js'),
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
    debug: require('./util/debug-console.js'),
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

},{"./dragon-collisions.js":14,"./dragon-masks.js":15,"./io/canvas.js":28,"./util/debug-console.js":45,"./util/frame-counter.js":47,"./util/id-counter.js":48}],17:[function(require,module,exports){
(function (global){
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

                if (this.x >= rect.right) pt.x = rect.right;
                else if (this.x <= rect.x) pt.x = rect.x;
                if (this.y >= rect.bottom) pt.y = rect.bottom;
                else if (this.y <= rect.y) pt.y = rect.y;

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
        center: function () {
            return Point(this.x, this.y);
        },
        draw: function (ctx) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(250, 50, 50, 0.5)';
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            ctx.stroke();
        },
        /**
         * @param {Point} pos
         */
        move: function (pos) {
            this.x = pos.x;
            this.y = pos.y;
            this.top = pos.y - this.radius;
            this.right = pos.x + this.radius;
            this.bottom = pos.y + this.radius;
            this.left = pos.x - this.radius;
        },
        /**
         * @param {Dimension} size
         */
        resize: function (size) {
            var rad = global.Math.max(size.width, size.height);
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./dimension.js":18,"./point.js":19,"./shape.js":22,"./vector.js":23}],18:[function(require,module,exports){
var ZERO = require('./zero.js');

/**
 * @class Dimension
 * @param {Number} w
 * @param {Number} h
 */
module.exports = function (w, h) {
    var self = {
        width: w || 0,
        height: h || 0,
        clone: function () {
            return module.exports(this.width, this.height);
        },
        equals: function (other) {
            return (
                this.width === other.width &&
                this.height === other.height
            );
        },
        is: {
            /**
             * @return {Boolean}
             */
            get zero () {
                return self.equals(ZERO);
            }
        },
        /**
         * @param {Dimension} scale
         * @param {Boolean} [shallow] True to mutate.
         * @return {Dimension}
         */
        multiply: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.width *= scale.width;
            target.height *= scale.height;
            return target;
        },
        divide: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.width /= scale.width;
            target.height /= scale.height;
            return target;
        },
        add: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.width += scale.width;
            target.height += scale.height;
            return target;
        },
        subtract: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.width -= scale.width;
            target.height -= scale.height;
            return target;
        }
    };
    return self;
};

},{"./zero.js":24}],19:[function(require,module,exports){
var ZERO = require('./zero.js');

/**
 * @class Point
 * @param {Number} x
 * @param {Number} y
 */
module.exports = function (x, y) {
    var self = {
        x: x || 0,
        y: y || 0,
        /**
         * @return {Point}
         */
        clone: function () {
            return module.exports(this.x, this.y);
        },
        /**
         * @param {Point} other
         * @return {Boolean}
         */
        equals: function (other) {
            return (
                this.x === other.x &&
                this.y === other.y
            );
        },
        is: {
            /**
             * @return {Boolean} True if equal to (0,0).
             */
            get zero () {
                return self.equals(ZERO);
            }
        },
        /**
         * @param {Point} pos
         * @param {Boolean} [shallow] True to mutate.
         * @return {Point} This point after moving.
         */
        move: function (pos, shallow) {
            var target = shallow ? this : this.clone();
            target.x = pos.x;
            target.y = pos.y;
            return target;
        },
        /**
         * @param {Point|Vector} offset
         * @param {Boolean} [shallow] True to mutate.
         * @return {Point} This point after shifting.
         */
        multiply: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.x *= scale.x;
            target.y *= scale.y;
            return target;
        },
        divide: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.x /= scale.x;
            target.y /= scale.y;
            return target;
        },
        add: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.x += scale.x;
            target.y += scale.y;
            return target;
        },
        subtract: function (scale, shallow) {
            var target = shallow ? this : this.clone();
            target.x -= scale.x;
            target.y -= scale.y;
            return target;
        }
    };
    return self;
};

},{"./zero.js":24}],20:[function(require,module,exports){
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
            var Vector = require('./vector.js');
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

},{"./vector.js":23}],21:[function(require,module,exports){
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
        center: function () {
            return Point(
                this.x + this.width / 2,
                this.y + this.height / 2
            );
        },
        /**
         * @param {Point} pos
         */
        move: function (pos) {
            this.x = pos.x;
            this.y = pos.y;
            this.top = pos.y;
            this.right = pos.x + this.width;
            this.bottom = pos.y + this.height;
            this.left = pos.x;
        },
        /**
         * @param {Point} offset
         */
        shift: function (offset) {
            this.move(
                this.pos().add(offset)
            );
        },
        /**
         * @param {Dimension} size
         */
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

},{"./dimension.js":18,"./point.js":19,"./shape.js":22,"./vector.js":23}],22:[function(require,module,exports){
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
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        pos: function () {
            return Point(this.x, this.y);
        },
        name: opts.name,
        move: BaseClass.Abstract,
        resize: BaseClass.Abstract,
        /**
         * @param {Shape} other
         */
        intersects: function (other) {
            return intersectMap[other.name].call(this, other);
        },
        draw: BaseClass.Stub
    });
};

},{"./point.js":19,"baseclassjs":2}],23:[function(require,module,exports){
var ZERO = require('./zero.js');

/**
 * @class Vector
 * @param {Number} [x] Defaults to 0.
 * @param {Number} [y] Defaults to 0.
 */
module.exports = function (x, y) {
    var self = {
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
            return module.exports(
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
        is: {
            /**
             * @return {Boolean} True if equal to <0,0>.
             */
            get zero () {
                return self.equals(ZERO);
            }
        },
        toPolar: function () {
            var Polar = require('./polar.js');
            return Polar(
                Math.atan(this.y / this.x),
                this.magnitude
            );
        },
        /**
         * @param {Vector} scale
         */
        multiply: function (scale) {
            this.x *= scale.x;
            this.y *= scale.y;
            return this;
        },
        divide: function (scale) {
            this.x /= scale.x;
            this.y /= scale.y;
            return this;
        },
        add: function (scale) {
            this.x += scale.x;
            this.y += scale.y;
            return this;
        },
        subtract: function (scale) {
            this.x -= scale.x;
            this.y -= scale.y;
            return this;
        }
    };
    return self;
};

},{"./polar.js":20,"./zero.js":24}],24:[function(require,module,exports){
module.exports = {
    x: 0,
    y: 0,
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0
};

},{}],25:[function(require,module,exports){
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
        events[name] = [].concat(
            opts.events[name]
        );
    }
    for (name in opts.singles) {
        singles[name] = [].concat(
            opts.singles[name]
        );
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

},{"baseclassjs":2}],26:[function(require,module,exports){
var BaseClass = require('baseclassjs');

module.exports = BaseClass.Interface({
    fadeIn: function () {},
    fadeOut: function () {}
});

},{"baseclassjs":2}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
var mobile = require('../util/detect-mobile.js'),
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

},{"../util/detect-mobile.js":46}],29:[function(require,module,exports){
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

},{"curb":6}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
(function (global){
var Point = require('../geom/point.js'),
    Vector = require('../geom/vector.js'),
    canvas = require('./canvas.js'),
    dragStart = null,
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
        dragStart = null;
    }
);
canvas.addEventListener(
    moveEventName,
    function (event) {
        last = current;
        current = getOffset(event);

        if (isDown && !isDragging) {
            shift.x = current.x - last.x;
            shift.y = current.y - last.y;
            // Drag threshold.
            if (shift.magnitude > 1) {
                isDragging = true;
                dragStart = current;
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
    get dragStart () {
        return dragStart;
    },
    on: {
        down: function (cb, thisArg) {
            canvas.addEventListener(
                startEventName,
                cb.bind(thisArg)
            );
        },
        click: function (cb, thisArg) {},
        dclick: function (cb, thisArg) {},
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
        },
        drag: function (cb, thisArg) {
            canvas.addEventListener(moveEventName, function () {
                if (isDragging) {
                    cb.call(thisArg);
                }
            });
        },
        /**
         * @param {String} dir Swipe direction.
         * @param {Function cb
         * @param {Any} thisArg
         */
        swipe: function (dir, cb, thisArg) {}
    },
    eventName: {
        start: startEventName,
        move: moveEventName,
        end: endEventName
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../geom/point.js":19,"../geom/vector.js":23,"./canvas.js":28}],33:[function(require,module,exports){
var BaseClass = require('baseclassjs'),
    Eventable = require('./interface/eventable.js');

/**
 * @class Item
 * Item is the most basic contract in the Dragon game engine. Almost
 * everything in the engine is derived from Item - including Sprites
 * and Screens.
 * @implements Eventable
 * @param {String} [name]
 * @param {Map Of Functions} [opts.on] Dictionary of events.
 * @param {Map of Functions} [opts.one] Dictionary of one-time events.
 */
module.exports = function (opts) {
    opts = opts || {};

    return BaseClass({
        name: opts.name || 'dragon-item',
        depth: 0,
        updating: (typeof opts.updating === 'boolean') ? opts.updating : true,
        drawing: (typeof opts.drawing === 'boolean') ? opts.drawing : true,
        update: BaseClass.Stub,
        draw: BaseClass.Stub,
        teardown: BaseClass.Stub,
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
        }
    }).implement(
        Eventable({
            events: opts.on,
            singles: opts.one
        })
    );
};

},{"./interface/eventable.js":25,"baseclassjs":2}],34:[function(require,module,exports){
var CollisionItem = require('../collision-item.js'),
    Circle = require('../geom/circle.js'),
    Point = require('../geom/point.js'),
    Mouse = require('../io/mouse.js'),
    dragonCollisions = require('../dragon-collisions.js');

/**
 * @class ScreenDrag
 * @extends CollisionItem
 */
module.exports = CollisionItem({
    name: 'screendrag',
    mask: Circle(Point(), 8),
    collisionSets: dragonCollisions,
    updating: false,
    drawing: false
}).extend({
    update: function () {
        this.move(Mouse.offset);
        this.base.update();
    }
});

Mouse.on.drag(function () {
    this.start();
}, module.exports);
Mouse.on.up(function () {
    this.stop();
}, module.exports);

},{"../collision-item.js":12,"../dragon-collisions.js":14,"../geom/circle.js":17,"../geom/point.js":19,"../io/mouse.js":32}],35:[function(require,module,exports){
var CollisionItem = require('../collision-item.js'),
    Circle = require('../geom/circle.js'),
    Point = require('../geom/point.js'),
    Mouse = require('../io/mouse.js'),
    dragonCollisions = require('../dragon-collisions.js');

/**
 * @class ScreenHold
 * @extends CollisionItem
 */
module.exports = CollisionItem({
    name: 'screenhold',
    mask: Circle(Point(), 8),
    collisionSets: dragonCollisions,
    updating: false,
    drawing: false
}).extend({
    update: function () {
        this.move(Mouse.offset);
        this.base.update();
    }
});

Mouse.on.down(function () {
    this.start();
}, module.exports);
Mouse.on.drag(function () {
    this.stop();
}, module.exports);
Mouse.on.up(function () {
    this.stop();
}, module.exports);

},{"../collision-item.js":12,"../dragon-collisions.js":14,"../geom/circle.js":17,"../geom/point.js":19,"../io/mouse.js":32}],36:[function(require,module,exports){
var CollisionItem = require('../collision-item.js'),
    Circle = require('../geom/circle.js'),
    Point = require('../geom/point.js'),
    Mouse = require('../io/mouse.js'),
    dragonCollisions = require('../dragon-collisions.js');

/**
 * @class ScreenTap
 * @extends CollisionItem
 */
module.exports = CollisionItem({
    name: 'screentap',
    mask: Circle(Point(), 8),
    collisionSets: dragonCollisions
}).extend({
    update: function () {
        this.move(Mouse.offset);
        this.base.update();
        this.stop();
    }
});

Mouse.on.down(function () {
    this.start();
}, module.exports);

},{"../collision-item.js":12,"../dragon-collisions.js":14,"../geom/circle.js":17,"../geom/point.js":19,"../io/mouse.js":32}],37:[function(require,module,exports){
var SpriteSet = require('./sprite-set.js');

/**
 * @class Screen
 * @extends SpriteSet
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

    return SpriteSet(opts).extend({
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
    });
};

},{"./sprite-set.js":38}],38:[function(require,module,exports){
var Counter = require('./util/id-counter.js'),
    Collection = require('./collection.js');

/**
 * @class SpriteSet
 * @extends Collection
 * Item Collection specifically for handing Sprites.
 */
module.exports = function (opts) {
    var spritesToAdd = [],
        loadQueue = {};

    return Collection(opts).extend({
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

},{"./collection.js":10,"./util/id-counter.js":48}],39:[function(require,module,exports){
(function (global){
var ClearSprite = require('./clear-sprite.js'),
    Point = require('./geom/point.js'),
    Dimension = require('./geom/dimension.js'),
    Rectangle = require('./geom/rectangle.js'),
    Util = require('./util/object.js');

/**
 * @class Sprite
 * Most common use-case sprite that contains collision
 * logic and textures.
 * @extends ClearSprite
 * @param {Map Of AnimationStrip} [opts.strips]
 * @param {String} [opts.startingStrip] Defaults to first
 * strip name.
 */
module.exports = function (opts) {
    var loaded = false,
        stripMap = opts.strips || {};

    Util.mergeDefaults(opts, {
        name: 'dragon-texture-sprite',
        startingStrip: opts.startingStrip || global.Object.keys(stripMap)[0],
    });
    opts.size = opts.size || (stripMap[opts.startingStrip] || {}).size;

    return ClearSprite(opts).extend({
        strip: stripMap[opts.startingStrip],
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
        start: function () {
            this.base.start();
            this.strip.start();
        },
        pause: function () {
            this.base.pause();
            this.strip.pause();
        },
        stop: function () {
            this.base.stop();
            this.strip.stop();
        },
        update: function () {
            if (this.updating) {
                this.strip.update();
            }
            this.base.update();
        },
        draw: function (ctx) {
            if (this.drawing) {
                this.strip.draw(
                    ctx,
                    this.pos,
                    Dimension(
                        this.scale * this.size.width / this.strip.size.width,
                        this.scale * this.size.height / this.strip.size.height
                    ),
                    this.rotation
                );
            }
            this.base.draw(ctx);
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
        }
    });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./clear-sprite.js":9,"./geom/dimension.js":18,"./geom/point.js":19,"./geom/rectangle.js":21,"./util/object.js":50}],40:[function(require,module,exports){
var createImage = require('./io/image.js'),
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

},{"./io/image.js":30}],41:[function(require,module,exports){
var Sprite = require('../sprite.js'),
    Rectangle = require('../geom/rectangle.js'),
    Point = require('../geom/point.js'),
    AnimationStrip = require('../animation-strip.js'),
    SpriteSheet = require('../spritesheet.js'),
    collisions = require('../dragon-collisions.js');

/**
 * @class Button
 * @extends Sprite
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

},{"../animation-strip.js":8,"../dragon-collisions.js":14,"../geom/point.js":19,"../geom/rectangle.js":21,"../sprite.js":39,"../spritesheet.js":40}],42:[function(require,module,exports){
var Sprite = require('../sprite.js'),
    AnimationStrip = require('../animation-strip.js'),
    SpriteSheet = require('../spritesheet.js');

/**
 * @class Decal
 * A decal is a sprite that has no collision logic and
 * displays as an image only.
 * @extends Sprite
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
    return Sprite(opts);
};

},{"../animation-strip.js":8,"../sprite.js":39,"../spritesheet.js":40}],43:[function(require,module,exports){
var ClearSprite = require('../clear-sprite.js');

/**
 * @class Label
 * @extends ClearSprite
 * Labels do not have collision logic nor are they displayed
 * from image assets. Labels instead contain only text.
 * @param {String} opts.text
 * @param {Number} [opts.depth]
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

},{"../clear-sprite.js":9}],44:[function(require,module,exports){
var Sprite = require('../sprite.js'),
    Dimension = require('../geom/dimension.js'),
    Rectangle = require('../geom/rectangle.js'),
    Point = require('../geom/point.js'),
    AnimationStrip = require('../animation-strip.js'),
    SpriteSheet = require('../spritesheet.js'),
    ClearSprite = require('../clear-sprite.js'),
    collisions = require('../dragon-collisions.js');

/**
 * @class Slider
 * @extends ClearSprite
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

},{"../animation-strip.js":8,"../clear-sprite.js":9,"../dragon-collisions.js":14,"../geom/dimension.js":18,"../geom/point.js":19,"../geom/rectangle.js":21,"../sprite.js":39,"../spritesheet.js":40}],45:[function(require,module,exports){
module.exports = {
    show: {
        fps: function () {}
    }
};

},{}],46:[function(require,module,exports){
/**
 * @see https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
 */
module.exports = 'ontouchstart' in window;

},{}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
var Lumberjack = require('lumberjackjs');

module.exports = Lumberjack();

},{"lumberjackjs":7}],50:[function(require,module,exports){
module.exports = {
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
    mergeDefaults: function (root, other) {
        var key;
        for (key in other) {
            if (!(key in root)) {
                root[key] = other[key];
            }
        }
    }
};

},{}],51:[function(require,module,exports){
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
},{}],52:[function(require,module,exports){
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
    }
};

},{"./random.js":51}],53:[function(require,module,exports){
var $ = require('dragonjs');

module.exports = $.CollisionHandler({
    name: 'lerp'
});

},{"dragonjs":13}],54:[function(require,module,exports){
var $ = require('dragonjs');

$.addScreens([
    require('./screens/lerp.js')
]);
$.run(true);

},{"./screens/lerp.js":55,"dragonjs":13}],55:[function(require,module,exports){
var $ = require('dragonjs'),
    Static = require('../sprites/static.js');

module.exports = $.Screen({
    name: 'lerp',
    collisionSets: [
        require('../collisions/lerp.js')
    ],
    spriteSet: [
        Static({
            pos: $.Point(
                $.canvas.width / 2,
                $.canvas.height / 2
            ),
            moving: false
        }),
        Static({
            pos: $.Point(
                $.canvas.width / 2 + 90,
                $.canvas.height / 2 + 50
            )
        }),
        require('../sprites/drag.js'),
        require('../sprites/label.js')
    ],
    one: {
        ready: function () {
            this.start();
        }
    }
}).extend({
    draw: function (ctx, debug) {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, $.canvas.width, $.canvas.height);
        this.base.draw(ctx, debug);
    }
});

},{"../collisions/lerp.js":53,"../sprites/drag.js":56,"../sprites/label.js":57,"../sprites/static.js":58,"dragonjs":13}],56:[function(require,module,exports){
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
    pos: $.Point(20, 20),
    on: {
        'colliding/$/solid': function (other) {
            this.flushWith(other);
        }
    }
}).extend({
    update: function () {
        var offset;
        if (this.dragging) {
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
    move: function (pos) {
        label.stop();
        this.base.move(pos);
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

},{"../collisions/lerp.js":53,"./label.js":57,"dragonjs":13}],57:[function(require,module,exports){
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

},{"dragonjs":13}],58:[function(require,module,exports){
(function (global){
var $ = require('dragonjs');

/**
 * @param {Point} opts.pos
 * @param {Boolean} opts.moving
 */
module.exports = function (opts) {
    var theta = 0;
    opts.pos.subtract($.Point(-32, -32), true);
    return $.ClearSprite({
        name: 'static',
        solid: true,
        collisionSets: require('../collisions/lerp.js'),
        mask: $.Rectangle(),
        size: $.Dimension(64, 64),
        pos: opts.pos
    }).extend({
        draw: function (ctx) {
            ctx.fillStyle = '#444';
            ctx.fillRect(
                this.pos.x,
                this.pos.y,
                this.size.width,
                this.size.height
            );
        },
        update: function () {
            if (opts.moving) {
                theta += 0.1;
                theta %= 3.1415;
                this.speed.x = 2 * global.Math.sin(theta);
                this.speed.y = 2 * global.Math.cos(theta);
            }
            this.base.update();
        }
    });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../collisions/lerp.js":53,"dragonjs":13}]},{},[54]);
