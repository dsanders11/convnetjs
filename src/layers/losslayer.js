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
  convnetjs.LossLayer = function(opt) { };

  /**
   * @param {!convnetjs.Vol} V
   * @param {boolean} is_training
   * @return {!convnetjs.Vol}
   * @abstract
   * @export
   */
  convnetjs.LossLayer.prototype.forward = function(V, is_training) { };

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
    this.out_depth = /** @type {number} */ (json.out_depth);
    this.out_sx = /** @type {number} */ (json.out_sx);
    this.out_sy = /** @type {number} */ (json.out_sy);
    this.layer_type = /** @type {string} */ (json.layer_type);
    this.num_inputs = /** @type {number} */ (json.num_inputs);
  };

  /**
   * @override
   * @abstract
   * @export
   */
  convnetjs.LossLayer.prototype.toJSON = function() { };
});
