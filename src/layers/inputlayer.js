/**
 * @fileoverview
 * @suppress {extraRequire}
 */
goog.provide('convnetjs.InputLayer');
goog.require('convnetjs.Layer');
goog.require('convnetjs.Vol');
goog.require('convnetjs.util');


goog.scope(function() {
  var Vol = convnetjs.Vol; // convenience
  var getopt = convnetjs.getopt;

  /**
   * @constructor
   * @param {!Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.Layer}
   * @export
   */
  convnetjs.InputLayer = function(opt) {
    opt = opt || {};

    // required: depth
    this.out_depth = getopt(opt, ['out_depth', 'depth'], 0);

    // optional: default these dimensions to 1
    this.out_sx = getopt(opt, ['out_sx', 'sx', 'width'], 1);
    this.out_sy = getopt(opt, ['out_sy', 'sy', 'height'], 1);

    // computed
    this.layer_type = 'input';
  };
  goog.inherits(convnetjs.InputLayer, convnetjs.Layer);
  var pro = convnetjs.InputLayer.prototype;

  /**
   * @override
   */
  pro.forward = function(V, is_training) {
    this.in_act = V;
    this.out_act = V;
    return this.out_act; // simply identity function for now
  };

  /**
   * @override
   */
  pro.backward = function() { };

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
  };
});
