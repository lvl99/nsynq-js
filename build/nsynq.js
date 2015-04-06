/* *nsynq
 * Schedule JS operations along a timeline progression defined by `n`.
 *
 * @author Matt Scheurich <matt@lvl99.com>
 * @license MIT
 * @version 0.1.0-alpha
 */

/*
The MIT License (MIT)
Copyright (c) 2015 Matt Scheurich, http://www.lvl99.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var Nsynq = function ( timelineLength, ops ) {
  var self = this;

  /* The array which holds the rendered timeline information.
   *
   * @method timeline
   * @type {array}
   * @since 0.1.0-alpha
   */
  self.timeline = [];

  /* The length of the timeline to render to.
   *
   * @method timelineLength
   * @type {int}
   * @since 0.1.0-alpha
   */
  self.timelineLength = 0;

  /* The operations to fire at points on the timeline. Points are marked by
   * string expressions.
   *
   * @method ops
   * @type {object}
   * @since 0.1.0-alpha
   */
  self.ops = {};

  /* The expressions to match and set operations to point `n` on the timeline.
   * Multiple expressions can be separated by `and` and `,`.
   *
   * @method exp
   * @type {object}
   * @since 0.1.0-alpha
   */
  self.exp = {
    // `n gt 100` matches to `n > 100`
    gt: function ( n, a ) {
      return n > parseInt( a, 10 );
    },

    // `n gte 100` matches to `n >= 100`
    gte: function ( n, a ) {
      return n >= parseInt( a, 10 );
    },

    // `n lt 100` matches to `n < 100`
    lt: function ( n, a ) {
      return n < parseInt( a, 10 );
    },

    // `n lte 100` matches to `n >= 100`
    lte: function ( n, a ) {
      return n <= parseInt( a, 10 );
    },

    // `n eq 100` matches to `n == 100`
    eq: function ( n, a ) {
      return n == parseInt( a, 10 );
    },

    // `n is 100` matches to `n === 100`
    is: function ( n, a ) {
      return n === parseInt( a, 10 );
    },

    // `n within 100-200` matches to `n >= 100 && n <= 200`
    within: function ( n, range ) {
      range = range.split('-');
      return ( n >= parseInt( range[0], 10 ) && n <= parseInt( range[1], 10 ) );
    },

    // `n outside 100-200` matches to `n < 100 || n > 200`
    outside: function ( n, range ) {
      range = range.split('-');
      return ( n < parseInt( range[0], 10 ) || n > parseInt( range[1], 10 ) );
    },

    // `n around 1000:200` matches to `n >= 800 && n <= 1200`
    around: function ( n, input ) {
      var a, tolerance;

      input = input.split( ':' );
      a = parseInt( input[0], 10 );
      tolerance = parseInt( input[1], 10 );

      return ( n >= (a - tolerance) && n <= (a + tolerance) );
    },

    // `per 100 n` matches to `n % 100 === 0`
    per: function ( n, a ) {
      return n % parseInt( a, 10 ) === 0;
    },

    // `approx 100:5 n` matches to `n >= 95 && n <= 105`
    approx: function ( n, input ) {
      var a, tolerance, mod;

      input = input.split( ':' );
      a = parseInt( input[0], 10 );
      tolerance = parseInt( input[1], 10 );
      mod = n % a;

      return ( mod >= (a - tolerance) || mod <= tolerance );
    }
  };

  /* Renders the timeline using the operations and expressions from `self.ops`.
   *
   * @method renderTimeline
   * @param {int} timelineLength The length of the timeline
   * @param {object} ops An object containing multiple expressions as string
   *                     keys to match `n` on the various points on the timeline
   * @returns {void}
   * @since 0.1.0-alpha
   */
  self.renderTimeline = function ( timelineLength, ops ) {
    var timeline = [];
    self.timelineLength = timelineLength;
    self.ops = ops || self.ops;
    self._ops = [];

    // Ops in invalid or no timelineLength set, abort further actions
    if ( !self.ops || !self.timelineLength ) {
      if ( !self.ops ) console.log( 'No operations to render' );
      if ( !self.timelineLength ) console.log( 'No timeline length to render to' );
      return;
    }

    // Process each operation (defined by an expression key, e.g. `n eq 500`, `n within 100-200, do per 50 n`)
    for ( var t in self.ops ) {
      var exp = self.processExp( t, self.ops[t] );
      self._ops.push( exp );
    }

    // Generate the timeline
    for ( var n = 0; n <= self.timelineLength; n++ ) {
      timeline[n] = [];

      // Go through the operations to see if it can be added to the timeline at this point
      for ( var o = 0; o < self._ops.length; o++ ) {
        var op = self._ops[o];

        // Process each expression to check if operation can be performed at this point in timeline
        var isTrue = 0;
        for ( var x = 0; x < op.exp.length; x++ ) {
          var exp = op.exp[x];
          if ( !self.checkExp(n, exp) ) {
            break;
          }
          isTrue++;
        }

        // Only add if both expressions are true
        // @todo support `or`
        if ( isTrue === op.exp.length ) {
          timeline[n].push( op.op );
        }
      }
    }

    self.timeline = timeline;
  };

  /* Process an expression to figure out when it fires on the timeline
   * and what operation it fires.
   *
   * @method processExp
   * @param {string} exp A string hash contained within `self.ops`
   * @returns {object}
   * @since 0.1.0-alpha
   */
  self.processExp = function ( exp, op ) {
    var _exp = {};

    // Multiple expressions given
    if ( /,/.test(exp) ) {
      exp = exp.split(/\s*,\s*/);

    // Only one specified
    } else {
      exp = [ exp ];
    }

    // Process multiple expressions to match on
    _exp.exp = [];
    for ( var x = 0; x < exp.length; x++ ) {
      var e = exp[x];

      // Split by `and`
      // @todo support `or`
      if ( /and/.test(e) ) {
        e = e.split('and');
      } else {
        e = [ e ];
      }

      // Get each expression
      for ( var y = 0; y < e.length; y++ ) {
        var match = e[y].match( /([^\s]+) ([\d-:]+)/ );
        // match[1] == expression string hash in `self.exp` object
        // match[2] == the number (or other string — effectively `n`) to match on the timeline
        _exp.exp.push([match[1], match[2]]);
      }
    }

    _exp.op = op;

    return _exp;
  };

  /* Check if the expression can be fired at `n`.
   *
   * @method checkExp
   * @param {int} n A point in the timeline
   * @param {object} exp An object containing an expression's properties
   * @returns {boolean}
   * @since 0.1.0-alpha
   */
  self.checkExp = function ( n, exp ) {
    if ( self.exp[exp[0]] ) {
      return self.exp[exp[0]]( n, exp[1] );
    }
  };

  /* Seek to point `n` on the timeline and fire any operations at that point.
   *
   * @method seek
   * @param {int} n A point in the timeline to seek to
   * @returns {void}
   * @since 0.1.0-alpha
   */
  self.seek = function ( n ) {
    var ops = self.timeline[n];

    if ( ops && ops.length > 0 ) {
      for ( var x = 0; x < ops.length; x++ ) {
        ops[x]( n );
      }
    }
  };

  // Initialise ops on construct
  if ( timelineLength && ops ) {
    self.renderTimeline( timelineLength, ops );
  }

};

var module = module || {};
module.exports = Nsynq;