/**
 * @fileoverview
 * @suppress {extraRequire}
 */
goog.provide('convnetjs.Net');
goog.require('convnetjs.ConvLayer');
goog.require('convnetjs.DropoutLayer');
goog.require('convnetjs.FullyConnLayer');
goog.require('convnetjs.InputLayer');
goog.require('convnetjs.JSONSerializable');
goog.require('convnetjs.LocalResponseNormalizationLayer');
goog.require('convnetjs.MaxoutLayer');
goog.require('convnetjs.PoolLayer');
goog.require('convnetjs.RegressionLayer');
goog.require('convnetjs.ReluLayer');
goog.require('convnetjs.SVMLayer');
goog.require('convnetjs.SigmoidLayer');
goog.require('convnetjs.SoftmaxLayer');
goog.require('convnetjs.TanhLayer');
goog.require('convnetjs.Vol');
goog.require('convnetjs.util');


goog.scope(function() {
  var Vol = convnetjs.Vol; // convenience
  var assert = convnetjs.assert;

  /**
   * Net manages a set of layers
   * For now constraints: Simple linear order of layers, first layer input last layer a cost layer
   * @constructor
   * @implements {convnetjs.JSONSerializable}
   * @export
   */
  convnetjs.Net = function() {
    this.layers = [];
  };
  var pro = convnetjs.Net.prototype;

  /**
   * takes a list of layer definitions and creates the network layer objects
   * @param {!Object} defs
   */
  pro.makeLayers = function(defs) {
    // few checks
    assert(defs.length >= 2, 'Error! At least one input layer and one loss layer are required.');
    assert(defs[0].type === 'input', 'Error! First layer must be the input layer, to declare size of inputs');

    // desugar layer_defs for adding activation, dropout layers etc
    var desugar = function(defs) {
      var new_defs = [];
      for(var i=0;i<defs.length;i++) {
        var def = defs[i];

        if(def.type==='softmax' || def.type==='svm') {
          // add an fc layer here, there is no reason the user should
          // have to worry about this and we almost always want to
          new_defs.push({type:'fc', num_neurons: def.num_classes});
        }

        if(def.type==='regression') {
          // add an fc layer here, there is no reason the user should
          // have to worry about this and we almost always want to
          new_defs.push({type:'fc', num_neurons: def.num_neurons});
        }

        if((def.type==='fc' || def.type==='conv')
            && typeof(def.bias_pref) === 'undefined'){
          def.bias_pref = 0.0;
          if(typeof def.activation !== 'undefined' && def.activation === 'relu') {
            def.bias_pref = 0.1; // relus like a bit of positive bias to get gradients early
            // otherwise it's technically possible that a relu unit will never turn on (by chance)
            // and will never get any gradient and never contribute any computation. Dead relu.
          }
        }

        new_defs.push(def);

        if(typeof def.activation !== 'undefined') {
          if(def.activation==='relu') { new_defs.push({type:'relu'}); }
          else if (def.activation==='sigmoid') { new_defs.push({type:'sigmoid'}); }
          else if (def.activation==='tanh') { new_defs.push({type:'tanh'}); }
          else if (def.activation==='maxout') {
            // create maxout activation, and pass along group size, if provided
            var gs = def.group_size !== 'undefined' ? def.group_size : 2;
            new_defs.push({type:'maxout', group_size:gs});
          }
          else { console.log('ERROR unsupported activation ' + def.activation); }
        }
        if(typeof def.drop_prob !== 'undefined' && def.type !== 'dropout') {
          new_defs.push({type:'dropout', drop_prob: def.drop_prob});
        }

      }
      return new_defs;
    };
    defs = desugar(defs);

    // create the layers
    this.layers = [];
    for(var i=0;i<defs.length;i++) {
      var def = defs[i];
      if(i>0) {
        var prev = this.layers[i-1];
        def.in_sx = prev.out_sx;
        def.in_sy = prev.out_sy;
        def.in_depth = prev.out_depth;
      }

      switch(def.type) {
        case 'fc': this.layers.push(new convnetjs.FullyConnLayer(def)); break;
        case 'lrn': this.layers.push(new convnetjs.LocalResponseNormalizationLayer(def)); break;
        case 'dropout': this.layers.push(new convnetjs.DropoutLayer(def)); break;
        case 'input': this.layers.push(new convnetjs.InputLayer(def)); break;
        case 'softmax': this.layers.push(new convnetjs.SoftmaxLayer(def)); break;
        case 'regression': this.layers.push(new convnetjs.RegressionLayer(def)); break;
        case 'conv': this.layers.push(new convnetjs.ConvLayer(def)); break;
        case 'pool': this.layers.push(new convnetjs.PoolLayer(def)); break;
        case 'relu': this.layers.push(new convnetjs.ReluLayer(def)); break;
        case 'sigmoid': this.layers.push(new convnetjs.SigmoidLayer(def)); break;
        case 'tanh': this.layers.push(new convnetjs.TanhLayer(def)); break;
        case 'maxout': this.layers.push(new convnetjs.MaxoutLayer(def)); break;
        case 'svm': this.layers.push(new convnetjs.SVMLayer(def)); break;
        default: console.log('ERROR: UNRECOGNIZED LAYER TYPE: ' + def.type);
      }
    }
  };

  /**
   * forward prop the network.
   * The trainer class passes is_training = true, but when this function is
   * called from outside (not from the trainer), it defaults to prediction mode
   * @param {!convnetjs.Vol} V
   * @param {boolean} is_training
   * @return {!convnetjs.Vol}
   */
  pro.forward = function(V, is_training) {
    if(typeof(is_training) === 'undefined') is_training = false;
    var act = this.layers[0].forward(V, is_training);
    for(var i=1;i<this.layers.length;i++) {
      act = this.layers[i].forward(act, is_training);
    }
    return act;
  };

  /**
   * @param {!convnetjs.Vol} V
   * @param {number} y
   * @return {number}
   */
  pro.getCostLoss = function(V, y) {
    this.forward(V, false);
    var N = this.layers.length;
    var loss = this.layers[N-1].backward(y);
    return loss;
  };

  /**
   * backprop: compute gradients wrt all parameters
   * @param {(Array|Float32Array|number|Object)} y
   * @return {number}
   */
  pro.backward = function(y) {
    var N = this.layers.length;
    var loss = this.layers[N-1].backward(y); // last layer assumed to be loss layer
    for(var i=N-2;i>=0;i--) { // first layer assumed input
      this.layers[i].backward();
    }
    return loss;
  };

  /**
   * @return {!Array<!Object>}
   */
  pro.getParamsAndGrads = function() {
    // accumulate parameters and gradients for the entire network
    var response = [];
    for(var i=0;i<this.layers.length;i++) {
      var layer_reponse = this.layers[i].getParamsAndGrads();
      for(var j=0;j<layer_reponse.length;j++) {
        response.push(layer_reponse[j]);
      }
    }
    return response;
  };

  /**
   * @return {number}
   */
  pro.getPrediction = function() {
    // this is a convenience function for returning the argmax
    // prediction, assuming the last layer of the net is a softmax
    var S = this.layers[this.layers.length-1];
    assert(S.layer_type === 'softmax', 'getPrediction function assumes softmax as last layer of the net!');

    var p = S.out_act.w;
    var maxv = p[0];
    var maxi = 0;
    for(var i=1;i<p.length;i++) {
      if(p[i] > maxv) { maxv = p[i]; maxi = i;}
    }
    return maxi; // return index of the class with highest class probability
  };

  /**
   * @override
   */
  pro.toJSON = function() {
    var json = {};
    json.layers = [];
    for(var i=0;i<this.layers.length;i++) {
      json.layers.push(this.layers[i].toJSON());
    }
    return json;
  };

  /**
   * @override
   */
  pro.fromJSON = function(json) {
    this.layers = [];
    for(var i=0;i<json.layers.length;i++) {
      var Lj = json.layers[i];
      var t = Lj.layer_type;
      var L;
      if(t==='input') { L = new convnetjs.InputLayer(); }
      if(t==='relu') { L = new convnetjs.ReluLayer(); }
      if(t==='sigmoid') { L = new convnetjs.SigmoidLayer(); }
      if(t==='tanh') { L = new convnetjs.TanhLayer(); }
      if(t==='dropout') { L = new convnetjs.DropoutLayer(); }
      if(t==='conv') { L = new convnetjs.ConvLayer(); }
      if(t==='pool') { L = new convnetjs.PoolLayer(); }
      if(t==='lrn') { L = new convnetjs.LocalResponseNormalizationLayer(); }
      if(t==='softmax') { L = new convnetjs.SoftmaxLayer(); }
      if(t==='regression') { L = new convnetjs.RegressionLayer(); }
      if(t==='fc') { L = new convnetjs.FullyConnLayer(); }
      if(t==='maxout') { L = new convnetjs.MaxoutLayer(); }
      if(t==='svm') { L = new convnetjs.SVMLayer(); }
      L.fromJSON(Lj);
      this.layers.push(L);
    }
  };
});
