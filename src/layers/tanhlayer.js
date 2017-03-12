goog.provide('convnetjs.TanhLayer');
goog.require('convnetjs.Layer');


goog.scope(function() {
  /**
   * Implements Tanh nnonlinearity elementwise
   * x -> tanh(x)
   * so the output is between -1 and 1.
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.Layer}
   * @export
   */
  convnetjs.TanhLayer = function(opt) {
    opt = opt || {};

    // computed
    this.out_sx = opt['in_sx'];
    this.out_sy = opt['in_sy'];
    this.out_depth = opt['in_depth'];
    this.layer_type = 'tanh';
  };
  goog.inherits(convnetjs.TanhLayer, convnetjs.Layer);
  var pro = convnetjs.TanhLayer.prototype;

  /**
   * @override
   */
  pro.forward = function(V, is_training) {
    this.in_act = V;
    var V2 = V.cloneAndZero();
    var N = V['w'].length;
    for(var i=0;i<N;i++) {
      V2['w'][i] = Math.tanh(V['w'][i]);
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
      var v2wi = V2['w'][i];
      V['dw'][i] = (1.0 - v2wi * v2wi) * V2['dw'][i];
    }
  };
});
