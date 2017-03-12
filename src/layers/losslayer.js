goog.provide('convnetjs.LossLayer');
goog.require('convnetjs.JSONSerializable');
goog.require('convnetjs.Vol');


goog.scope(function() {
  /**
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @implements {convnetjs.JSONSerializable}
   * @abstract
   * @export
   */
  convnetjs.LossLayer = function(opt) {
    opt = opt || {};

    // computed
    this.num_inputs = opt['in_sx'] * opt['in_sy'] * opt['in_depth'];
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
  };

  /**
   * @param {!convnetjs.Vol} V
   * @param {boolean} is_training
   * @return {!convnetjs.Vol}
   * @export
   */
  convnetjs.LossLayer.prototype.forward = function(V, is_training) {
    this.in_act = V;
    this.out_act = V; // nothing to do, output raw scores
    return V;
  };

  /**
   * backprop: compute gradients wrt all parameters
   * @param {(Array|Float64Array|number|Object)} y
   * @return {number}
   * @abstract
   * @export
   */
  convnetjs.LossLayer.prototype.backward = function(y) { };

  /**
   * @return {!Array}
   * @export
   */
  convnetjs.LossLayer.prototype.getParamsAndGrads = function() {
    return [];
  };

  /**
   * @override
   * @export
   */
  convnetjs.LossLayer.prototype.fromJSON = function(json) {
    this.out_depth = /** @type {number} */ (json['out_depth']);
    this.out_sx = /** @type {number} */ (json['out_sx']);
    this.out_sy = /** @type {number} */ (json['out_sy']);
    this.layer_type = /** @type {string} */ (json['layer_type']);
    this.num_inputs = /** @type {number} */ (json['num_inputs']);
  };

  /**
   * @override
   * @export
   */
  convnetjs.LossLayer.prototype.toJSON = function() {
    var json = {};
    json['out_depth'] = this.out_depth;
    json['out_sx'] = this.out_sx;
    json['out_sy'] = this.out_sy;
    json['layer_type'] = this.layer_type;
    json['num_inputs'] = this.num_inputs;
    return json;
  };
});
