/* eslint-disable */
class Util {
  // 绘制色盘
  static drawColorDisk (ctx, x, y, r) {
    for (let i = 0; i <= r; i+=0.4) {
      for (let j = 0; j < Math.PI*2; j+= Math.PI/90) {
        const rgbarr = this.hvStoRGB(j,255,i);
        ctx.strokeStyle = 'rgb('+rgbarr.r+','+rgbarr.g+','+rgbarr.b+')';
        ctx.beginPath();
        ctx.arc(x,y,i,-j,-j-Math.PI/90,true);
        ctx.stroke();
      }
    }
    return false;
  }
  static hvStoRGB(hi, vi, si) {
    let h = hi * 180 / Math.PI;
    const rgb = {};
    h = Math.round(h);
    let s = Math.round(si * 255 / 100);
    let v = Math.round(vi * 1);
    if (s === 0) {
      rgb.r = rgb.g = rgb.b = v;
    } else {
      let t1 = v;
      let t2 = (255 - s) * v / 255;
      let t3 = (t1 - t2) * (h % 60) / 60;
      if ( h === 360 ) h = 0;
      if ( h < 60 ) { rgb.r = t1; rgb.b = t2; rgb.g = t2 + t3; }
      else if ( h < 120 ) {rgb.g = t1; rgb.b = t2; rgb.r = t1 - t3; }
      else if ( h < 180 ) {rgb.g = t1; rgb.r = t2; rgb.b = t2 + t3; }
      else if ( h < 240 ) {rgb.b = t1; rgb.r = t2; rgb.g = t1 - t3; }
      else if ( h < 300 ) {rgb.b = t1; rgb.g = t2; rgb.r = t2 + t3; }
      else if ( h < 360 ) {rgb.r = t1; rgb.g = t2; rgb.b = t1 - t3; }
      else { rgb.r = 255; rgb.g = 255; rgb.b = 255; }
    }
    return {
      r: rgb.r < 0 ? 0 : Math.round(rgb.r),
      g: rgb.g < 0 ? 0 : Math.round(rgb.g),
      b: rgb.b < 0 ? 0 : Math.round(rgb.b)
    };
  }
  static RGBtoHvs(r, g, b) {
    const rgb = {
      r: r,
      g: g,
      b: b,
    };
    const hsb = { h: 0, s: 0, b: 0 };
    let min = Math.min(rgb.r, rgb.g, rgb.b);
    let max = Math.max(rgb.r, rgb.g, rgb.b);
    let delta = max - min;
    hsb.b = max;
    hsb.s = max !== 0 ? 255 * delta / max : 0;
    if ( hsb.s !== 0 ) {
      if ( rgb.r === max ) {
        hsb.h = (rgb.g - rgb.b) / delta;
      } else if ( rgb.g === max ) {
        hsb.h = 2 + (rgb.b - rgb.r) / delta;
      } else {
        hsb.h = 4 + (rgb.r - rgb.g) / delta;
      }
    } else {
      hsb.h = -1;
    }
    hsb.h *= 60;
    if ( hsb.h < 0 ) {
      hsb.h += 360;
    }
    hsb.s *= 100 / 255;
    return hsb;
  }
  static selectorLocation (rgb) {
    const hsb = this.RGBtoHvs(rgb.r, rgb.g, rgb.b);
    let r = hsb.s;
    let h =360 - hsb.h;
    let y = Math.sin(h * Math.PI/180)*r;
    let x =Math.cos(h*Math.PI/180)*r;
    if (h >= 0 && h < 90) {
      x = Math.abs(x);
      y = Math.abs(y);
    } else if (h >= 90 && h < 180) {
      x = 0 - Math.abs(x);
      y = Math.abs(y);
    } else if (h >= 180 && h < 270) {
      x = 0 - Math.abs(x);
      y = 0 - Math.abs(y);
    } else if (h >= 270 && h < 360) {
      x = Math.abs(x);
      y = 0 - Math.abs(y);
    }
    return { x: x, y: y };
  }
  static rMax (rgb) {
    const hsb = this.RGBtoHvs(rgb.r, rgb.g, rgb.b);
    let r = hsb.s;
    let h =360-hsb.h;
    let y = Math.sin(h * Math.PI/180)*r;
    let x =Math.cos(h*Math.PI/180)*r;
    if (h >= 0 && h < 90) {
      x = Math.abs(x);
      y = Math.abs(y);
    } else if (h >= 90 && h < 180) {
      x = 0 - Math.abs(x);
      y = Math.abs(y);
    } else if (h >= 180 && h < 270) {
      x = 0 - Math.abs(x);
      y = 0 - Math.abs(y);
    } else if (h >= 270 && h < 360) {
      x = Math.abs(x);
      y = 0 - Math.abs(y);
    }
    return { x: x, y: y };
  }

