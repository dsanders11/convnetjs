goog.provide('convnetjs.RegressionLayer');
goog.require('convnetjs.LossLayer');


goog.scope(function() {
  /**
   * implements an L2 regression cost layer,
   * so penalizes \sum_i(||x_i - y_i||^2), where x is its input
   * and y is the user-provided array of "correct" values.
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.LossLayer}
   * @export
   */
  convnetjs.RegressionLayer = function(opt) {
    goog.base(this, opt);
    this.layer_type = 'regression';
  };
  goog.inherits(convnetjs.RegressionLayer, convnetjs.LossLayer);
  var pro = convnetjs.RegressionLayer.prototype;

  /**
   * @override
   */
  pro.backward = function(y) {
    // compute and accumulate gradient wrt weights and bias of this layer
    var x = this.in_act;
    x['dw'] = new Float64Array(x['w'].length); // zero out the gradient of input Vol
    var loss = 0.0;
    if(y instanceof Array || y instanceof Float64Array) {
      for(var i=0;i<this.out_depth;i++) {
        var dy = x['w'][i] - y[i];
        x['dw'][i] = dy;
        loss += 0.5*dy*dy;
      }
    } else if(typeof y === 'number') {
      // lets hope that only one number is being regressed
      var dy = x['w'][0] - y;
      x['dw'][0] = dy;
      loss += 0.5*dy*dy;
    } else {
      // assume it is a struct with entries .dim and .val
      // and we pass gradient only along dimension dim to be equal to val
      var i = y['dim'];
      var yi = y['val'];
      var dy = x['w'][i] - yi;
      x['dw'][i] = dy;
      loss += 0.5*dy*dy;
    }
    return loss;
  };
});
