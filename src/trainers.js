/**
 * @fileoverview
 * @suppress {extraRequire}
 */
goog.provide('convnetjs.SGDTrainer');
goog.provide('convnetjs.Trainer');
goog.require('convnetjs.Net');
goog.require('convnetjs.Vol');
goog.require('convnetjs.util');


goog.scope(function() {
  /**
   * @constructor
   * @param {!convnetjs.Net} net
   * @param {!Object<string,*>=} opt
   * @export
   */
  convnetjs.Trainer = function(net, opt) {
    this.net = net;

    opt = opt || {};
    /** @type {number} */
    this.learning_rate = typeof opt['learning_rate'] !== 'undefined' ? opt['learning_rate'] : 0.01;
    /** @type {number} */
    this.l1_decay = typeof opt['l1_decay'] !== 'undefined' ? opt['l1_decay'] : 0.0;
    /** @type {number} */
    this.l2_decay = typeof opt['l2_decay'] !== 'undefined' ? opt['l2_decay'] : 0.0;
    /** @type {number} */
    this.batch_size = typeof opt['batch_size'] !== 'undefined' ? opt['batch_size'] : 1;
    /** @type {string} */
    this.method = typeof opt['method'] !== 'undefined' ? opt['method'] : 'sgd'; // sgd/adam/adagrad/adadelta/windowgrad/netsterov

    /** @type {number} */
    this.momentum = typeof opt['momentum'] !== 'undefined' ? opt['momentum'] : 0.9;
    /** @type {number} */
    this.ro = typeof opt['ro'] !== 'undefined' ? opt['ro'] : 0.95; // used in adadelta
    /** @type {number} */
    this.eps = typeof opt['eps'] !== 'undefined' ? opt['eps'] : 1e-8; // used in adam or adadelta
    /** @type {number} */
    this.beta1 = typeof opt['beta1'] !== 'undefined' ? opt['beta1'] : 0.9; // used in adam
    /** @type {number} */
    this.beta2 = typeof opt['beta2'] !== 'undefined' ? opt['beta2'] : 0.999; // used in adam

    this.k = 0; // iteration counter
    /** @type {!Array<!Float64Array>} */
    this.gsum = []; // last iteration gradients (used for momentum calculations)
    /** @type {!Array<!Float64Array>} */
    this.xsum = []; // used in adam or adadelta

    // check if regression is expected
    if(this.net.layers[this.net.layers.length - 1].layer_type === "regression")
      this.regression = true;
    else
      this.regression = false;
  };

  /**
   * @param {!convnetjs.Vol} x
   * @param {!Array} y output vector
   * @return {!Object}
   * @export
   */
  convnetjs.Trainer.prototype.train = function(x, y) {
    var start = new Date().getTime();
    this.net.forward(x, true); // also set the flag that lets the net know we're just training
    var end = new Date().getTime();
    var fwd_time = end - start;

    start = new Date().getTime();
    var cost_loss = this.net.backward(y);
    var l2_decay_loss = 0.0;
    var l1_decay_loss = 0.0;
    end = new Date().getTime();
    var bwd_time = end - start;

    if(this.regression && y.constructor !== Array) {
      console.log("Warning: a regression net requires an array as training output vector.");
    }

    this.k++;
    if(this.k % this.batch_size === 0) {
      var pglist = this.net.getParamsAndGrads();

      // initialize lists for accumulators. Will only be done once on first iteration
      if(this.gsum.length === 0 && (this.method !== 'sgd' || this.momentum > 0.0)) {
        // only vanilla sgd doesnt need either lists
        // momentum needs gsum
        // adagrad needs gsum
        // adam and adadelta needs gsum and xsum
        for(var i=0;i<pglist.length;i++) {
          this.gsum.push(new Float64Array(pglist[i]['params'].length));
          if(this.method === 'adam' || this.method === 'adadelta') {
            this.xsum.push(new Float64Array(pglist[i]['params'].length));
          } else {
            this.xsum.push(new Float64Array(0)); // conserve memory
          }
        }
      }

      // perform an update for all sets of weights
      for(var i=0;i<pglist.length;i++) {
        var pg = pglist[i]; // param, gradient, other options in future (custom learning rate etc)
        var p = /** @type {Float64Array} */ (pg['params']);
        var g = /** @type {Float64Array} */ (pg['grads']);

        // learning rate for some parameters.
        var l2_decay_mul = typeof pg['l2_decay_mul'] !== 'undefined' ? pg['l2_decay_mul'] : 1.0;
        var l1_decay_mul = typeof pg['l1_decay_mul'] !== 'undefined' ? pg['l1_decay_mul'] : 1.0;
        var l2_decay = this.l2_decay * l2_decay_mul;
        var l1_decay = this.l1_decay * l1_decay_mul;

        var plen = p.length;
        for(var j=0;j<plen;j++) {
          l2_decay_loss += l2_decay*p[j]*p[j]/2; // accumulate weight decay loss
          l1_decay_loss += l1_decay*Math.abs(p[j]);
          var l1grad = l1_decay * (p[j] > 0 ? 1 : -1);
          var l2grad = l2_decay * (p[j]);

          var gij = (l2grad + l1grad + g[j]) / this.batch_size; // raw batch gradient

          var gsumi = this.gsum[i];
          var xsumi = this.xsum[i];
          if(this.method === 'adam') {
            // adam update
            gsumi[j] = gsumi[j] * this.beta1 + (1- this.beta1) * gij; // update biased first moment estimate
            xsumi[j] = xsumi[j] * this.beta2 + (1-this.beta2) * gij * gij; // update biased second moment estimate
            var biasCorr1 = gsumi[j] * (1 - Math.pow(this.beta1, this.k)); // correct bias first moment estimate
            var biasCorr2 = xsumi[j] * (1 - Math.pow(this.beta2, this.k)); // correct bias second moment estimate
            var dx =  - this.learning_rate * biasCorr1 / (Math.sqrt(biasCorr2) + this.eps);
            p[j] += dx;
          } else if(this.method === 'adagrad') {
            // adagrad update
            gsumi[j] = gsumi[j] + gij * gij;
            var dx = - this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij;
            p[j] += dx;
          } else if(this.method === 'windowgrad') {
            // this is adagrad but with a moving window weighted average
            // so the gradient is not accumulated over the entire history of the run.
            // it's also referred to as Idea #1 in Zeiler paper on Adadelta. Seems reasonable to me!
            gsumi[j] = this.ro * gsumi[j] + (1-this.ro) * gij * gij;
            var dx = - this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij; // eps added for better conditioning
            p[j] += dx;
          } else if(this.method === 'adadelta') {
            gsumi[j] = this.ro * gsumi[j] + (1-this.ro) * gij * gij;
            var dx = - Math.sqrt((xsumi[j] + this.eps)/(gsumi[j] + this.eps)) * gij;
            xsumi[j] = this.ro * xsumi[j] + (1-this.ro) * dx * dx; // yes, xsum lags behind gsum by 1.
            p[j] += dx;
          } else if(this.method === 'nesterov') {
            var dx = gsumi[j];
            gsumi[j] = gsumi[j] * this.momentum + this.learning_rate * gij;
              dx = this.momentum * dx - (1.0 + this.momentum) * gsumi[j];
              p[j] += dx;
          } else {
            // assume SGD
            if(this.momentum > 0.0) {
              // momentum update
              var dx = this.momentum * gsumi[j] - this.learning_rate * gij; // step
              gsumi[j] = dx; // back this up for next iteration of momentum
              p[j] += dx; // apply corrected gradient
            } else {
              // vanilla sgd
              p[j] +=  - this.learning_rate * gij;
            }
          }
          g[j] = 0.0; // zero out gradient so that we can begin accumulating anew
        }
      }
    }

    // appending softmax_loss for backwards compatibility, but from now on we will always use cost_loss
    // in future, TODO: have to completely redo the way loss is done around the network as currently
    // loss is a bit of a hack. Ideally, user should specify arbitrary number of loss functions on any layer
    // and it should all be computed correctly and automatically.
    return {'fwd_time': fwd_time, 'bwd_time': bwd_time,
            'l2_decay_loss': l2_decay_loss, 'l1_decay_loss': l1_decay_loss,
            'cost_loss': cost_loss, 'softmax_loss': cost_loss,
            'loss': cost_loss + l1_decay_loss + l2_decay_loss};
  };

  convnetjs.SGDTrainer = convnetjs.Trainer; // backwards compatibility
});

goog.exportSymbol('convnetjs.SGDTrainer', convnetjs.SGDTrainer);
