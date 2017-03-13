goog.provide('convnetjs.ReluLayer');
goog.require('convnetjs.Layer');
goog.require('convnetjs.Vol');


goog.scope(function() {
  /**
   * Implements ReLU nonlinearity elementwise
   * x -> max(0, x)
   * the output is in [0, inf)
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.Layer}
   * @export
   */
  convnetjs.ReluLayer = function(opt) {
    opt = opt || {};

    // computed
    this.out_sx = /** @const {number} */ (opt['in_sx']);
    this.out_sy = /** @const {number} */ (opt['in_sy']);
    this.out_depth = /** @const {number} */ (opt['in_depth']);
    this.layer_type = 'relu';

    /** @type {convnetjs.Vol} */
    this.in_act = null;
    /** @type {convnetjs.Vol} */
    this.out_act = null;
  };
  goog.inherits(convnetjs.ReluLayer, convnetjs.Layer);
  var pro = convnetjs.ReluLayer.prototype;

  /**
   * @override
   */
  pro.forward = function(V, is_training) {
    this.in_act = V;
    if (this.out_act === null) {
      this.out_act = new convnetjs.Vol(V.sx, V.sy, V.depth, 0.0);
    } else {
      // It already exists so copy it for a clone
      this.out_act['w'] = V['w'].slice();
    }
    var A = this.out_act;
    var N = V['w'].length;
    var A_w = A['w'];
    for(var i=0;i<N;i++) {
      if(A_w[i] < 0) A_w[i] = 0; // threshold at 0
    }
    return A;
  };

  /**
   * @override
   */
  pro.backward = function() {
    var V = this.in_act; // we need to set dw of this
    var V_dw = V['dw'];
    var V2 = this.out_act;
    var N = V['w'].length;
    V['dw'].fill(0); // zero out gradient wrt bottom data, we're about to fill it
    for(var i=0;i<N;i++) {
      if(V2['w'][i] <= 0) V_dw[i] = 0; // threshold
      else V_dw[i] = V2['dw'][i];
    }
  };
});
