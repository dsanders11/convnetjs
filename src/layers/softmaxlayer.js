goog.provide('convnetjs.SoftmaxLayer');
goog.require('convnetjs.LossLayer');
goog.require('convnetjs.Vol');


goog.scope(function() {
  /**
   * This is a classifier, with N discrete classes from 0 to N-1
   * it gets a stream of N incoming numbers and computes the softmax
   * function (exponentiate and normalize to sum to 1 as probabilities should)
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.LossLayer}
   * @export
   */
  convnetjs.SoftmaxLayer = function(opt) {
    opt = opt || {};

    // computed
    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'softmax';
  };
  goog.inherits(convnetjs.SoftmaxLayer, convnetjs.LossLayer);
  var pro = convnetjs.SoftmaxLayer.prototype;

  /**
   * @override
   */
  pro.forward = function(V, is_training) {
    this.in_act = V;

    var A = new convnetjs.Vol(1, 1, this.out_depth, 0.0);

    // compute max activation
    var as = V.w;
    var amax = V.w[0];
    for(var i=1;i<this.out_depth;i++) {
      if(as[i] > amax) amax = as[i];
    }

    // compute exponentials (carefully to not blow up)
    var es = new Float64Array(this.out_depth);
    var esum = 0.0;
    for(var i=0;i<this.out_depth;i++) {
      var e = Math.exp(as[i] - amax);
      esum += e;
      es[i] = e;
    }

    // normalize and output to sum to one
    for(var i=0;i<this.out_depth;i++) {
      es[i] /= esum;
      A.w[i] = es[i];
    }

    this.es = es; // save these for backprop
    this.out_act = A;
    return this.out_act;
  };

  /**
   * @override
   */
  pro.backward = function(y) {
    // compute and accumulate gradient wrt weights and bias of this layer
    var x = this.in_act;
    x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol

    for(var i=0;i<this.out_depth;i++) {
      var indicator = i === y ? 1.0 : 0.0;
      var mul = -(indicator - this.es[i]);
      x.dw[i] = mul;
    }

    // loss is the class negative log likelihood
    return -Math.log(this.es[y]);
  };

  /**
   * @override
   */
  pro.getParamsAndGrads = function() {
    return [];
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

  /**
   * @override
   */
  pro.fromJSON = function(json) {
    this.out_depth = json.out_depth;
    this.out_sx = json.out_sx;
    this.out_sy = json.out_sy;
    this.layer_type = json.layer_type;
    this.num_inputs = json.num_inputs;
  };
});
