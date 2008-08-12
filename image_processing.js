(function(){
var Color = function(r, g, b){
	this.r = Math.round(r, 10);
	this.g = Math.round(g, 10);
	this.b = Math.round(b, 10);
}

Color.prototype.toString = function(){
	var c = [];

	this.each(function(v, x){
			c.push((v > 255)? 255
			      :(v <   0)? 0
			      : Math.round(v));
	});

	return "rgb(" + c + ")";
};

Color.prototype.round = function(){
	var self = this;

	this.each(function(v, x){
			self[x] = (v > 255)? 255
			         :(v <   0)? 0
			         : Math.round(v);
	});

	return this;
};

Color.prototype.each = function(f){
	f(this.r, "r", this);
	f(this.g, "g", this);
	f(this.b, "b", this);
};

Color.prototype.average = function(){
	return (this.r + this.g + this.b) / 3;
};

Color.prototype.geomean = function(){
	return Math.sqrt(Math.pow(this.r, 2) + Math.pow(this.g, 2) + Math.pow(this.b, 2));
};

Color.prototype.grayScale = function(){
	var v = this.r * 0.299 + this.g * 0.587 + this.b * 0.114;
	return new Color(v, v, v);
};

Color.prototype.invert = function(){
	return new Color(255 - this.r, 255 - this.g, 255 - this.b);
};

/**
 * @s   string "#rrggbb"
 */
Color.fromHex = function(s){
	var color = parseInt(s.substr(1), 16);
	return new Color(color >> 16, color >> 8 & 255, color & 255);
};

/**
 * @c   0 - 255
 * @m   0 - 255
 * @y   0 - 255
 */
Color.fromCmy = function(c, m, y){
	return new Color(255 - c, 255 - m, 255 - y);
};

/**
 * @h   0 - 359
 * @s   0 - 255
 * @v   0 - 255
 */
Color.fromHsv = function(h, s, v){
	var r, g, b;

	if(s = 0)
		return new Color(v, v, v);

	var ht = h * 6;
	var d = ht % 360;
	var t1 = Math.round((255 - s) / 255 * v);
	var t2 = Math.round(((255 - d) / 360 * s) / 255 * v);
	var t3 = Math.round((255 - (255 - d) / 360 * s) / 255 * v);

	switch(Math.round(ht / 360)){
		case 0 : return new Color(v, t3, t1);
		case 1 : return new Color(t2, v, t1);
		case 2 : return new Color(t1, v, t3);
		case 3 : return new Color(t1, t2, v);
		case 4 : return new Color(t3, t1, v);
		default: return new Color(v, t1, t2);
	}
};

/**
 * @y   0 - 255
 * @c   0 - 255
 * @c   0 - 255
 */
Color.fromYcc = function(y, c1, c2){
	var g = function(y, c1, c2){
		return (0.557 * y - 0.299 * c1 - 0.144 * c2) / 0.587;
	};

	return new Color(y + c2, g(y, c1, c2), y + c1);
};

ImageProcessing.Color = Color;
ImageProcessing.prototype.Color = Color;
})();


function ImageProcessing(element){
	this.init(element);
};

/**
 * create object by image source
 */
ImageProcessing.load = function(src){
	var canvas = document.createElement("canvas");
	var ip     = new ImageProcessing(canvas);
	var img    = new Image();

	img.src = src;
	canvas.width  = img.width;
	canvas.height = img.height;

	ip.context.drawImage(img, 0, 0, img.width, img.height);

	return ip;
};

