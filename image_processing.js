if(window.Image)
	var Image = window.Image;

(function(){
/**
 * @param  {Number} r  0 - 255
 * @param  {Number} g  0 - 255
 * @param  {Number} b  0 - 255
 * @return {ImageProcessing.Color}
 */
var Color = function(r, g, b, a){
	if(!(a || a === 0)) a = 1;

	// to Number
	this.r = r * 1;
	this.g = g * 1;
	this.b = b * 1;
	this.a = a * 1;
};

Color.prototype = {
	constructor: Color,

	toString: function(){
		var c = this.round();
		return  c.a !== 1 ? "rgba(" + [c.r, c.g, c.b, c.a] + ")"
		                  : "rgb(" + [c.r, c.g, c.b] + ")";
	},

	valueOf: function(){
		return this.toString();
	},

	round: function(){
		return new Color(
			  (this.r > 255)? 255
			: (this.r <   0)? 0
			: Math.round(this.r),

			  (this.g > 255)? 255
			: (this.g <   0)? 0
			: Math.round(this.g),

			  (this.b > 255)? 255
			: (this.b <   0)? 0
			: Math.round(this.b),

			  (this.a > 1) ? 1
			: (this.a < 0) ? 0
			: this.a
		);
	},

	each: function(f){
		f(this.r, "r", this);
		f(this.g, "g", this);
		f(this.b, "b", this);

		return this;
	},

	map: function(f){
		return new Color(
			f(this.r, "r", this),
			f(this.g, "g", this),
			f(this.b, "b", this)
		);
	},

	clone: function(){
		return new Color(this.r, this.g, this.b, this.a);
	},

	add: function(c){
		return Color.fromRgba(
			this.r + c.r,
			this.g + c.g,
			this.b + c.b,
			this.a + c.a
		).round();
	},

	sub: function(c){
		return Color.fromRgba(
			this.r - c.r,
			this.g - c.g,
			this.b - c.b,
			this.a - c.a
		).round();
	},

	mul: function(c){
		return Color.fromRgba(
			this.r * c.r,
			this.g * c.g,
			this.b * c.b,
			this.a * c.a
		).round();
	},

	div: function(c){
		return Color.fromRgba(
			this.r / c.r,
			this.g / c.g,
			this.b / c.b,
			this.a / c.a
		).round();
	},

	max: function(){
		return Math.max(this.r, this.g, this.b);
	},

	min: function(){
		return Math.min(this.r, this.g, this.b);
	},

	average: function(){
		return (this.r + this.g + this.b) / 3;
	},

	geomean: function(){
		return Math.pow(this.r * this.g * this.b, 1/3);
	},

	middle: function(){
		return (this.max() + this.min()) / 2;
	},

	blend: function(bpx){
		var ori = this.round();
		var ble = bpx.round();

		if(ble.a === 0)
			return ori;

		if(ori.a === 0 || ble.a === 1)
			return ble;

		// ori.a = 1
		// 0 < ble.a < 1
		if(ori.a == 1){
			return Color.fromHex(0).each(function(v, k, px){
				px[k] = ble[k] * ble.a + ori[k] * (1 - ble.a);
			});
		}

		// 0 < ori.a < 1
		// 0 < ble.a < 1
		var res = Color.fromHex(0).each(function(v, k, px){
			px[k] = ble[k] * ble.a + ori[k] * ori.a * (1 - ble.a);
		});

		res.a = ori.a + ble.a - ori.a * ble.a;

		return res;
	},

	intensity: function(v){
		return new Color(this.r + v, this.g + v, this.b + v);
	},

	threshold: function(r, g, b){
		if(!!r && r.constructor == Color){
			r = r.r;
			g = r.g;
			b = r.b;
		}

		if(!r && r !== 0) r = 127;
		if(!g && g !== 0) g = r;
		if(!b && b !== 0) b = r;

		var tc = new Color(r, g, b); // threshold Color
		var c  = new Color(0, 0, 0);

		this.each(function(v, x){
			c[x] = (v > tc[x])? 255 : 0;
		});

		return c;
	},

	gamma: function(g){
		var c = new Color(0, 0, 0);

		c.r = 255 * Math.pow(this.r / 255, g);
		c.g = 255 * Math.pow(this.g / 255, g);
		c.b = 255 * Math.pow(this.b / 255, g);

		return c;
	},

	grayScale: function(){
		var v = this.r * 0.222015 + this.g * 0.706655 + this.b * 0.071330;
		return new Color(v, v, v);
	},

	 ntsc: function(){
		var v = this.r * 299 / 1000 + this.g * 587 / 1000 + this.b * 57 / 500;
		return new Color(v, v, v);
	},

	hdtv: function(x){
		if(!x) x = 1;

		var r = Math.pow(this.r, x) *  44403 / 200000;
		var g = Math.pow(this.g, x) * 141331 / 200000;
		var b = Math.pow(this.b, x) *   7133 / 100000;
		var y = Math.pow(r + g + b, 1 / x);

		return new Color(y, y, y);
	},

	invert: function(){
		return new Color(255 - this.r, 255 - this.g, 255 - this.b, this.a);
	},

	/**
	 * @param  {Number} v  lightness value
	 * @return {ImageProcessing.Color}
	 */
	sepia: function(v){
		if(!v) v = 1;
		return new Color(this.r * 957 * v / 1000,
		                 this.g * 784 * v / 1000,
		                 this.b * 567 * v / 1000);
	},

	/**
	 * @return {Number[]} h, s, v
	 */
	hsv: function(){
		return [this.hue(), this.saturation(), this.brightness()];
	},

	/**
	 * @return {Number} 0 - 359
	 */
	hue: function(){
		var c = this.round();

		var max = c.max();
		if(!max) return 0;

		var min = c.min();
		if(max == min) return 0;

		var range = max - min;

		switch(max){
			case c.r: return 60 * (c.g - c.b) / range;
			case c.g: return 60 * (c.b - c.r) / range + 120;
			case c.b: return 60 * (c.r - c.g) / range + 240;
		}
	},

	/**
	 * @return {Number} 0 - 255
	 */
	saturation: function(){
		var max = this.max();
		if(!max) return 0;
		return 255 * (max - this.min()) / max;
	},

	/**
	 * @return 0 - 255
	 */
	brightness: function(){
		return this.max();
	}
};

Color.fromRgb = function(r, g, b){
	return new Color(r, g, b);
};

Color.fromRgba = function(r, g, b, a){
	if(!(a || a == 0)) a = 1;
	return new Color(r, g, b, a);
};

/**
 * @param  {String} s  "rgb(r,g,b)"
 * @return {ImageProcessing.Color}
 */
Color.fromRgbString = function(s){
	var r = /\d{1,3}/g;
	return new Color(r.exec(s), r.exec(s), r.exec(s));
};

/**
 * @param  {String} s  "rgba(r,g,b,a)"
 * @return {ImageProcessing.Color}
 */
Color.fromRgbaString = function(s){
	var r = /\d{1,3}/g;
	var c = new Color(r.exec(s), r.exec(s), r.exec(s));

	c.a = parseFloat(/1|0.\d+|0/.exec(s.split(",")[3]));

	if(isNaN(c.a))
		c.a = 1;

	return c;
};

/**
 * @param  {String} s  "#rrggbb"
 * @return {ImageProcessing.Color}
 */
Color.fromHexString = function(s){
	var color = parseInt(s.substr(1), 16);
	return new Color(color >> 16, color >> 8 & 255, color & 255);
};

/**
 * @param  {Number} h   0xrrggbb
 * @return {ImageProcessing.Color}
 */
Color.fromHex = function(h){
	return new Color(h >> 16, h >> 8 & 255, h & 255);
};

/**
 * @param  {Number} c   0 - 255
 * @param  {Number} m   0 - 255
 * @param  {Number} y   0 - 255
 * @return {ImageProcessing.Color}
 */
Color.fromCmy = function(c, m, y){
	return new Color(255 - c, 255 - m, 255 - y);
};

/**
 * @param  {Number} h   0 - 359
 * @param  {Number} s   0 - 255
 * @param  {Number} v   0 - 255
 * @return {ImageProcessing.Color}
 */
Color.fromHsv = function(h, s, v){
	if(s == 0) return new Color(v, v, v);

	var hi = (h / 60 >> 0) % 6;

	var f  = h / 60 - hi;
	var t1 = v * (1 - s / 255);
	var t2 = v * (1 - f * s / 255);
	var t3 = v * (1 - (1 - f) * s / 255);

	switch(hi){
		case 0 : return Color.fromRgb( v, t3, t1).round();
		case 1 : return Color.fromRgb(t2,  v, t1).round();
		case 2 : return Color.fromRgb(t1,  v, t3).round();
		case 3 : return Color.fromRgb(t1, t2,  v).round();
		case 4 : return Color.fromRgb(t3, t1,  v).round();
		default: return Color.fromRgb( v, t1, t2).round();
	}
};

/**
 * @param  {Number} h   0 - 359
 * @param  {Number} s   0 - 1
 * @param  {Number} l   0 - 1
 * @return {ImageProcessing.Color}
 */
Color.fromHsl = function(h, s, l){
	if(s == 0) return new Color(l, l, l);

	var c  = (l <= 1 / 2)? 2 * s * l
	                     : 2 * s * (1 - l);
	var _h = (h % 360) / 60;
	var x  = c * (1 - Math.abs(_h % 2 - 1));
	var m  = l - c / 2;
	var r, g, b;

	switch(_h >> 0){
		case  0: r = c, g = x, b = 0; break;
		case  1: r = x, g = c, b = 0; break;
		case  2: r = 0, g = c, b = x; break;
		case  3: r = 0, g = x, b = c; break;
		case  4: r = x, g = 0, b = c; break;
		case  5:
		case  6: r = c, g = 0, b = x; break;
		default: r = 0, g = 0, b = 0;
	}
	
	return Color.fromRgb(255 * (r + m), 255 * (g + m), 255 * (b + m)).round();
};

/**
 * @param  {Number} y    0 - 255
 * @param  {Number} cb   0 - 255
 * @param  {Number} cr   0 - 255
 * @return {ImageProcessing.Color}
 */
Color.fromYcc = function(y, cb, cr){
	var n1 = (y  -  16) * 255       / 219,
	    n2 = (cb - 128) * 255 * 886 / 112000,
	    n3 = (cr - 128) * 255 * 701 / 112000;
	return new Color(n1 + n3,
	                 n1 - (n2 * 114 + n3 * 299) / 587,
	                 n1 + n2);
};

/* Colors */
Color.black = function(){
	return new Color(0, 0, 0);
};

Color.white = function(){
	return new Color(255, 255, 255);
};

Color.red = function(){
	return new Color(255, 0, 0);
};

Color.green = function(){
	return new Color(0, 255, 0);
};

Color.lime = Color.green;

Color.blue = function(){
	return new Color(0, 0, 255);
};

Color.gray = function(){
	return new Color(127, 127, 127);
};

Color.aqua = function(){
	return new Color(0, 255, 255);
};

Color.cyan = Color.aqua;

Color.yellow = function(){
	return new Color(255, 255, 0);
};

Color.magenta = function(){
	return new Color(255, 0, 255);
};

ImageProcessing.Color = Color;

ImageProcessing.prototype.color = function(r, g, b){
	return new Color(r, g, b);
};
})();


