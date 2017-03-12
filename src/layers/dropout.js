goog.provide('convnetjs.DropoutLayer');
goog.require('convnetjs.Layer');


goog.scope(function() {
  /**
   * An inefficient dropout layer
   * Note this is not most efficient implementation since the layer before
   * computed all these activations and now we're just going to drop them :(
   * same goes for backward pass. Also, if we wanted to be efficient at test time
   * we could equivalently be clever and upscale during train and copy pointers during test
   * todo: make more efficient.
   * @constructor
   * @param {Object<string,*>=} opt Configuration options for layer
   * @extends {convnetjs.Layer}
   * @export
   */
  convnetjs.DropoutLayer = function(opt) {
    opt = opt || {};

    // computed
    this.out_sx = /** @const {number} */ (opt['in_sx']);
    this.out_sy = /** @const {number} */ (opt['in_sy']);
    this.out_depth = /** @const {number} */ (opt['in_depth']);
    this.layer_type = 'dropout';
    this.drop_prob = /** @const {number} */ (typeof opt['drop_prob'] !== 'undefined' ? opt['drop_prob'] : 0.5);
    this.dropped = new Array(this.out_sx*this.out_sy*this.out_depth);

    /** @type {convnetjs.Vol} */
    this.in_act = null;
    /** @type {convnetjs.Vol} */
    this.out_act = null;
  };
  goog.inherits(convnetjs.DropoutLayer, convnetjs.Layer);
  var pro = convnetjs.DropoutLayer.prototype;

  /**
   * @override
   */
  pro.forward = function(V, is_training) {
    this.in_act = V;
    if(typeof(is_training)==='undefined') { is_training = false; } // default is prediction mode
    var V2 = V.clone();
    var N = V['w'].length;
    if(is_training) {
      // do dropout
      for(var i=0;i<N;i++) {
        if(Math.random()<this.drop_prob) { V2['w'][i]=0; this.dropped[i] = true; } // drop!
        else {this.dropped[i] = false;}
      }
    } else {
      // scale the activations during prediction
      for(var i=0;i<N;i++) { V2['w'][i]*=this.drop_prob; }
    }
    this.out_act = V2;
    return this.out_act; // dummy identity function for now
  };

  /**
   * @override
   */
  pro.backward = function() {
    var V = this.in_act; // we need to set dw of this
    var chain_grad = this.out_act;
    var N = V['w'].length;
    V['dw'] = new Float64Array(N); // zero out gradient wrt data
    for(var i=0;i<N;i++) {
      if(!(this.dropped[i])) {
        V['dw'][i] = chain_grad['dw'][i]; // copy over the gradient
      }
    }
  };

  /**
   * @override
   */
  pro.toJSON = function() {
    var json = goog.base(this, 'toJSON');

    json['drop_prob'] = this.drop_prob;
    return json;
  };

  /**
   * @override
   */
  pro.fromJSON = function(json) {
    goog.base(this, 'fromJSON', json);

    this.drop_prob = json['drop_prob'];
  };
});