ImageProcessing.prototype = {
	imageData: null,
	locked   : false,

	/**
	 * ImageData template
	 */
	_imageData: {
		width : 1,
		height: 1,
		data  : [0, 0, 0, 255]
	},

	/**
	 * constructor
	 */
	init: function(element){
		if(element) this.canvas = element;
		this.context = this.canvas.getContext("2d");

		// set browser support
		if(!ImageProcessing.support){
			this.support = {
				pixel    : false,
				imageData: !!this.context.getImageData
			};

			try{
				this.gContext = this.canvas.getContext("opera-2dgame");
				this.support.pixel = true;
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

	initPixelControl: function(){
		if(!this.support.pixel){
			ImageProcessing.prototype.getPixel = function(x, y){
				if(this.locked){
					var data = this.imageData.data;
					var n = x * 4 + y * this.canvas.width * 4;

					return new ImageProcessing.Color(data[n++], data[n++], data[n]);
				}

				var px = this.context.getImageData(x, y, 1, 1).data;
				return new ImageProcessing.Color(px[0], px[1], px[2]);
			};

			ImageProcessing.prototype.setPixel = function(x, y, pixel){
				pixel.round();

				if(this.locked){
					var n = x * 4 + y * this.canvas.width * 4;
					this.imageData.data[n++] = pixel.r;
					this.imageData.data[n++] = pixel.g;
					this.imageData.data[n  ] = pixel.b;

					return;
				}

				this._imageData.data = [pixel.r, pixel.g, pixel.b, 255];
				this.context.putImageData(this._imageData, x, y);
			};
		}
		else{
			ImageProcessing.prototype.getPixel = function(x, y){
				return ImageProcessing.Color.fromHex(this.gContext.getPixel(x, y));
			};

			ImageProcessing.prototype.setPixel = function(x, y, pixel){
				this.gContext.setPixel(x, y, pixel.toString());
			};
		}

		return this;
	},

	/**
	 * get data url
	 */
	data: function(){
		return this.canvas.toDataURL();
	},

	getPixel: function(x, y){
		return ImageProcessing.Color.fromHex(this.gContext.getPixel(x, y));
	},

	setPixel: function(x, y, pixel){
		this.gContext.setPixel(x, y, pixel.toString());
		return this;
	},

	lock: function(){
		this.locked = true;

		if(this.support.pixel)
			this.gContext.lockCanvasUpdates(this.locked);
		else
			this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

		return this;
	},

	unlock: function(){
		this.locked = false;

		if(this.support.pixel)
			this.gContext.lockCanvasUpdates(this.locked);

		return this;
	},

	update: function(){
		if(this.support.pixel)
			this.gContext.updateCanvas();
		else
			this.context.putImageData(this.imageData, 0, 0);

		return this;
	},

	each: function(f){
		for(var x = 0, w = this.canvas.width; x < w; x++)
			for(var y = 0, h = this.canvas.height; y < h; y++)
				f(this.getPixel(x, y), x, y, this);

		return this;
	},

	map: function(f){
		var a = [];

		for(var x = 0, w = this.canvas.width; x < w; x++)
			for(var y = 0, h = this.canvas.height; y < h; y++)
				a.push(f(this.getPixel(x, y), x, y, this));

		return a;
	},

	average: function(from_x, from_y, to_x, to_y){
		if(!from_x) from_x = 0;
		if(!from_y) from_y = 0;
		if(!to_x)   to_x   = this.canvas.width;
		if(!to_y)   to_y   = this.canvas.height;

		var _color;
		var color = new ImageProcessing.Color(0, 0, 0);
		var pixel_n = (to_x - from_x) * (to_y - from_y);

		for(var x = from_x; x < to_x; x++){
			for(var y = from_y; y < to_y; y++){
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

	createHistogram: function(){
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");
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

		var max = Math.max.apply(null, data.r.concat(data.g).concat(data.b));
		var min = Math.min.apply(null, data.r.concat(data.g).concat(data.b));
		var scale = (max - min) / 256;

		canvas.width = 256;
		canvas.height = 256;

		context.lineWidth = 1;

		"rgb".split("").forEach(function(x){
			switch(x){
				case "r":
					context.strokeStyle = "rgba(255,0,0,1)";
					break;
				case "g":
					context.strokeStyle = "rgba(0,255,0,1)";
					break;
				case "b":
					context.strokeStyle = "rgba(0,0,255,1)";
					break;
			}
			context.beginPath();
			context.moveTo(0,0);

			data[x].forEach(function(v, i){
				context.lineTo(i, (v - min)/ scale);
			});

			context.stroke();
			context.closePath();
		});

		return canvas;
	},

	filter: function(flt, offset){
		if(!offset) offset = 0;

		var supportPx = this.support.pixel;

		var ip = new ImageProcessing(this.canvas.cloneNode(false));

		var n = parseInt(flt.length / 2);
		var width  = this.canvas.width - n;
		var height = this.canvas.height - n;
		var length = flt.length;

		var c = new ImageProcessing.Color(offset, offset, offset);
		var p = null;

		ip.support.pixel = false;
		ip.initPixelControl();
		ip.lock();

		ip.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

		for(var x = n; x < width; x++){
			for(var y = n; y < height; y++){

				for(var fx = 0; fx < length; fx++){
					for(var fy = 0; fy < length; fy++){
						p = this.getPixel(x + fx - n, y + fy - n);
						c.r += p.r * flt[fy][fx];
						c.g += p.g * flt[fy][fx];
						c.b += p.b * flt[fy][fx];
					}
				}

				ip.setPixel(x, y, c);
				c = new ImageProcessing.Color(offset, offset, offset)
			}
		}

		this.support.pixel = false;
		this.initPixelControl();
		this.imageData = ip.imageData;
		this.update();

		if(supportPx){
			this.support.pixel = true;
			this.initPixelControl();
		}

		return this;
	},

	graph: function(f){
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");

		canvas.width = 255;
		canvas.height = 255;

		context.scale(1, -1);
		context.translate(0, -255);
		context.strokeStyle = "rgba(255,0,0,1)";
		context.lineWidth = 1;

		context.beginPath();
		context.moveTo(0, f(0));

		for(var x = 1; x < 256; x++)
			context.lineTo(x, f(x));

		context.stroke();
		context.closePath();

		return canvas;
	},

	mosaic: function(size_w, size_h){
		if(!size_h) size_h = size_w;

		var to_x, to_y;

		for(var x = 0, w = this.canvas.width; x < w; x += size_w){
			to_x = (x + size_w >= this.canvas.width) ? this.canvas.width  - 1 : x + size_w;

			for(var y = 0, h = this.canvas.height; y < h; y += size_h){
				to_y = (y + size_h >= this.canvas.height)? this.canvas.height - 1 : y + size_h;

				this.context.fillStyle = this.average(x, y, to_x, to_y).toString();
				this.context.fillRect(x, y, size_w, size_h);
			}
		}

		return this;
	},

	grayScale: function(){
		var self = this;

		this.each(function(px, x, y){
			var v = px.r * 0.299 + px.g * 0.587 + px.b * 0.114;
			self.setPixel(x, y, new ImageProcessing.Color(v, v, v));
		});

		return this;
	},

	dither: function(pattern){
		var self = this;
		var black = new ImageProcessing.Color(0, 0, 0);
		var white = new ImageProcessing.Color(255, 255, 255);
		var l = pattern.length;
		var n = 256 / (l * l);

		var tmpPx = new ImageProcessing.Color(0, 0, 0);

		this.each(function(px, x, y){
			if(px.grayScale().r > pattern[x % l][y % l] * n + l * l / 2)
				self.setPixel(x, y, white);
			else
				self.setPixel(x, y, black);
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
		for(var y = 0; y < h; y++){
			tmp[y] = [];
			for(var x = 0; x < w; x++){
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
				self.setPixel(x, y, new ImageProcessing.Color(v, v, v));
			});
		});

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