/**
 * @class Image Processing
 * @param {HTMLCanvasElement} element
 */
function ImageProcessing(element){
	this.init(element);
}

/**
 * create object by image source
 * @param  {String}   src    source
 * @param  {Function} onload callback
 * @return {ImageProcessing}
 */
ImageProcessing.load = function(src, onload){
	var canvas = document.createElement("canvas");
	var ip     = new ImageProcessing(canvas);
	var img    = new Image;
	var drawed = false;

	img.onload = function(e){
		if(!drawed) draw();
		if(onload) onload.call(ip, ip, e);
	};

	img.src = src;

	try{ draw(); }
	catch(e){}

	return ip;

	function draw(){
		ip.width  = (canvas.width  = img.naturalWidth  || img.width);
		ip.height = (canvas.height = img.naturalHeight || img.height);

		if(!ip.width || !ip.height) return;

		ip.context.drawImage(img, 0, 0, canvas.width, canvas.height);

		drawed = true;
	}
};

/**
 * load by video element
 * @param  {HTMLVideoElement} video
 * @param  {Function}         onload callback
 * @return {ImageProcessing}
 */
ImageProcessing.loadVideo = function(video, onload){
	var canvas = document.createElement("canvas");
	var ip     = new ImageProcessing(canvas);
	var drawed = false;

	var _onload = function(e){
		if(!drawed) draw();
		if(onload) onload.call(ip, ip, e);
		video.removeEventListener(arguments.callee);
	};

	video.addEventListener("canplay", _onload, false);

	try{ draw(); }
	catch(e){}

	return ip;

	function draw(){
		var w = video.videoWidth  || video.width;
		var h = video.videoHeight || video.height;

		if(!w || !h) return;

		ip.width  = canvas.width  = w;
		ip.height = canvas.height = h;

		ip.context.drawImage(video, 0, 0, canvas.width, canvas.height);

		drawed = true;
	}
};

