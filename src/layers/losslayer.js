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
   */
  convnetjs.LossLayer.prototype.forward = function(V, is_training) { };

  /**
   * backprop: compute gradients wrt all parameters
   * @param {(Array|Float32Array|number|Object)} y
   * @return {number}
   * @abstract
   */
  convnetjs.LossLayer.prototype.backward = function(y) { };

  /**
   * @return {!Array}
   */
  convnetjs.LossLayer.prototype.getParamsAndGrads = function() {
    return [];
  };

  /**
   * @override
   * @abstract
   */
  convnetjs.LossLayer.prototype.fromJSON = function(json) { };

  /**
   * @override
   * @abstract
   */
  convnetjs.LossLayer.prototype.toJSON = function() { };
});
