if(window.Image)
	var Image = window.Image;

(function(){
/**
 * @param  r  0 - 255
 * @param  g  0 - 255
 * @param  b  0 - 255
 * @return Color
 */
var Color = function(r, g, b, a){
	if(!a || a !== 0) a = 1;

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
		var v = this.r * 0.299 + this.g * 0.587 + this.b * 0.114;
		return new Color(v, v, v);
	},

	hdtv: function(x){
		if(!x) x = 1;

		var r = Math.pow(this.r, x) * 0.222015;
		var g = Math.pow(this.g, x) * 0.706655;
		var b = Math.pow(this.b, x) * 0.071330;
		var y = Math.pow(r + g + b, 1 / x);

		return new Color(y, y, y);
	},

	invert: function(){
		return new Color(255 - this.r, 255 - this.g, 255 - this.b);
	},

	/**
	 * @param  v  lightness value
	 * @return
	 */
	sepia: function(v){
		if(!v) v = 1;
		return new Color(this.r * 0.957 * v, this.g * 0.784 * v, this.b * 0.567 * v);
	},

	/**
	 * @return Array [h, s, v]
	 */
	hsv: function(){
		return [this.hue(), this.saturation(), this.brightness()];
	},

	/**
	 * @return 0 - 359
	 */
	hue: function(){
		var max = this.max();
		if(max === 0) return 0;
		var min = this.min();
		if(max == min) return 0;
		var ra = max - min;

		switch(max){
			case this.r: return 60 * (this.g - this.b) / ra;
			case this.g: return 60 * (this.b - this.r) / ra + 120;
			case this.b: return 60 * (this.r - this.g) / ra + 240;
		}
	},

	/**
	 * @return 0 - 255
	 */
	saturation: function(){
		var max = this.max();
		if(max == 0) return 0;
		var min = this.min();
		return 255 * (max - min) / max;
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
 * @param  s  "rgb(r,g,b)"
 * @return
 */
Color.fromRgbString = function(s){
	var r = /\d{1,3}/g;
	return new Color(r.exec(s), r.exec(s), r.exec(s));
};

/**
 * @param  s  "rgba(r,g,b,a)"
 * @return
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
 * @param  s  "#rrggbb"
 * @return
 */
Color.fromHexString = function(s){
	var color = parseInt(s.substr(1), 16);
	return new Color(color >> 16, color >> 8 & 255, color & 255);
};

/**
 * @param  h   0xrrggbb
 * @return
 */
Color.fromHex = function(h){
	return new Color(h >> 16, h >> 8 & 255, h & 255);
};

/**
 * @param  c   0 - 255
 * @param  m   0 - 255
 * @param  y   0 - 255
 * @return
 */
Color.fromCmy = function(c, m, y){
	return new Color(255 - c, 255 - m, 255 - y);
};

/**
 * @param  h   0 - 359
 * @param  s   0 - 255
 * @param  v   0 - 255
 * @return
 */
Color.fromHsv = function(h, s, v){
	if(s === 0)
		return new Color(v, v, v);

	var hi = ((h / 60) >> 0) % 6;
	if(hi < 0) hi *= -1;

	var f  = h / 60 - hi;
	var t1 = Math.round(v * (255 - s));
	var t2 = Math.round(v * (255 - f * s));
	var t3 = Math.round(v * (255 - (1 - f) * s));

	switch(hi){
		case 0 : return Color.fromRgb( v, t3, t1);
		case 1 : return Color.fromRgb(t2,  v, t1);
		case 2 : return Color.fromRgb(t1,  v, t3);
		case 3 : return Color.fromRgb(t1, t2,  v);
		case 4 : return Color.fromRgb(t3, t1,  v);
		default: return Color.fromRgb( v, t1, t2);
	}
};

/**
 * @param  y   0 - 255
 * @param  c   0 - 255
 * @param  c   0 - 255
 * @return
 */
Color.fromYcc = function(y, c1, c2){
	var g = function(y, c1, c2){
		return (0.557 * y - 0.299 * c1 - 0.144 * c2) / 0.587;
	};

	return new Color(y + c2, g(y, c1, c2), y + c1);
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
ImageProcessing.prototype.Color = function(r, g, b){
	return new Color(r, g, b);
};
})();


function ImageProcessing(element){
	this.init(element);
}

/**
 * create object by image source
 * @param  src    String   source
 * @param  onload Function onload callback
 * @return
 */
ImageProcessing.load = function(src, onload){
	var canvas = document.createElement("canvas");
	var ip     = new ImageProcessing(canvas);
	var img    = new Image();
	var drawed = false;

	img.onload = function(e){
		if(!drawed){
			canvas.width  = img.naturalWidth;
			canvas.height = img.naturalHeight;
			ip.context.drawImage(img, 0, 0, canvas.width, canvas.height);
			drawed = true;
		}

		if(onload) onload(ip, e);
	};

	img.src = src;

	try{
		canvas.width  = img.naturalWidth;
		canvas.height = img.naturalHeight;
		ip.context.drawImage(img, 0, 0, canvas.width, canvas.height);
		drawed = true;
	}
	catch(e){}

	return ip;
};

ImageProcessing.prototype = {
	locked: false,

	origin: {
		process: null,
		x: null,
		y: null
	},

	tmp: {
		// All
		imageData: null,
		// 1 * 1
		imageData1: {
			width : 1,
			height: 1,
			data  : [0, 0, 0, 255]
		}
	},

	/**
	 * constructor
	 */
	init: function(element){
		if(!element)
			element = document.createElement("canvas");

		this.canvas  = element;
		this.context = this.canvas.getContext("2d");

		// init properties
		this.origin = {
			process: null,
			x: null,
			y: null
		};

		this.tmp = {
			imageData : null,
			imageData1: {
				width : 1,
				height: 1,
				data  : [0, 0, 0, 255]
			}
		};

		// set browser support
		if(!ImageProcessing.support){
			this.support = {
				pixel    : false,
				imageData: !!this.context.getImageData
			};

			try{
				this.gContext = this.canvas.getContext("opera-2dgame");
				this.support.pixel = !!this.gContext;
			}
			catch(e){}

			ImageProcessing.support = this.support;
		}
		else
			this.support = ImageProcessing.support;

		// use imageData object
		this.initPixelControl();

		return this;
	},

	/**
	 * load by image source
	 * @param  src  String  image file
	 * @param  x    Number  position by left
	 * @param  y    Number  position by top
	 * @param  w    Number  image width
	 * @param  h    Number  image height
	  * @return
	 */
	load: function(src, x, y, w, h){
		if(!x) x = 0;
		if(!y) y = 0;

		var img = new Image();
		img.src = src;

		if(!w) w = img.width;
		if(!h) h = img.height;

		this.context.drawImage(img, x, y, w, h);

		return this;
	},

	/**
	 * clone ImageProcessing object
	 */
	clone: function(){
		return ImageProcessing.load(this.data());
	},

	appendTo: function(element){
		element.appendChild(this.canvas);
		return this;
	},

	clear: function(){
		var w = this.canvas.width;
		this.canvas.width = 0;
		this.canvas.width = w;

		if(this.locked)
			this.lock();

		return this;
	},

	/**
	 * get data url
	 */
	data: function(){
		return this.canvas.toDataURL();
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

	each: function(f){
		for(var y = -1, h = this.canvas.height; ++y < h;)
			for(var x = -1, w = this.canvas.width; ++x < w;)
				f(this.getPixel(x, y), x, y, this);
		return this;
	},

	blendEach: function(f){
		for(var y = -1, h = this.canvas.height; ++y < h;)
			for(var x = -1, w = this.canvas.width; ++x < w;)
				f(this.blendPixel(x, y), x, y, this);
		return this;
	},

	setEach: function(f){
		for(var y = -1, h = this.canvas.height; ++y < h;)
			for(var x = -1, w = this.canvas.width; ++x < w;)
				this.setPixel(x, y, f(this.getPixel(x, y), x, y, this));
		return this;
	},

	map: function(f){
		var a = [];

		for(var y = -1, h = this.canvas.height; ++y < h;)
			for(var x = -1, w = this.canvas.width; ++x < w;)
				a.push(f(this.getPixel(x, y), x, y, this));

		return a;
	},

	getImageData: function(from_x, from_y, width, height){
		if(!from_x) from_x = 0;
		if(!from_y) from_y = 0;
		if(!width)  width  = this.canvas.width;
		if(!height) height = this.canvas.height;

		var imageData = this.context.getImageData(from_x, from_y, width, height);

		return imageData;
	},

	putImageData: function(imageData, x, y){
		if(!x) x = 0;
		if(!y) y = 0;

		this.context.putImageData(imageData, x, y);

		return this;
	},

	clip: function(x, y, width, height){
		var canvas    = document.createElement("canvas");
		var ip        = new ImageProcessing(canvas);
		var imageData = this.getImageData(x, y, width, height);

		canvas.width  = imageData.width;
		canvas.height = imageData.height;

		ip.origin.process = this;
		ip.origin.x = x;
		ip.origin.y = y;

		ip.putImageData(imageData, 0, 0);

		return ip;
	},

	merge: function(process, x, y){
		if(typeof x == "undefined") x = process.origin.x;
		if(typeof y == "undefined") y = process.origin.y;

		var imageData = process.getImageData(0, 0, process.canvas.width, process.canvas.height);
		this.putImageData(imageData, x, y);

		return this;
	},

	trim: function(isLeftTop){
		if(typeof isLeftTop == "undefined")
			isLeftTop = true;

		var rect = [0, 0, this.canvas.width, this.canvas.height];

		var color = isLeftTop
			? this.getPixel(0, 0).toString()
			: this.getPixel(this.canvas.width - 1, this.canvas.height - 1).toString();

		loop:
		for(var x = 0; x < this.canvas.width; x++){
			for(var y = 0; y < this.canvas.height; y++)
				if(color != this.getPixel(x, y).toString())
					break loop;
			rect[0]++;
		}

		loop:
		for(y = 0; y < this.canvas.height; y++){
			for(x = 0; x < this.canvas.width; x++)
				if(color != this.getPixel(x, y).toString())
					break loop;
			rect[1]++;
		}

		loop:
		for(x = this.canvas.width - 1; x >= 0; x--){
			for(y = this.canvas.height - 1; y >= 0; y--)
				if(color != this.getPixel(x, y).toString())
					break loop;
			rect[2]--;
		}

		loop:
		for(y = this.canvas.height - 1; y >= 0; y--){
			for(x = this.canvas.width - 1; x >= 0; x--)
				if(color != this.getPixel(x, y).toString())
					break loop;
			rect[3]--;
		}

		var clip = this.clip(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
		this.canvas.width  = clip.canvas.width;
		this.canvas.height = clip.canvas.height;

		this.lock();
		this.tmp.imageData = clip.getImageData();
		this.update();

		if(!this.locked)
			this.unlock();

		return this;
	},

	average: function(from_x, from_y, width, height){
		if(!from_x) from_x = 0;
		if(!from_y) from_y = 0;
		if(!width)  width  = this.canvas.width;
		if(!height) height = this.canvas.height;

		var pixel_n = width * height;
		var color = new ImageProcessing.Color(0, 0, 0);
		var _color;

		for(var x = from_x - 1, w = from_x + width; ++x < w;){
			for(var y = from_y - 1, h = from_y + height; ++y < h;){
				_color = this.getPixel(x, y);
				color.r += _color.r;
				color.g += _color.g;
				color.b += _color.b;
			}
		}

		color.each(function(v, x){
			color[x] = parseInt(v / pixel_n);
		});

		return color;
	},

	histogram: function(){
		var data = {r: [], g: [], b: []};

		for(var i = 0; i <= 255; i++)
			data.r.push(0);

		data.g = Array.apply(null, data.r);
		data.b = Array.apply(null, data.r);

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
			new ImageProcessing.Color(Math.min.apply(null, data.r), Math.min.apply(null, data.g), Math.min.apply(null, data.b)),
			new ImageProcessing.Color(Math.max.apply(null, data.r), Math.max.apply(null, data.g), Math.max.apply(null, data.b))
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
		var _f = function(max, min){
			if(max >= 255 && min <= 0)
				return function(x){ return x; };

			var a = 255 / (max - min);
			var b = - a * min;

			return function(x){
				return a * x + b;
			};
		};

		var extremum = this.extremum();
		var min = extremum[0];
		var max = extremum[1];

		if(max.toString() == (ImageProcessing.Color.white()).toString() &&
		   min.toString() == (ImageProcessing.Color.black()).toString())
			return this;

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

	filter: function(flt, offset){
		if(!offset) offset = 0;

		var supportPx = this.support.pixel;
		var ip = new ImageProcessing(this.canvas.cloneNode(false));
		var n  = parseInt(flt.length / 2);
		var w  = this.canvas.width - n;
		var h  = this.canvas.height - n;
		var fl = flt.length;
		var x, y,
		    fx, fy, fv,
		    px;

		for(x = n-1; ++x < w;){
			for(y = n-1; ++y < h;){
				var c = new ImageProcessing.Color(offset, offset, offset);

				// filtering
				fy = -1;
				while(flt[++fy]){
					fx = -1;
					while(fv = flt[fy][++fx]){
						px = this.getPixel(x + fx - n, y + fy - n);
						c.r += px.r * fv;
						c.g += px.g * fv;
						c.b += px.b * fv;
					}
				}

				ip.setPixel(x, y, c);
			}
		}

		this.tmp.imageData = ip.getImageData(0, 0, this.canvas.width, this.canvas.height);
		this.support.pixel = false;
		this.update();
		this.support.pixel = supportPx;

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

		for(var x = n; x < w; x++){
			for(var y = n; y < h; y++){
				var cw = new ImageProcessing.Color(offset, offset, offset);
				var ch = new ImageProcessing.Color(offset, offset, offset);

				// filtering
				for(var fx = 0; fx < fl; fx++){
					for(var fy = 0; fy < fl; fy++){
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
				}

				var c = new ImageProcessing.Color(Math.sqrt(cw.r * ch.r), Math.sqrt(cw.g * ch.g), Math.sqrt(cw.b * ch.b));
				ip.setPixel(x, y, c);
			}
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

		for(var x = 1; x < w; x++){
			for(var y = 1; y < h; y++){
				ip.setPixel(x, y, median(x, y));
			}
		}

		this.tmp.imageData = this.getImageData(0, 0, this.canvas.width, this.canvas.height);
		this.support.pixel = false;
		this.update();
		this.support.pixel = supportPx;

		return this;

		for(var x = 1, w = this.canvas.width - 1; x < w; x++){
			for(var y = 1, h = this.canvas.height - 1; y < h; y++){
				this.setPixel(x, y, median(x, y));
			}
		}

		return this;
	},

	mosaic: function(size_w, size_h){
		if(!size_h) size_h = size_w;

		var sw, sh;

		for(var x = 0, w = this.canvas.width; x < w; x += size_w){
			sw = (x + size_w >= this.canvas.width) ? this.canvas.width  - 1 - x : size_w;

			for(var y = 0, h = this.canvas.height; y < h; y += size_h){
				sh = (y + size_h >= this.canvas.height)? this.canvas.height - 1 - y : size_h;

				this.context.fillStyle = this.average(x, y, sw, sh).toString();
				this.context.fillRect(x, y, size_w, size_h);
			}
		}

		if(this.locked)
			this.lock();

		return this;
	},

	grayScale: function(){
		this.setEach(function(px, x, y, self){
			return px.ntsc();
		});

		return this;
	},

	threshold: function(v){
		return this.setEach(function(px, x, y){
			var p = px.average();
			var c = (p <  v)? 0 : 255;
			return ImageProcessing.Color.fromRgb(c, c, c);
		});
	},

	dither: function(pattern){
		var black = ImageProcessing.Color.black();
		var white = ImageProcessing.Color.white();
		var l = pattern.length;
		var n = 256 / (l * l);

		this.setEach(function(px, x, y){
			return (px.grayScale().r > pattern[x % l][y % l] * n + l * l / 2) ? white : black;
		});

		return this;
	},

	dither8: function(pattern){
		var l = pattern.length;
		var n = 256 / (l * l);

		this.setEach(function(px, x, y){
			return px.map(function(v, p, self){
				return (v > pattern[x % l][y % l] * n + l * l / 2)? 255 : 0;
			});

			return px;
		});

		return this;
	},

	errorDiffuse: function(flt){
		var self = this;

		// init
		var w = this.canvas.width;
		var h = this.canvas.height;
		var sum = 0;                    // total of flt values
		var tmp = [];                   // temporary colors
		var fw  = flt[0].length;        // filter width
		var cur = parseInt(fw / 2, 10); // current pixel (X) of flt

		// init sum
		flt.forEach(function(_){
			_.forEach(function(n){
				sum += n;
			});
		});

		// init tmp
		for(var y = -1; ++y < h;){
			tmp[y] = [];
			for(var x = -1; ++x < w;){
				tmp[y][x] = 0;
			}
		}

		// filtering
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

			flt.forEach(function(_, ny){
				var _y = y + ny;
				if(_y >= h) return;

				_.forEach(function(v, nx){
					var _x = x + nx - cur;

					if(0 > _x || _x >= w || !flt[ny][nx]) return;
					tmp[_y][_x] += e * v / sum;

				});
			});
		});

		tmp.forEach(function(_, y){
			_.forEach(function(v, x){
				v = (v > 127)? 255 : 0;
				self.setPixel(x, y, new ImageProcessing.Color(v, v, v));
			});
		});

		return this;
	},

	/**
	 * @param  process  ImageProcessing        background image
	 * @param  aColor   ImageProcessing.Color  alpha color
	 * @param  rColor   ImageProcessing.Color  range color
	 * @return
	 */
	blueScreen: function(process, aColor, rColor){
		if(!aColor) aColor = ImageProcessing.Color.fromHex(0x0000ff);

		if(rColor instanceof Number) rColor = ImageProcessing.Color.fromRgb(rColor, rColor, rColor);
		if(rColor instanceof Array)  rColor = ImageProcessing.Color.fromRgb,apply(null, rColor);
		if(!rColor) rColor = ImageProcessing.Color.fromRgb(0, 0, 0);

		var w = (this.canvas.width  < process.canvas.width) ? this.canvas.width  : process.canvas.width;
		var h = (this.canvas.height < process.canvas.height)? this.canvas.height : process.canvas.height;

		var black = ImageProcessing.Color.black();
		var white = ImageProcessing.Color.white();
		var ip = (new ImageProcessing(this.canvas)).lock();

		// threshold
		this.each(function(px, x, y){
			if(px.toString() == aColor.toString())
				ip.setPixel(x, y, white);
			else{
				var b = /false/.test(px.map(function(v, x){
					return aColor[x] - rColor[x] < px[x] && px[x] < aColor[x] + rColor[x];
				}));
				if(!b)
					ip.setPixel(x, y, white);
				else
					ip.setPixel(x, y, black);
			}
		});

		// blur
		ip.filter([
			[0.15, 0.15, 0.15],
			[0.15, 0,    0.15],
			[0.15, 0.15, 0.15],
		]);

		// blend
		for(var x = 0; x < w; x++){
			for(var y = 0; y < h; y++){
				var cOrigin = this.getPixel(x, y);
				var cBlend  = process.getPixel(x, y);

				if(cOrigin.toString() == aColor.toString()){
					this.setPixel(x, y, cBlend);
				}
				else{
					var alpha = ip.getPixel(x, y).average() / 255;

					cOrigin.each(function(v, p){
						cOrigin[p] = (1 - alpha) * cOrigin[p] + alpha * cBlend[p];
					});

					this.setPixel(x, y, cOrigin);
				}
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

		var w = (this.canvas.width  < process.canvas.width) ? this.canvas.width  : process.canvas.width;
		var h = (this.canvas.height < process.canvas.height)? this.canvas.height : process.canvas.height;

		var black = ImageProcessing.Color.black();
		var white = ImageProcessing.Color.white();
		var ip = (new ImageProcessing(this.canvas)).lock();

		// blend
		for(var x = 0; x < w; x++){
			for(var y = 0; y < h; y++){
				var cOrigin = this.getPixel(x, y);
				var cBlend  = process.getPixel(x, y);

				if(cOrigin.toString() == aColor.toString()){
					this.setPixel(x, y, cBlend);
				}
				else if(soft){
					var alpha = 8 * (ImageProcessing.Color.fromHex(0)).each(function(v, x, self){
						self[x] = Math.abs(cOrigin[x] - aColor[x]);
					}).geomean() / 255;

					alpha = (alpha > 1) ? 1 : (alpha < 0)? 0 : alpha;

					cOrigin.each(function(v, p){
						cOrigin[p] = alpha * cOrigin[p] + (1 - alpha) * cBlend[p];
					});

					this.setPixel(x, y, cOrigin);
				}
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

		for(var x = lx - 1; ++x < w;){
			for(var y = ty - 1; ++y < h;){
				var cBlend = process.getPixel(x - lx, y - ty);

				var px = this.getPixel(x, y).each(function(v, p, self){
					self[p] = self[p] * (1 - alpha) + cBlend[p] * alpha;
				});

				this.setPixel(x, y, px);
			}
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
		pixel = pixel.round();

		if(this.locked){
			var n = x * 4 + y * this.canvas.width * 4;
			this.tmp.imageData.data[n++] = pixel.r;
			this.tmp.imageData.data[n++] = pixel.g;
			this.tmp.imageData.data[n++] = pixel.b;
			this.tmp.imageData.data[n  ] = pixel.a * 255;

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