ImageProcessing.prototype = {
	/**
	 * constructor
	 */
	init: function(element){
		if(!element) element = document.createElement("canvas");

		this.canvas  = element;
		this.context = this.canvas.getContext("2d");
		this.width   = this.canvas.width;
		this.height  = this.canvas.height;
		this.locked  = false;

		// set browser support
		// use native setPixel/setPixel if support opera-2dgame
		if(!ImageProcessing.support){
			ImageProcessing.support = {
				pixel    : false,
				imageData: !!this.context.getImageData
			};

			try{
				this.gContext = this.canvas.getContext("opera-2dgame");
				ImageProcessing.support.pixel = !!this.gContext;
			}
			catch(e){}
		}

		this.support = ImageProcessing.support;
		this.initPixelControl();

		// origin ImageProcessing for clip
		this.origin = {
			process: null,
			x: null,
			y: null
		};

		// temporary image data
		this.tmp = {
			// All
			imageData : null,
			// 1 * 1
			imageData1: this.context.createImageData?
				this.context.createImageData(1, 1) : {
					width : 1,
					height: 1,
					data  : [0, 0, 0, 255]
				}
		};

		return this;
	},

	/**
	 * load by image source
	 * @param {string}   src image file
	 * @param {number=0} x   left
	 * @param {number=0} y   top
	 * @param {number=}  w   image width
	 * @param {number=}  h   image height
	  * @return {ImageProcessing}
	 */
	load: function(src, x, y, w, h){
		if(!x) x = 0;
		if(!y) y = 0;

		var img = new Image();
		img.src = src;

		if(!w) w = img.naturalWidth  || img.width;
		if(!h) h = img.naturalHeight || img.height;

		this.context.drawImage(img, x, y, w, h);

		return this;
	},

	/**
	 * draw image
	 * @param {HTMLImageElement|HTMLVideoElement} src image element
	 * @param {number=0} x   left
	 * @param {number=0} y   top
	 * @param {number=}  w   image width
	 * @param {number=}  h   image height
	 * @return {ImageProcessing}
	 */
	drawImage: function(img, x, y, w, h){
		if(!x) x = 0;
		if(!y) y = 0;
		if(!w) w = img.naturalWidth  || img.videoWidth  || img.width;
		if(!h) h = img.naturalHeight || img.videoHeight || img.height;
		this.context.drawImage(img, x, y, w, h);
		if(this.locked) this.lock();
		return this;
	},

	/**
	 * clone ImageProcessing object
	 * @return {ImageProcessing} cloned ImageProcessing
	 */
	clone: function(){
		var ip = new ImageProcessing(this.canvas.cloneNode(true));
		return ip.putImageData(this.getImageData());
	},

	appendTo: function(element){
		element.appendChild(this.canvas);
		return this;
	},

	clear: function(){
		var w = this.canvas.width;
		this.canvas.width = 0;
		this.canvas.width = w;
		if(this.locked) this.lock();
		return this;
	},

	/**
	 * get data url
	 */
	data: function(type){
		return this.canvas.toDataURL(type);
	},

	getPixel: function(x, y){
		return ImageProcessing.Color.fromHexString(this.gContext.getPixel(x, y));
	},

	/**
	 * replace pixel
	 */
	setPixel: function(x, y, pixel){
		this.gContext.setPixel(x, y, pixel.toString());
		return this;
	},

	/**
	 * alpha blend
	 */
	blendPixel: function(x, y, pixel){
		return this.setPixel(x, y, this.getPixel(x, y).blend(pixel));
	},

	/**
	 * lock canvas update
	 */
	lock: function(){
		this.locked = true;

		if(this.support.pixel)
			this.gContext.lockCanvasUpdates(this.locked);
		else
			this.tmp.imageData = this.getImageData();

		return this;
	},

	unlock: function(){
		this.locked = false;

		if(this.support.pixel)
			this.gContext.lockCanvasUpdates(this.locked);

		return this;
	},

	/**
	 * update canvas image
	 */
	update: function(){
		if(this.support.pixel)
			this.gContext.updateCanvas();
		else if(this.tmp.imageData)
			this.putImageData(this.tmp.imageData, 0, 0);

		return this;
	},

	/**
	 * get pixel by ImageData index
	 */
	index: function(index, px){
		index *= 4;
		var data = (this.locked? this.tmp.imageData
			                     : this.getImageData()).data;

		return new ImageProcessing.Color(data[index++],
		                                 data[index++],
		                                 data[index++],
		                                 data[index] / 255);
	},

	each: function(f){
		var w = this.canvas.width,
		    i = -1,
		    l = w * this.canvas.height;
		while(++i < l) f.call(this, this.index(i), i % w, i / w >> 0, this);
		return this;
	},

	blendEach: function(f){
		var w = this.canvas.width,
		    x, y,
		    i = -1,
		    l = w * this.canvas.height;

		while(++i < l){
			x = i % w;
			y = i / w >> 0;
			this.blendPixel(x, y, f.call(this, this.getPixel(x, y), x, y, this));
		}

		return this;
	},

	setEach: function(f){
		var w = this.canvas.width,
		    px, x, y,
		    i = -1,
		    l = w * this.canvas.height;

		while(++i < l){
			x  = i % w;
			y  = i / w >> 0;
			px = this.index(i);
			this.setPixel(x, y, f.call(this, px, x, y, this) || px);
		}

		return this;
	},

	map: function(f){
		var a = [],
		    w = this.canvas.width,
		    x, y,
		    i = -1,
		    l = w * this.canvas.height;

		while(++i < l){
			x = i % w;
			y = i / w >> 0;
			a[i] = f.call(this, this.getPixel(x, y), x, y, this);
		}

		return a;
	},

	getImageData: function(from_x, from_y, width, height){
		if(!from_x) from_x = 0;
		if(!from_y) from_y = 0;
		if(!width)  width  = this.width  || this.canvas.width;
		if(!height) height = this.height || this.canvas.height;

		return this.context.getImageData(from_x, from_y, width, height);
	},

	putImageData: function(imageData, x, y){
		if(!x) x = 0;
		if(!y) y = 0;

		this.context.putImageData(imageData, x, y);

		if(this.locked) this.lock();

		return this;
	},

	clip: function(x, y, width, height){
		var canvas    = this.canvas.cloneNode();
		var ip        = new ImageProcessing(canvas);
		var imageData = this.getImageData(x, y, width, height);

		ip.width  = canvas.width  = width;
		ip.height = canvas.height = height;
		ip.origin.x = x;
		ip.origin.y = y;

		ip.putImageData(imageData, 0, 0, width, height);

		return ip;
	},

	merge: function(process, x, y){
		if(!x && x != 0) x = process.origin.x;
		if(!y && y != 0) y = process.origin.y;
		this.putImageData(process.getImageData(0, 0, process.canvas.width,
		                                             process.canvas.height),
		                  x, y);
		return this;
	},

	trim: function(isLeftTop){
		if(typeof isLeftTop == "undefined")
			isLeftTop = true;

		var width  = this.canvas.width,
		    height = this.canvas.height,
		    rect   = [0, 0, width, height],
		    color = isLeftTop? this.getPixel(0, 0).toString()
			                   : this.getPixel(this.canvas.width - 1, this.canvas.height - 1)
			                         .toString();

		loop:
		for(var x = 0; x < width; x++){
			for(var y = 0; y < height; y++) if(color != this.getPixel(x, y).toString())
				break loop;
			rect[0]++;
		}

		loop:
		for(y = 0; y < height; y++){
			for(x = 0; x < width; x++) if(color != this.getPixel(x, y).toString())
				break loop;
			rect[1]++;
		}

		loop:
		for(x = width - 1; x >= 0; x--){
			for(y = height - 1; y >= 0; y--) if(color != this.getPixel(x, y).toString())
				break loop;
			rect[2]--;
		}

		loop:
		for(y = height - 1; y >= 0; y--){
			for(x = width - 1; x >= 0; x--) if(color != this.getPixel(x, y).toString())
				break loop;
			rect[3]--;
		}

		var clip = this.clip(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
		this.canvas.width  = clip.canvas.width;
		this.canvas.height = clip.canvas.height;

		this.lock();
		this.tmp.imageData = clip.getImageData();
		this.update();

		if(!this.locked) this.unlock();

		return this;
	},

	average: function(fromX, fromY, width, height){
		if(!fromX)  fromX  = 0;
		if(!fromY)  fromY  = 0;
		if(!width)  width  = this.canvas.width;
		if(!height) height = this.canvas.height;

		var pixelN = width * height;
		var color  = new ImageProcessing.Color(0, 0, 0);
		var _color;
		var x = fromX - 1, y
		    w = fromX + width,
		    h = fromY + height;

		while(++x < w) for(y = fromY - 1; ++y < h;){
			_color = this.getPixel(x, y);
			color.r += _color.r;
			color.g += _color.g;
			color.b += _color.b;
		}

		return color.map(function(v){
			return parseInt(v / pixelN);
		});
	},

	histogram: function(){
		var data = {r: [], g: [], b: []};

		for(var i = 0; i <= 255; i++)
			data.r.push(0);

		data.g = data.r.concat([]);
		data.b = data.r.concat([]);

		this.each(function(px){
			data.r[px.r]++;
			data.g[px.g]++;
			data.b[px.b]++;
		});

		return data;
	},

	extremum: function(){
		var data = {r: [], g: [], b: []};

		this.each(function(px){
			data.r.push(px.r);
			data.g.push(px.g);
			data.b.push(px.b);
		});

		return [
			new ImageProcessing.Color(Math.min.apply(null, data.r),
			                          Math.min.apply(null, data.g),
			                          Math.min.apply(null, data.b)),
			new ImageProcessing.Color(Math.max.apply(null, data.r),
			                          Math.max.apply(null, data.g),
			                          Math.max.apply(null, data.b))
		];
	},

	max: function(){
		var data = {r: [], g: [], b: []};

		this.each(function(px){
			data.r.push(px.r);
			data.g.push(px.g);
			data.b.push(px.b);
		});

		return new ImageProcessing.Color(
			Math.max.apply(null, data.r),
			Math.max.apply(null, data.g),
			Math.max.apply(null, data.b)
		);
	},

	min: function(){
		var data = {r: [], g: [], b: []};

		this.each(function(px){
			data.r.push(px.r);
			data.g.push(px.g);
			data.b.push(px.b);
		});

		return new ImageProcessing.Color(
			Math.min.apply(null, data.r),
			Math.min.apply(null, data.g),
			Math.min.apply(null, data.b)
		);
	},

	autoContrast: function(){
		var extremum = this.extremum();
		var min = extremum[0];
		var max = extremum[1];

		if(max.toString() == (ImageProcessing.Color.white()).toString() &&
		   min.toString() == (ImageProcessing.Color.black()).toString())
			return this;

		var _f = function(max, min){
			if(max >= 255 && min <= 0)
				return function(x){ return x; };

			var a = 255 / (max - min);
			var b = - a * min;

			return function(x){ return a * x + b; };
		};

		var f = {
			r: _f(max.r, min.r),
			g: _f(max.g, min.g),
			b: _f(max.b, min.b)
		};

		this.setEach(function(px, x, y, self){
			return new ImageProcessing.Color(f.r(px.r), f.g(px.g), f.b(px.b));
		});

		return this;
	},

	filter: function(flt, offset, fn){
		if(offset instanceof Function){
			fn = offset;
			offset = 0;
		}
		else if(!offset) offset = 0;

		var ip = new ImageProcessing(this.canvas.cloneNode(false)).lock(); // drawed canvas
		var n  = flt.length / 2 >> 0 - 1;
		var w  = this.canvas.width - n;
		var h  = this.canvas.height - n;
		var fl = flt.length;
		var x, y,
		    fx, fy, fv,
		    px, tpx;

		for(x = -1; ++x < w;) for(y = -1; ++y < h;){
			tpx = new ImageProcessing.Color(offset, offset, offset);

			// filtering
			for(fy = -1; flt[++fy];) for(fx = -1; ++fx < fl;) if(fv = flt[fy][fx]){
				px = this.getPixel(x + fx - n, y + fy - n);
				tpx.r += px.r * fv;
				tpx.g += px.g * fv;
				tpx.b += px.b * fv;
			}

			ip.setPixel(x, y, (fn && fn.call(this, tpx)) || tpx);
		};

		if(this.support.pixel){
			this.putImageData(ip.getImageData());
			if(this.locked) this.lock();
		}
		else{
			this.setEach(function(px, x, y){
				return ip.getPixel(x, y);
			});
		}

		return this;
	},

	filter2: function(fltw, flth, offset){
		if(!offset) offset = 0;

		var supportPx = this.support.pixel;
		var ip = new ImageProcessing(this.canvas.cloneNode(false));
		var n  = parseInt(fltw.length / 2);
		var w  = this.canvas.width - n;
		var h  = this.canvas.height - n;
		var fl = fltw.length;

		for(var x = n; x < w; x++) for(var y = n; y < h; y++){
			var cw = new ImageProcessing.Color(offset, offset, offset);
			var ch = new ImageProcessing.Color(offset, offset, offset);

			// filtering
			for(var fx = 0; fx < fl; fx++) for(var fy = 0; fy < fl; fy++){
				var px = this.getPixel(x + fx - n, y + fy - n);
				var fvw = fltw[fy][fx];
				var fvh = flth[fy][fx];
				cw.r += px.r * fvw;
				cw.g += px.g * fvw;
				cw.b += px.b * fvw;
				ch.r += px.r * fvh;
				ch.g += px.g * fvh;
				ch.b += px.b * fvh;
			}

			var c = new ImageProcessing.Color(Math.sqrt(cw.r * ch.r),
			                                  Math.sqrt(cw.g * ch.g),
			                                  Math.sqrt(cw.b * ch.b));
			ip.setPixel(x, y, c);
		}

		this.tmp.imageData = ip.getImageData(0, 0, this.canvas.width, this.canvas.height);
		this.support.pixel = false;
		this.update();
		this.support.pixel = supportPx;

		return this;
	},

	medianFilter: function(){
		var self = this;

		var median = function(x, y){
			var coords = [
				[x-1, y-1], [x, y-1], [x+1, y-1],
				[x-1, y  ],           [x+1, y  ],
				[x-1, y+1], [x, y+1], [x+1, y+1]
			];

			coords.forEach(function(c, i){
				c.toString = function(){
					return self.getPixel(c[0], c[1]).average();
				};
			});

			coords.sort();

			return self.getPixel(coords[4][0], coords[4][1]);
		};

		var supportPx = this.support.pixel;
		var ip = new ImageProcessing(this.canvas.cloneNode(false));
		var w  = this.canvas.width - 1;
		var h  = this.canvas.height - 1;

		for(var x = 1; x < w; x++) for(var y = 1; y < h; y++){
			ip.setPixel(x, y, median(x, y));
		}

		this.tmp.imageData = this.getImageData(0, 0, this.canvas.width, this.canvas.height);
		this.support.pixel = false;
		this.update();
		this.support.pixel = supportPx;

		return this;
	},

	/**
	 * @param {Number}           sizeW
	 * @param {Number|Function}  sizeH
	 * @param {Function}         fn
	 */
	mosaic: function(sizeW, sizeH, fn){
		if(sizeH instanceof Function){
			fn    = sizeH;
			sizeH = sizeW;
		}
		else if(!sizeH) sizeH = sizeW;

		var w = this.canvas.width,
		    h = this.canvas.height;
		var sw, sh, px;

		if(fn) for(var x = 0; x < w; x += sizeW){
			sw = (x + sizeW >= this.canvas.width) ? this.canvas.width  - 1 - x : sizeW;

			for(var y = 0; y < h; y += sizeH){
				sh = (y + sizeH >= this.canvas.height)? this.canvas.height - 1 - y : sizeH;

				this.context.fillStyle = fn.call(this, this.average(x, y, sw, sh), x, y).toString();
				this.context.fillRect(x, y, sizeW, sizeH);
			}
		}
		else for(var x = 0; x < w; x += sizeW){
			sw = (x + sizeW >= this.canvas.width) ? this.canvas.width  - 1 - x : sizeW;

			for(var y = 0; y < h; y += sizeH){
				sh = (y + sizeH >= this.canvas.height)? this.canvas.height - 1 - y : sizeH;

				this.context.fillStyle = this.average(x, y, sw, sh).toString();
				this.context.fillRect(x, y, sizeW, sizeH);
			}
		}

		if(this.locked) this.lock();

		return this;
	},

	grayScale: function(){
		return this.setEach(function(px){ return px.ntsc(); });
	},

	threshold: function(v){
		return this.setEach(function(px){
			var c = (px.average() <  v)? 0 : 255;
			return ImageProcessing.Color.fromRgb(c, c, c);
		});
	},

	dither: function(pattern, fn){
		var black = ImageProcessing.Color.black();
		var white = ImageProcessing.Color.white();
		var l = pattern.length;
		var n = 256 / (l * l);

		if(fn){
			return this.setEach(function(px, x, y){
				var b = px.average() <= pattern[x % l][y % l] * n + l * l / 2;
				return fn.call(this, b) || (b? black : white);
			});
		}

		return this.setEach(function(px, x, y){
			var b = px.average() <= pattern[x % l][y % l] * n + l * l / 2;
			return b? black : white;
		});
	},

	dither8: function(pattern){
		var l = pattern.length;
		var n = 256 / (l * l);

		return this.setEach(function(px, x, y){
			return px.map(function(v){
				return (v > pattern[x % l][y % l] * n + l * l / 2)? 255 : 0;
			});
		});
	},

	errorDiffuse: function(flt, fn){
		var self = this;

		// init
		var w = this.canvas.width;
		var h = this.canvas.height;
		var fw = flt[0].length;
		var fh = flt.length;

		// sum flt values
		var sum = 0,
		    i, j;

		for(i = -1; ++i < fh;) for(j = -1; ++j < fw;)
			sum += flt[i][j];

		// temporary colors
		var tmp = [];
		var x, y;

		for(y = -1; ++y < h;) for(x = -1; ++x < w;)
			(tmp[y] || (tmp[y] = []))[x] = 0;

		// filtering
		var cur = fw / 2 >> 0; // current pixel (X) of flt

		this.each(function(px, x, y){
			var e;
			var f = tmp[y][x] + px.grayScale().r;

			if(f > 127){
				tmp[y][x] = 255;
				e = f - 255;
			}
			else{
				tmp[y][x] = 0;
				e = f;
			}

			var _x, _y,
			    fx, fy,
			    v;

			for(fy = -1; ++fy < fh;){
				_y = y + fy;

				if(_y < h) for(fx = -1; ++fx < fw;){
					v  = flt[fy][fx];
					_x = x + fx - cur;

					if(0 <= _x && _x < w && v)
						tmp[_y][_x] += e * v / sum;
				}
			}
		});

		var white = new ImageProcessing.Color.white();
		var black = new ImageProcessing.Color.black();

		if(fn) for(y = -1; ++y < h;) for(x = -1; ++x < w;)
			this.setPixel(x, y, fn.call(this, tmp[y][x] < 128));
		else for(y = -1; ++y < h;) for(x = -1; ++x < w;)
			this.setPixel(x, y, (tmp[y][x] < 128)? black : white);

		return this;
	},

	/**
	 * @param  {ImageProcessing}              process  background image
	 * @param  {ImageProcessing.Color}        aColor   alpha color
	 * @param  {ImageProcessing.Color|Number} rColor   range color
	 * @return
	 */
	blueScreen: function(process, aColor, rColor){
		if(!aColor)
			aColor = ImageProcessing.Color.fromHex(0x0000ff);

		if(rColor instanceof Number)
			rColor = ImageProcessing.Color.fromRgb(rColor, rColor, rColor);
		else if(!rColor)
			rColor = ImageProcessing.Color.fromRgb(0, 0, 0);

		var w = (this.canvas.width  < process.canvas.width)? this.canvas.width 
		                                                   : process.canvas.width;
		var h = (this.canvas.height < process.canvas.height)? this.canvas.height
		                                                    : process.canvas.height;

		var black = ImageProcessing.Color.black();
		var white = ImageProcessing.Color.white();
		var ip = (new ImageProcessing(this.canvas)).lock(); // alpha

		// threshold
		this.each(function(px, x, y){
			if(px.toString() == aColor.toString())
				ip.setPixel(x, y, white);
			else{
				var b = (aColor.r - rColor.r < px.r && px.r < aColor.r + rColor.r)
				     && (aColor.g - rColor.g < px.g && px.g < aColor.g + rColor.g)
				     && (aColor.b - rColor.b < px.b && px.b < aColor.b + rColor.b);

				ip.setPixel(x, y, b? white : black);
			}
		}).filter([
			[0.15, 0.15, 0.15],
			[0.15, 0,    0.15],
			[0.15, 0.15, 0.15],
		]);

		// blend
		for(var x = 0; x < w; x++) for(var y = 0; y < h; y++){
			var cOrigin = this.getPixel(x, y);
			var cBlend  = process.getPixel(x, y);

			if(cOrigin.toString() == aColor.toString()){
				this.setPixel(x, y, cBlend);
			}
			else{
				var alpha = ip.getPixel(x, y).g / 255;

				cOrigin.each(function(v, p){
					cOrigin[p] = (1 - alpha) * cOrigin[p] + alpha * cBlend[p];
				});

				this.setPixel(x, y, cOrigin);
			}
		}

		return this;
	},

	/**
	 * alias blueScreen
	 */
	blueBack: function(){
		return this.blueScreen.apply(this, arguments);
	},

	/**
	 * @param  process  ImageProcessing        background image
	 * @param  aColor   ImageProcessing.Color  alpha color
	 * @param  soft     Boolean                use soft key
	 * @return
	 */
	chromaKey: function(process, aColor, soft){
		if(!aColor) aColor = ImageProcessing.Color.fromHex(0x0000ff);
		if(typeof soft == "undefined") soft = true;

		var w = (this.canvas.width  < process.canvas.width)? this.canvas.width 
		                                                   : process.canvas.width;
		var h = (this.canvas.height < process.canvas.height)? this.canvas.height
		                                                    : process.canvas.height;

		var black = ImageProcessing.Color.black();
		var white = ImageProcessing.Color.white();
		var ip = (new ImageProcessing(this.canvas)).lock();

		// blend
		for(var x = 0; x < w; x++) for(var y = 0; y < h; y++){
			var cOrigin = this.getPixel(x, y);
			var cBlend  = process.getPixel(x, y);

			if(cOrigin.toString() == aColor.toString()){
				this.setPixel(x, y, cBlend);
			}
			else if(soft){
				var alpha = 8 * ImageProcessing.Color.fromHex(0).map(function(v, x){
					return Math.abs(cOrigin[x] - aColor[x]);
				}).geomean() / 255;

				alpha = (alpha > 1)? 1
				      : (alpha < 0)? 0
				      : alpha;

				this.setPixel(x, y, cOrigin.map(function(v, p){
					return alpha * cOrigin[p] + (1 - alpha) * cBlend[p];
				}));
			}
		}

		return this;
	},

	/**
	 * @param  process  ImageProcessing object
	 * @param  alpha    Number (0 - 1)
	 * @param  lx       left x
	 * @param  ty       top y
	 * @return
	 */
	blend: function(process, alpha, lx, ty){
		if(!alpha) alpha = 0.5;
		if(!lx)    lx    = 0;
		if(!ty)    ty    = 0;

		var lw = lx + process.canvas.width;
		var th = ty + process.canvas.height;
		var w = (this.canvas.width  < lw)? this.canvas.width  : lw;
		var h = (this.canvas.height < th)? this.canvas.height : th;

		for(var x = lx - 1; ++x < w;) for(var y = ty - 1; ++y < h;){
			var cBlend = process.getPixel(x - lx, y - ty);

			this.setPixel(x, y, this.getPixel(x, y).map(function(v, p, self){
				return v * (1 - alpha) + cBlend[p] * alpha;
			}));
		}

		return this;
	}
};

/**
 * initialize pixelControl functions by this.support
 * this.support.pixel == true : use setPixel/putPixel
 * this.support.pixel == false: use ImageData functions
 */
ImageProcessing.prototype.initPixelControl = function(){
	var callee = arguments.callee;

	var setControl = function(o){
		for(var x in o)
			ImageProcessing.prototype[x] = o[x];
	};

	if(!this.support.pixel)
		setControl(callee.imageData);
	else
		setControl(callee.pixel);

	return this;
};

ImageProcessing.prototype.initPixelControl.imageData = {
	getPixel: function(x, y){
		if(this.locked){
			var data = this.tmp.imageData.data;
			var n = x * 4 + y * this.canvas.width * 4;
			return new ImageProcessing.Color(data[n++], data[n++], data[n++], data[n] / 255);
		}

		var px = this.getImageData(x, y, 1, 1).data;

		return new ImageProcessing.Color(px[0], px[1], px[2], px[3] / 255);
	},

	setPixel: function(x, y, pixel){
		//pixel = pixel.round();

		if(this.locked){
			var n = x * 4 + y * this.canvas.width * 4;
			var data = this.tmp.imageData.data;
			data[n++] = pixel.r;
			data[n++] = pixel.g;
			data[n++] = pixel.b;
			data[n  ] = pixel.a * 255;

			return this;
		}

		this.tmp.imageData1.data = [pixel.r, pixel.g, pixel.b, pixel.a * 255];
		this.putImageData(this.tmp.imageData1, x, y);

		return this;
	}
};

ImageProcessing.prototype.initPixelControl.pixel = {
	getPixel: function(x, y){
		return ImageProcessing.Color.fromHexString(this.gContext.getPixel(x, y));
},

	setPixel: function(x, y, pixel){
		this.gContext.setPixel(x, y, pixel.toString());
		return this;
	}
};

// constants
ImageProcessing.dither = {
	bayer: [
		[ 0,  8,  2, 10],
		[12,  4, 14,  6],
		[ 3, 11,  1,  9],
		[15,  7, 13,  5]
	],

	bayer8: [
		[ 0, 32,  8, 40,  2, 34, 10, 42],
		[48, 16, 56, 24, 50, 18, 58, 26],
		[12, 44,  4, 36, 14, 46,  6, 38],
		[60, 28, 52, 20, 62, 30, 54, 22],
		[ 3, 35, 11, 43,  1, 33,  9, 41],
		[51, 19, 59, 27, 49, 17, 57, 25],
		[15, 47,  7, 39, 13, 45,  5, 37],
		[63, 31, 55, 23, 61, 29, 53, 21]
	],

	screw: [
		[ 0,  8,  2, 10],
		[12,  4, 14,  6],
		[ 3, 11,  1,  9],
		[15,  7, 13,  5]
	],

	dotConcentrate: [
		[12, 4, 8, 14],
		[10, 0, 1,  7],
		[ 6, 3, 2, 11],
		[15, 9, 5, 13]
	]
};

ImageProcessing.filter = {
	sharp: [
		[ 0, -1,  0],
		[-1,  5, -1],
		[ 0, -1,  0]
	],

	blur: [
		[0.08, 0.12, 0.08],
		[0.12, 0.2 , 0.12],
		[0.08, 0.12, 0.08]
	],

	emboss: [
		[1, 0,  0],
		[0, 0,  0],
		[0, 0, -1]
	],

	outline: [
		[1,  1, 1],
		[1, -8, 1],
		[1,  1, 1]
	]
};

ImageProcessing.filter2 = {
	prewitt: [
		[[-1,  0,  1],
		 [-1,  0,  1],
		 [-1,  0,  1]],
		[[-1, -1, -1],
		 [ 0,  0,  0],
		 [ 1,  1,  1]]
	],

	sobel: [
		[[-1,  0,  1],
		 [-2,  0,  2],
		 [-1,  0,  1]],
		[[-1, -2, -1],
		 [ 0,  0,  0],
		 [ 1,  2,  1]]
	]
};

ImageProcessing.errorDiffuse = {
	floydSteinberg: [
		[0, 0, 7],
		[3, 5, 1]
	],

	jarvisJudiceNinke: [
		[0, 0, 0, 7, 5],
		[3, 5, 7, 5, 3],
		[1, 3, 5, 3, 1]
	],

	stucki: [
		[0, 0, 0, 8, 4],
		[2, 4, 8, 4, 2],
		[1, 2, 4, 2, 1]
	],

	burkes: [
		[0, 0, 0, 8, 4],
		[2, 4, 8, 4, 2]
	],

	sierra: [
		[0, 0, 0, 5, 3],
		[2, 4, 5, 4, 2],
		[0, 2, 3, 2, 0]
	],

	sierra2: [
		[0, 0, 0, 4, 3],
		[1, 2, 3, 2, 1]
	],

	filterLite: [
		[0, 0, 2],
		[1, 1, 0]
	],

	atkinson: [
		[ 0, 0, 1, 1],
		[ 1, 1, 1, 0],
		[ 0, 1, 0, 0]
	]
};
