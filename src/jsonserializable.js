goog.provide('convnetjs.JSONSerializable');


goog.scope(function() {
  /**
   * @interface
   */
  convnetjs.JSONSerializable = function() { };
  var pro = convnetjs.JSONSerializable.prototype;

  /**
   * @return {*}
   */
  pro.toJSON = function() { };

  /**
   * @param {!Object} json
   */
  pro.fromJSON = function(json) { };
});
