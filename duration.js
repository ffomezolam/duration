/**
 * Exports a class for converting and expressing durations of time
 *
 * @module duration
 */
(function(name, context, definition) {
    if(typeof module !== 'undefined' && module.exports) module.exports = definition();
    else if(typeof define === 'function' && define.amd) define(definition);
    else context[name] = definition();
})('Duration', this, function() {
    var ms  = { full: 'millisecond',    abbr: 'ms',     ref: 0 },
        s   = { full: 'second',         abbr: 's',      ref: 1 },
        min = { full: 'minute',         abbr: 'min',    ref: 2 },
        hr  = { full: 'hour',           abbr: 'hr',     ref: 3 },
        day = { full: 'day',            abbr: 'day',    ref: 4 },
        wk  = { full: 'week',           abbr: 'wk',     ref: 5 },
        mo  = { full: 'month',          abbr: 'mo',     ref: 6 },
        yr  = { full: 'year',           abbr: 'yr',     ref: 7 };

    var units = {
        ms: ms,
        s: s,
        min: min,
        hr: hr,
        day: day,
        wk: wk,
        mo: mo,
        yr: yr
    }

    var conversions = [
        { unit: 'ms',   'next': 1000 },
        { unit: 's',    'next': 60 },
        { unit: 'min',  'next': 60 },
        { unit: 'hr',   'next': 24 },
        { unit: 'day',  'next': 7 },
        { unit: 'wk',   'next': 4.345238 },
        { unit: 'mo',   'next': 12 },
        { unit: 'yr',   'next': null }
    ];

    var globals = {
        value: 0,
        unit: 3
    };

    // pluralize appropriate strings
    function pluralize(s) {
        return s.substr(-1) == 's' ? s : s + 's';
    }

    // format as string
    function makeString(n, u, a) {
        // unit is string
        u = typeof(u) == 'number' ? conversions[u]['unit'] : u;
        var name = a ? units[u]['abbr'] : ' ' + units[u]['full'];
        return n + (Math.abs(n) == 1 ? name : pluralize(name));
    }

    function unitNum(s) {
        return typeof(s) == 'number' ? s : units[s]['ref'];
    }

    // utility function for decimal precision rounding
    function decimalRound(v, x) {
        if(!x) return Math.round(v);
        v = v.toString().split('e');
        v = Math.round(+(v[0] + 'e' + (v[1] ? (+v[1] + x) : x)));
        v = v.toString().split('e');
        return +(v[0] + 'e' + (v[1] ? (+v[1] - x) : -x));
    }

    /**
     * Class for handling duration conversions
     *
     * @class Duration
     * @constructor
     * @param {String} b Base unit
     * @param {Object} opts Options
     */
    function Duration(b, opts) {
        this._base = units[b || 'hr']['ref'];
        this._abbr = false;
        this._value = 0;
        this._unit = 3;
        this._thresh = 0.05;

        /**
         * Decimal precision
         *
         * @property precision
         * @type Number
         * @default 2
         */
        this.precision = opts && 'precision' in opts ? opts.precision : 2;
    }

    /**
     * Convert duration from one unit to another
     *
     * @method convert
     * @static
     * @param {Number} n Number to convert
     * @param {String} from Unit to convert from
     * @param {String} to Unit to convert to
     * @param {Number} precision Decimal precision
     * @return {Object} Converted duration in form { duration, unit }
     */
    Duration.convert = function(n, from, to, precision) {
        precision = precision || 2;
        var cu = typeof(from) == 'string' ? units[from]['ref'] : from;
        var du = typeof(to) == 'string' ? units[to]['ref'] : to;

        if(du < cu) {
            while(du < cu) {
                cu--;
                n *= conversions[cu]['next'];
            }
        } else if(du > cu) {
            while(du > cu) {
                n /= conversions[cu]['next'];
                cu++;
            }
        }

        return { duration: decimalRound(n, precision), unit: to };
    }

    /**
     * Convert duration to most concise representation
     *
     * @method concise
     * @static
     * @param {Number} n Number to convert
     * @param {String} u Unit to convert from
     * @param {Number} p Decimal Precision
     * @return {Object} Converted duration in form { duration, unit }
     */
    Duration.concise = function(n, u, p) {
        var ref = units[u]['ref'];
        var max = conversions[ref].next;
        if(n < 1) {
            if(ref <= 0) return { duration: n, unit: u }

            var prev = Duration.convert(n, u, conversions[ref - 1].unit, p);
            return Duration.concise(prev.duration, prev.unit);
        } else if(n >= max) {
            if(ref >= conversions.length - 1) return { duration: n, unit: u };

            var next = Duration.convert(n, u, conversions[ref + 1].unit, p);
            return Duration.concise(next.duration, next.unit);
        }

        return { duration: n, unit: u };
    }

    /**
     * Convert duration to units
     *
     * @method to
     * @chainable
     * @param {Number} n Number to convert (base unit)
     * @param {String} u Unit to convert to
     */
    Duration.prototype.to = function(n, u) {
        var r = Duration.convert(n, this._base, u, this.precision);
        this._value = r.duration;
        this._unit = r.unit;
        return this;
    }

    /**
     * Convert duration to most concise representation
     *
     * @method concise
     * @chainable
     * @param {Number} n Number to convert
     */
    Duration.prototype.concise = function(n) {
        var r = Duration.concise(n, this._base, this.precision);
        this._value = r.duration;
        this._unit = r.unit;
        return this;
    }

    /**
     * Set base unit
     * 
     * @method base
     * @chainable
     * @param {String} s New base unit
     */
    Duration.prototype.base = function(s) {
        if(s in units) this._base = s;
        return this;
    }

    /**
     * Set abbreviation
     *
     * @method abbr
     * @chainable
     * @param {Boolean} [o] Abbreviate flag
     */
    Duration.prototype.abbr = function(o) {
        if(typeof o == 'undefined') o = this._abbr;
        this._abbr = !!o;
        return this;
    }

    /**
     * Get duration
     *
     * @method get
     * @return {Object} Duration in form { duration, unit }
     */
    Duration.prototype.get = function() {
        return { duration: this._value, unit: this._unit };
    }

    /**
     * Get most recent unit
     *
     * @method unit
     * @return {String} Unit name
     */
    Duration.prototype.unit = function() {
        var u = units[this._unit];
        return this._abbr ? u['abbr'] : u['full'];
    }

    /**
     * Get most recent duration
     *
     * @method duration
     * @return {Number} Duration
     */
    Duration.prototype.duration = function() {
        return this._value;
    }

    /**
     * Get duration as string
     *
     * @method toString
     * @param {String} [sep] Separator between value and unit
     * @return {String} Duration as string
     */
    Duration.prototype.toString = function(sep) {
        sep = sep || " ";
        var v = this._value;
        var u = units[this._unit];
        u = this._abbr ? u['abbr'] : u['full'];
        return v + sep + u;
    }

    return Duration;
});
