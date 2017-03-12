/**
 * @fileoverview
 * @suppress {extraRequire}
 */
goog.provide('convnetjs.Vol');
goog.require('convnetjs.JSONSerializable');
goog.require('convnetjs.util');


goog.scope(function() {
  /**
   * Vol is the basic building block of all data in a net.
   * it is essentially just a 3D volume of numbers, with a
   * width (sx), height (sy), and depth (depth).
   * it is used to hold data for all filters, all volumes,
   * all weights, and also stores all gradients w.r.t.
   * the data. c is optionally a value to initialize the volume
   * with. If c is missing, fills the Vol with random numbers.
   *
   * @constructor
   * @param {(!Array.<number>|number)} sx
   * @param {number=} opt_sy optional height
   * @param {number=} opt_depth optional depth
   * @param {number=} opt_c optional value to initialize volume with
   * @implements {convnetjs.JSONSerializable}
   * @export
   */
  convnetjs.Vol = function(sx, opt_sy, opt_depth, opt_c) {
    /** @type {number} */
    this.sx = -1;

    /** @type {number} */
    this.sy = -1;

    if(Array.isArray(sx)) {
      // we were given a list in sx, assume 1D volume and fill it up
      this.sx = 1;
      this.sy = 1;
      this.depth = sx.length;
      // we have to do the following copy because we want to use
      // fast typed arrays, not an ordinary javascript array
      this['w'] = new Float64Array(this.depth);
      this['dw'] = new Float64Array(this.depth);
      for(var i=0;i<this.depth;i++) {
        this['w'][i] = sx[i];
      }
    } else {
      // we were given dimensions of the vol
      this.sx = sx;
      this.sy = /** @type {number} */ (opt_sy);
      this.depth = opt_depth;
      var n = sx*opt_sy*opt_depth;
      this['w'] = new Float64Array(n);
      this['dw'] = new Float64Array(n);
      if(typeof opt_c === 'undefined') {
        // weight normalization is done to equalize the output
        // variance of every neuron, otherwise neurons with a lot
        // of incoming connections have outputs of larger variance
        var scale = Math.sqrt(1.0/(sx*opt_sy*opt_depth));
        for(var i=0;i<n;i++) {
          this['w'][i] = convnetjs.randn(0.0, scale);
        }
      } else {
        this['w'].fill(opt_c);
      }
    }
  };
  var Vol = convnetjs.Vol;
  var pro = Vol.prototype;

  /**
   * @return {number}
   * @export
   */
  pro.getSx = function() {
    return this.sx;
  }

  /**
   * @return {number}
   * @export
   */
  pro.getSy = function() {
    return this.sy;
  }

  /**
   * @return {number}
   * @export
   */
  pro.getDepth = function() {
    return this.depth;
  }

  /**
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {number} d depth
   * @return {number}
   * @export
   */
  pro.get = function(x, y, d) {
    var ix=((this.sx * y)+x)*this.depth+d;
    return this['w'][ix];
  };

  /**
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {number} d depth
   * @param {number} v value
   * @export
   */
  pro.set = function(x, y, d, v) {
    var ix=((this.sx * y)+x)*this.depth+d;
    this['w'][ix] = v;
  };

  /**
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {number} d depth
   * @param {number} v value
   * @export
   */
  pro.add = function(x, y, d, v) {
    var ix=((this.sx * y)+x)*this.depth+d;
    this['w'][ix] += v;
  };

  /**
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {number} d depth
   * @return {number}
   * @export
   */
  pro.get_grad = function(x, y, d) {
    var ix = ((this.sx * y)+x)*this.depth+d;
    return this['dw'][ix];
  };

  /**
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {number} d depth
   * @param {number} v value
   * @export
   */
  pro.set_grad = function(x, y, d, v) {
    var ix = ((this.sx * y)+x)*this.depth+d;
    this['dw'][ix] = v;
  };

  /**
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {number} d depth
   * @param {number} v value
   * @export
   */
  pro.add_grad = function(x, y, d, v) {
    var ix = ((this.sx * y)+x)*this.depth+d;
    this['dw'][ix] += v;
  };

  /**
   * @return {!convnetjs.Vol}
   * @export
   */
  pro.cloneAndZero = function() {
    return new Vol(this.sx, this.sy, this.depth, 0.0);
  };

  /**
   * @return {!convnetjs.Vol}
   * @export
   */
  pro.clone = function() {
    var V = new Vol(this.sx, this.sy, this.depth, 0.0);
    var n = this['w'].length;
    for(var i=0;i<n;i++) {
      V['w'][i] = this['w'][i];
    }
    return V;
  };

  /**
   * @param {!convnetjs.Vol} V
   * @export
   */
  pro.addFrom = function(V) {
    for(var k=0;k<this['w'].length;k++) {
      this['w'][k] += V['w'][k];
    }
  };

  /**
   * @param {!convnetjs.Vol} V
   * @param {number} a
   * @export
   */
  pro.addFromScaled = function(V, a) {
    for(var k=0;k<this['w'].length;k++) {
      this['w'][k] += a*V['w'][k];
    }
  };

  /**
   * @param {number} a
   * @export
   */
  pro.setConst = function(a) {
    for(var k=0;k<this['w'].length;k++) {
      this['w'][k] = a;
    }
  };

  /**
   * @override
   * @export
   */
  pro.toJSON = function() {
    // todo: we may want to only save d most significant digits to save space
    var json = {};
    json['sx'] = this.sx;
    json['sy'] = this.sy;
    json['depth'] = this.depth;
    json['w'] = this['w'];
    return json;
    // we wont back up gradients to save space
  };

  /**
   * @return {*}
   * @export
   */
  pro.toJSONWithGradients = function() {
    var json = this.toJSON();
    json['dw'] = this['dw'];
    return json;
  };

  /**
   * @override
   * @export
   */
  pro.fromJSON = function(json) {
    this.sx = json['sx'];
    this.sy = json['sy'];
    this.depth = json['depth'];

    var n = this.sx*this.sy*this.depth;
    this['w'] = new Float64Array(n);
    this['dw'] = new Float64Array(n);
    // copy over the elements.
    for(var i=0;i<n;i++) {
      this['w'][i] = json['w'][i];
    }

    if (typeof json['dw'] !== 'undefined') {
      for(var i=0;i<n;i++) {
        this['dw'][i] = json['dw'][i];
      }
    }
  };
});