  static getSelectorRadians(xt, yt, centerX, centerY,radian) {
    const xl = xt - centerX;
    const yl = yt - centerY;
    let r = Math.round(Math.sqrt(xl*xl + yl* yl));
    const maxr = r;
    r = r > radian ? radian : r;
    let sins = 0;
    if (xl >= 0 && yl > 0) {
      sins = 0;
      if (yl !== 0) {
        const m = Math.abs(yl)/r > 1 ? 1 : Math.abs(yl)/r;
        sins +=  Math.asin(m);
      }
    } else if (xl <= 0 && yl > 0) {
      sins = 0.5 * Math.PI;
      if (xl !== 0) {
        const m = Math.abs(xl)/r > 1 ? 1 : Math.abs(xl)/r;
        sins += Math.asin(m);
      }
    } else if (xl < 0 && yl <= 0) {
      sins = Math.PI;
      if (yl !== 0) {
        const m = Math.abs(yl)/r > 1 ? 1 : Math.abs(yl)/r;
        sins +=  Math.asin(m);
      }
    } else if (xl > 0 && yl <= 0) {
      sins = 1.5*Math.PI;
      if (xl !== 0) {
        const m = Math.abs(xl)/r > 1 ? 1 : Math.abs(xl)/r;
        sins += Math.asin(m);
      }
    }
    return {
      radian: Math.PI*2 - sins,
      r: r,
      maxr: maxr,
    }
  }

  // rgb转16进制
  static rgbToHex (color){
    if(color.indexOf("#") != -1) {
      return color;
    }
    let arr = color.split(', ');
    let r = +arr[0].split('(')[1];
    let g = +arr[1];
    let b = +arr[2].split(')')[0];
    let value = (1 << 24) + r * (1 << 16) + g * (1 << 8) + b;
    value = value.toString(16);
    return value.slice(1);
  }

  static hexTorgb (hex){
    var hexNum = hex;
    var rgb = {};
    hexNum = '0x' + (hexNum.length < 6 ? repeatLetter(hexNum, 2) : hexNum);
    var r = hexNum >> 16;
    var g = hexNum >> 8 & '0xff';
    var b = hexNum & '0xff';
    // return `rgb(${r},${g},${b})`;
    return rgb = { r: r, g: g, b: b };
    function repeatWord(word, num){
        var result = '';
        for(let i = 0; i < num; i ++){
            result += word;
        }
        return result;
    }
    function repeatLetter(word, num){
        var result = '';
        for(let letter of word){
            result += repeatWord(letter, num);
        }
        return result;
    }
}
  static rgbToHsv (arr){
    var h = 0, s = 0, v = 0;
    var r = arr[0], g = arr[1], b = arr[2];
    arr.sort(function (a, b) {
        return a - b;
    })
    var max = arr[2]
    var min = arr[0];
    v = max / 255;
    if (max === 0) {
        s = 0;
    } else {
        s = 1 - (min / max);
    }
    if (max === min) {
        h = 0;//事实上，max===min的时候，h无论为多少都无所谓
    } else if (max === r && g >= b) {
        h = 60 * ((g - b) / (max - min)) + 0;
    } else if (max === r && g < b) {
        h = 60 * ((g - b) / (max - min)) + 360
    } else if (max === g) {
        h = 60 * ((b - r) / (max - min)) + 120
    } else if (max === b) {
        h = 60 * ((r - g) / (max - min)) + 240
    }
    h = parseInt(h);
    s = parseInt(s * 100);
    v = parseInt(v * 100);
    return { h, s, v }
  }

  static hsvToRgb(arr) {
    var h = arr[0], s = arr[1], v = arr[2];
    s = s / 100;
    v = v / 100;
    var r = 0, g = 0, b = 0;
    var i = parseInt((h / 60) % 6);
    var f = h / 60 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    switch (i) {
        case 0:
            r = v; g = t; b = p;
            break;
        case 1:
            r = q; g = v; b = p;
            break;
        case 2:
            r = p; g = v; b = t;
            break;
        case 3:
            r = p; g = q; b = v;
            break;
        case 4:
            r = t; g = p; b = v;
            break;
        case 5:
            r = v; g = p; b = q;
            break;
        default:
            break;
    }
    r = parseInt(r * 255.0)
    g = parseInt(g * 255.0)
    b = parseInt(b * 255.0)
    return { r, g, b };
  }
  // static hsvToRgb(arr) {
  //   let h = 50
  //   let s = 99
  //   let v = 100
  //   let i, f, p1, p2, p3;
  //   let r = 0, g = 0, b = 0;
  //   if (s < 0) s = 0;
  //   if (s > 1) s = 1;
  //   if (v < 0) v = 0;
  //   if (v > 1) v = 1;
  //   h %= 360;
  //   if (h < 0) h += 360;
  //   h /= 60;
  //   i = Math.floor(h);
  //   f = h - i;
  //   p1 = v * (1 - s);
  //   p2 = v * (1 - s * f);
  //   p3 = v * (1 - s * (1 - f));
  //   switch(i) {
  //       case 0: r = v;  g = p3; b = p1; break;
  //       case 1: r = p2; g = v;  b = p1; break;
  //       case 2: r = p1; g = v;  b = p3; break;
  //       case 3: r = p1; g = p2; b = v;  break;
  //       case 4: r = p3; g = p1; b = v;  break;
  //       case 5: r = v;  g = p1; b = p2; break;
  //   }
  //   return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
  // }
  static ex16hex(value) {
    // value = stripscript(value);
    value = value.replace("0x","");
    var arr = value.split("");
    arr = arr.reverse();
    var len = arr.length;
    var res = 0;
    $.each(arr, function(i,v){
        var num = hex_change(v);
        res += muti16(num, i);
    });
    return res;
  }
}

export default Util;
