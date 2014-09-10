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

    var unitRefs = [
        { unit: 'ms',   'next': 1000 },
        { unit: 's',    'next': 60 },
        { unit: 'min',  'next': 60 },
        { unit: 'hr',   'next': 24 },
        { unit: 'day',  'next': 7 },
        { unit: 'wk',   'next': 4.345238 },
        { unit: 'mo',   'next': 12 },
        { unit: 'yr',   'next': null }
    ];

    // pluralize appropriate strings
    function pluralize(s) {
        return s.substr(-1) == 's' ? s : s + 's';
    }

    function unitRef(s) {
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

    var options = {
        abbr: true,
        precision: 2
    };

    /**
     * Class for handling duration conversion
     *
     *      var d = new Duration(1, 'hr');
     *      var o = d.to('min'); // convert to minutes - o is a Duration instance
     *      console.log(o.duration()); // "60"
     *      console.log(o.unit()); // "min"
     *
     * @class Duration
     * @constructor
     * @param {Number} [n] Value (default 2)
     * @param {String} [b] Unit (default hr)
     * @param {Object} [opts] Options: precision (number), abbr (boolean)
     */
    function Duration(n, b, opts) {
        this._duration = typeof n == 'number' ? n : 1;
        this._unit = b in units ? b : 'hr';

        this._precision = (opts && 'precision' in opts && typeof opts.precision == 'number') ? opts.precision : options.precision;
        this._abbr = (opts && 'abbr' in opts && typeof opts.abbr == 'boolean') ? opts.abbr : options.abbr;
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
     * @return {Duration} Converted duration as Duration instance
     */
    Duration.convert = function(n, from, to, precision) {
        precision = precision || 2;
        var cu = (typeof(from) == 'string' && from in units) ? unitRef(from) : unitRef('hr');
        var du = (typeof(to) == 'string' && to in units) ? unitRef(to) : unitRef('hr');

        if(du < cu) {
            while(du < cu) {
                cu--;
                n *= unitRefs[cu]['next'];
            }
        } else if(du > cu) {
            while(du > cu) {
                n /= unitRefs[cu]['next'];
                cu++;
            }
        }

        return new Duration(n, unitRefs[du]['unit'], { precision: precision });
    }

    /**
     * Convert duration to most concise representation
     *
     * @method concise
     * @static
     * @param {Number} n Number to convert
     * @param {String} u Unit to convert from
     * @param {Number} p Decimal Precision
     * @return {Duration} Converted duration as Duration instance
     */
    Duration.concise = function(n, u, p) {
        var ref = (typeof(u) == 'string' && u in units) ? unitRef(u) : unitRef('hr');
        var max = unitRefs[ref].next;

        if(n < 1) {
            if(ref <= 0) return new Duration(n, u, { precision: p });

            var prev = Duration.convert(n, u, unitRefs[ref - 1].unit, p);
            return Duration.concise(prev.duration(), prev.unit(), p);
        } else if(n >= max) {
            if(ref >= unitRefs.length - 1) return new Duration(n, u, { precision: p });

            var next = Duration.convert(n, u, unitRefs[ref + 1].unit, p);
            return Duration.concise(next.duration(), next.unit());
        }

        return new Duration(n, u, { precision: p });
    }

    /**
     * Convert duration to units
     *
     * @method to
     * @param {String} u Unit to convert to
     * @return {Duration} Duration object with converted value and unit
     */
    Duration.prototype.to = function(u) {
        return Duration.convert(this._duration, this._unit, u, this._precision).abbr(this._abbr);
    }

    /**
     * Alias for to()
     *
     * @method convert
     * @param {String} u Unit to convert to
     * @return {Duration} Duration object with converted value and unit
     */
    Duration.prototype.convert = function(u) {
        return this.to(u);
    }

    /**
     * Convert duration to most concise representation
     *
     * @method concise
     * @return {Duration} Duration object with converted value and unit
     */
    Duration.prototype.concise = function() {
        return Duration.concise(this._duration, this._unit, this._precision).abbr(this._abbr);
    }

    /**
     * Set or get base unit
     *
     * @method unit
     * @chainable
     * @param {String} [s] Unit to set
     * @return {Duration|String} Chainable object if setter, unit if getter
     */
    Duration.prototype.unit = function(s) {
        if(!s) return this._unit;
        if(s in units) this._unit = s;
        return this;
    }

    /**
     * Get or set duration
     *
     * @method duration
     * @chainable
     * @param {Number} [d] Duration to set
     * @return {Duration|Number} Chainable object if setter, duration if getter
     */
    Duration.prototype.duration = function(d) {
        if(typeof d == 'undefined') return this._duration;
        if(typeof d == 'number') this._duration = d;
        return this;
    }

    /**
     * Set or get abbreviation option
     *
     * @method abbr
     * @chainable
     * @param {Boolean} [o] Abbreviate flag
     * @return {Duration|Boolean} Chainable object if setter, abbreviation
     * option if getter
     */
    Duration.prototype.abbr = function(o) {
        if(typeof o == 'undefined') return this._abbr;
        this._abbr = !!o;
        return this;
    }

    /**
     * Get duration as string
     *
     * @method toString
     * @param {String} [sep] Separator between value and unit
     * @return {String} Duration as string
     */
    Duration.prototype.toString = function(sep) {
        sep = typeof sep == 'string' ? sep : " ";
        var d = this._duration,
            u = units[this._unit];
        u = this._abbr ? u['abbr'] : u['full'];
        return d + sep + pluralize(u);
    }

    return Duration;
});
