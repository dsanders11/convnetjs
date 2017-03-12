goog.provide('convnetjs.ReluLayer');
goog.require('convnetjs.Layer');


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
    var V2 = V.clone();
    var N = V['w'].length;
    var V2w = V2['w'];
    for(var i=0;i<N;i++) {
      if(V2w[i] < 0) V2w[i] = 0; // threshold at 0
    }
    this.out_act = V2;
    return this.out_act;
  };

  /**
   * @override
   */
  pro.backward = function() {
    var V = this.in_act; // we need to set dw of this
    var V2 = this.out_act;
    var N = V['w'].length;
    V['dw'] = new Float64Array(N); // zero out gradient wrt data
    for(var i=0;i<N;i++) {
      if(V2['w'][i] <= 0) V['dw'][i] = 0; // threshold
      else V['dw'][i] = V2['dw'][i];
    }
  };
});
