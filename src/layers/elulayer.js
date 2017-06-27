goog.provide('convnetjs.EluLayer');
goog.require('convnetjs.Layer');
goog.require('convnetjs.Vol');


goog.scope(function() {
  /**
   * Implements ELU nonlinearity elementwise
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.Layer}
   * @export
   */
  convnetjs.EluLayer = function(opt) {
    opt = opt || {};

    this.alpha = /** @const {number} */ (typeof opt['alpha'] !== 'undefined' ? opt['alpha'] : 1);

    // computed
    this.out_sx = /** @const {number} */ (opt['in_sx']);
    this.out_sy = /** @const {number} */ (opt['in_sy']);
    this.out_depth = /** @const {number} */ (opt['in_depth']);
    this.layer_type = 'elu';

    /** @type {convnetjs.Vol} */
    this.in_act = null;
    /** @type {convnetjs.Vol} */
    this.out_act = null;
  };
  goog.inherits(convnetjs.EluLayer, convnetjs.Layer);
  var pro = convnetjs.EluLayer.prototype;

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
      if (A_w[i] <= 0) {
        A_w[i] = this.alpha * (Math.exp(A_w[i]) - 1);
      }
      // else it remains unchanged
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
      if (V2['w'][i] > 0) {
        V_dw[i] = 1;
      } else {
        V_dw[i] = V2['w'][i] + this.alpha;
      }
    }
  };
});
