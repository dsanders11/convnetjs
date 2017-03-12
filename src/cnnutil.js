goog.provide('cnnutil');


goog.scope(function() {
  /**
   * a window stores _size_ number of values
   * and returns averages. Useful for keeping running
   * track of validation or training accuracy during SGD
   * @constructor
   * @param {number} size
   * @param {number} minsize
   * @export
   */
  cnnutil.Window = function(size, minsize) {
    this.v = [];
    this.size = typeof(size)==='undefined' ? 100 : size;
    this.minsize = typeof(minsize)==='undefined' ? 20 : minsize;
    this.sum = 0;
  };

  /**
   * @param {number} x
   * @export
   */
  cnnutil.Window.prototype.add = function(x) {
    this.v.push(x);
    this.sum += x;
    if(this.v.length>this.size) {
      var xold = this.v.shift();
      this.sum -= xold;
    }
  };

  /**
   * @return {number}
   * @export
   */
  cnnutil.Window.prototype.get_average = function() {
    if(this.v.length < this.minsize) return -1;
    else return this.sum/this.v.length;
  };

  /**
   * @export
   */
  cnnutil.Window.prototype.reset = function() {
    this.v = [];
    this.sum = 0;
  };

  /**
   * returns min, max and indeces of an array
   * @param {!Array} w
   * @return {!Object}
   * @export
   */
  cnnutil.maxmin = function(w) {
    if(w.length === 0) { return {}; } // ... ;s

    var maxv = w[0];
    var minv = w[0];
    var maxi = 0;
    var mini = 0;
    for(var i=1;i<w.length;i++) {
      if(w[i] > maxv) { maxv = w[i]; maxi = i; }
      if(w[i] < minv) { minv = w[i]; mini = i; }
    }
    return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv:maxv-minv};
  };

  /**
   * @param {number} x
   * @param {number} d
   * @return {string} string representation of float truncated to d digits
   * @export
   */
  cnnutil.f2t = function(x, d) {
    if(typeof(d)==='undefined') { d = 5; }
    var dd = 1.0 * Math.pow(10, d);
    return '' + Math.floor(x*dd)/dd;
  };
});
