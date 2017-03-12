/**
 * @fileoverview
 * @suppress {extraRequire}
 */
goog.provide('convnetjs.vol.util');
goog.require('convnetjs.Vol');
goog.require('convnetjs.util');


goog.scope(function() {
  /**
   * @param {convnetjs.Vol} V
   * @param {number} crop the size of output
   * @param {number} dx x offset wrt incoming volume, of the shift
   * @param {number} dy y offset wrt incoming volume, of the shift
   * @param {boolean} fliplr whether we also want to flip left<->right
   * @return {convnetjs.Vol}
   * @export
   */
  convnetjs.augment = function(V, crop, dx, dy, fliplr) {
    // note assumes square outputs of size crop x crop
    if(typeof(fliplr)==='undefined') fliplr = false;
    if(typeof(dx)==='undefined') dx = convnetjs.randi(0, V.sx - crop);
    if(typeof(dy)==='undefined') dy = convnetjs.randi(0, V.sy - crop);

    // randomly sample a crop in the input volume
    var W;
    if(crop !== V.sx || dx!==0 || dy!==0) {
      W = new convnetjs.Vol(crop, crop, V.depth, 0.0);
      for(var x=0;x<crop;x++) {
        for(var y=0;y<crop;y++) {
          if(x+dx<0 || x+dx>=V.sx || y+dy<0 || y+dy>=V.sy) continue; // oob
          for(var d=0;d<V.depth;d++) {
           W.set(x,y,d,V.get(x+dx,y+dy,d)); // copy data over
          }
        }
      }
    } else {
      W = V;
    }

    if(fliplr) {
      // flip volume horziontally
      var W2 = W.cloneAndZero();
      for(var x=0;x<W.sx;x++) {
        for(var y=0;y<W.sy;y++) {
          for(var d=0;d<W.depth;d++) {
           W2.set(x,y,d,W.get(W.sx - x - 1,y,d)); // copy data over
          }
        }
      }
      W = W2; //swap
    }
    return W;
  };

  /**
   * @param {HTMLImageElement} img a DOM element that contains a loaded image
   * @param {boolean} convert_grayscale
   * @return {(boolean|convnetjs.Vol)} Vol of size (W, H, 4). 4 is for RGBA
   * @export
   */
  convnetjs.img_to_vol = function(img, convert_grayscale) {
    if(typeof(convert_grayscale)==='undefined') convert_grayscale = false;

    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");

    // due to a Firefox bug
    try {
      ctx.drawImage(img, 0, 0);
    } catch (e) {
      if (e.name === "NS_ERROR_NOT_AVAILABLE") {
        // sometimes happens, lets just abort
        return false;
      } else {
        throw e;
      }
    }

    try {
      var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      if(e.name === 'IndexSizeError') {
        return false; // not sure what causes this sometimes but okay abort
      } else {
        throw e;
      }
    }

    // prepare the input: get pixels and normalize them
    var p = img_data.data;
    var W = img.width;
    var H = img.height;
    var pv = [];
    for(var i=0;i<p.length;i++) {
      pv.push(p[i]/255.0-0.5); // normalize image pixels to [-0.5, 0.5]
    }
    var x = new convnetjs.Vol(W, H, 4, 0.0); //input volume (image)
    x.w = pv;

    if(convert_grayscale) {
      // flatten into depth=1 array
      var x1 = new convnetjs.Vol(W, H, 1, 0.0);
      for(var i=0;i<W;i++) {
        for(var j=0;j<H;j++) {
          x1.set(i,j,0,x.get(i,j,0));
        }
      }
      x = x1;
    }

    return x;
  };
});
