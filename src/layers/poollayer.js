goog.provide('convnetjs.PoolLayer');
goog.require('convnetjs.Layer');
goog.require('convnetjs.Vol');


goog.scope(function() {
  /**
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.Layer}
   * @export
   */
  convnetjs.PoolLayer = function(opt) {
    opt = opt || {};

    // required
    this.sx = /** @const {number} */ (opt['sx']); // filter size
    this.in_depth = /** @const {number} */ (opt['in_depth']);
    this.in_sx = /** @const {number} */ (opt['in_sx']);
    this.in_sy = /** @const {number} */ (opt['in_sy']);

    // optional
    this.sy = /** @const {number} */ (typeof opt['sy'] !== 'undefined' ? opt['sy'] : this.sx);
    this.stride = /** @const {number} */ (typeof opt['stride'] !== 'undefined' ? opt['stride'] : 2);
    // amount of 0 padding to add around borders of input volume
    this.pad = /** @const {number} */ (typeof opt['pad'] !== 'undefined' ? opt['pad'] : 0);

    /** @type {convnetjs.Vol} */
    this.in_act = null;
    /** @type {convnetjs.Vol} */
    this.out_act = null;

    // computed
    this.out_depth = this.in_depth;
    this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx) / this.stride + 1);
    this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy) / this.stride + 1);
    this.layer_type = 'pool';
    // store switches for x,y coordinates for where the max comes from, for each output neuron
    this.switchx = new Float64Array(this.out_sx*this.out_sy*this.out_depth);
    this.switchy = new Float64Array(this.out_sx*this.out_sy*this.out_depth);
  };
  goog.inherits(convnetjs.PoolLayer, convnetjs.Layer);
  var pro = convnetjs.PoolLayer.prototype;

  /** @type {convnetjs.Vol} */
  pro.in_act = null;

  /**
   * @override
   */
  pro.forward = function(V, is_training) {
    this.in_act = V;

    if (this.out_act === null) {
      this.out_act = new convnetjs.Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);
    } else {
      // It already exists so zero it
      this.out_act['w'].fill(0);
    }
    var A = this.out_act;

    var n=0; // a counter for switches
    for(var d=0;d<this.out_depth;d++) {
      let x = -this.pad;
      for(var ax=0; ax<this.out_sx; x+=this.stride,ax++) {
        let y = -this.pad;
        for(var ay=0; ay<this.out_sy; y+=this.stride,ay++) {

          // convolve centered at this particular location
          let a = -99999; // hopefully small enough ;\
          let winx=-1;
          let winy=-1;
          for(var fx=0;fx<this.sx;fx++) {
            let ox = x+fx;
            for(var fy=0;fy<this.sy;fy++) {
              let oy = y+fy;
              if(oy>=0 && oy<V.sy && ox>=0 && ox<V.sx) {
                let v = V.get(ox, oy, d);
                // perform max pooling and store pointers to where
                // the max came from. This will speed up backprop
                // and can help make nice visualizations in future
                if (v > a) {
                  a = v;
                  winx=ox;
                  winy=oy;
                }
              }
            }
          }
          this.switchx[n] = winx;
          this.switchy[n] = winy;
          n++;
          A.set(ax, ay, d, a);
        }
      }
    }
    return this.out_act;
  };

  /**
   * @override
   */
  pro.backward = function() {
    // pooling layers have no parameters, so simply compute
    // gradient wrt data here
    var V = this.in_act;
    V['dw'].fill(0); // zero out gradient wrt bottom data, we're about to fill it

    var n = 0;
    for(var d=0;d<this.out_depth;d++) {
      var x = -this.pad;
      var y = -this.pad;
      for(var ax=0; ax<this.out_sx; x+=this.stride,ax++) {
        y = -this.pad;
        for(var ay=0; ay<this.out_sy; y+=this.stride,ay++) {

          var chain_grad = this.out_act.get_grad(ax,ay,d);
          V.add_grad(this.switchx[n], this.switchy[n], d, chain_grad);
          n++;

        }
      }
    }
  };

  /**
   * @override
   */
  pro.toJSON = function() {
    var json = goog.base(this, 'toJSON');

    json['sx'] = this.sx;
    json['sy'] = this.sy;
    json['stride'] = this.stride;
    json['in_depth'] = this.in_depth;
    json['pad'] = this.pad;
    return json;
  };

  /**
   * @override
   */
  pro.fromJSON = function(json) {
    goog.base(this, 'fromJSON', json);

    this.sx = json['sx'];
    this.sy = json['sy'];
    this.stride = json['stride'];
    this.in_depth = json['in_depth'];
    this.pad = typeof json['pad'] !== 'undefined' ? json['pad'] : 0; // backwards compatibility
    this.switchx = new Float64Array(this.out_sx*this.out_sy*this.out_depth); // need to re-init these appropriately
    this.switchy = new Float64Array(this.out_sx*this.out_sy*this.out_depth);
  };
});
