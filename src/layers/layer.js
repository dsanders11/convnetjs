goog.provide('convnetjs.Layer');
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
  convnetjs.Layer = function(opt) { };

  /**
   * @param {!convnetjs.Vol} V
   * @param {boolean} is_training
   * @return {!convnetjs.Vol}
   * @abstract
   */
  convnetjs.Layer.prototype.forward = function(V, is_training) { };

  /**
   * @abstract
   */
  convnetjs.Layer.prototype.backward = function() { };

  /**
   * @return {!Array}
   */
  convnetjs.Layer.prototype.getParamsAndGrads = function() {
    return [];
  };

  /**
   * @override
   * @abstract
   */
  convnetjs.Layer.prototype.fromJSON = function(json) { };

  /**
   * @override
   * @abstract
   */
  convnetjs.Layer.prototype.toJSON = function() { };
});
