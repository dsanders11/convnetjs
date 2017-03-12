goog.provide('convnetjs.JSONSerializable');


goog.scope(function() {
  /**
   * @interface
   */
  convnetjs.JSONSerializable = function() { };
  var pro = convnetjs.JSONSerializable.prototype;

  /**
   * @return {*}
   * @export
   */
  pro.toJSON = function() { };

  /**
   * @param {!Object} json
   * @export
   */
  pro.fromJSON = function(json) { };
});
