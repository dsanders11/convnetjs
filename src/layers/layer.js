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
   * @export
   */
  convnetjs.Layer.prototype.forward = function(V, is_training) { };

  /**
   * @abstract
   * @export
   */
  convnetjs.Layer.prototype.backward = function() { };

  /**
   * @return {!Array}
   * @export
   */
  convnetjs.Layer.prototype.getParamsAndGrads = function() {
    return [];
  };

  /**
   * @override
   * @export
   */
  convnetjs.Layer.prototype.fromJSON = function(json) {
    this.out_depth = /** @type {number} */ (json.out_depth);
    this.out_sx = /** @type {number} */ (json.out_sx);
    this.out_sy = /** @type {number} */ (json.out_sy);
    this.layer_type = /** @type {number} */ (json.layer_type);
  };

  /**
   * @override
   * @export
   */
  convnetjs.Layer.prototype.toJSON = function() {
    var json = {};
    json.out_depth = this.out_depth;
    json.out_sx = this.out_sx;
    json.out_sy = this.out_sy;
    json.layer_type = this.layer_type;
    return json;
  };
});
