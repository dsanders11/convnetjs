goog.provide('convnetjs.SVMLayer');
goog.require('convnetjs.LossLayer');


goog.scope(function() {
  /**
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.LossLayer}
   * @export
   */
  convnetjs.SVMLayer = function(opt) {
    opt = opt || {};

    // computed
    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'svm';
  };
  goog.inherits(convnetjs.SVMLayer, convnetjs.LossLayer);
  var pro = convnetjs.SVMLayer.prototype;

  /**
   * @override
   */
  pro.forward = function(V, is_training) {
    this.in_act = V;
    this.out_act = V; // nothing to do, output raw scores
    return V;
  };

  /**
   * @override
   */
  pro.backward = function(y) {
    // compute and accumulate gradient wrt weights and bias of this layer
    var x = this.in_act;
    x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol

    // we're using structured loss here, which means that the score
    // of the ground truth should be higher than the score of any other
    // class, by a margin
    var yscore = x.w[y]; // score of ground truth
    var margin = 1.0;
    var loss = 0.0;
    for(var i=0;i<this.out_depth;i++) {
      if(y === i) { continue; }
      var ydiff = -yscore + x.w[i] + margin;
      if(ydiff > 0) {
        // violating dimension, apply loss
        x.dw[i] += 1;
        x.dw[y] -= 1;
        loss += ydiff;
      }
    }

    return loss;
  };

  /**
   * @override
   */
  pro.toJSON = function() {
    var json = {};
    json.out_depth = this.out_depth;
    json.out_sx = this.out_sx;
    json.out_sy = this.out_sy;
    json.layer_type = this.layer_type;
    json.num_inputs = this.num_inputs;
    return json;
  };
});
