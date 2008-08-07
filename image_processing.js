(function(){

var Color = function(r, g, b){
	this.r = Math.round(r, 10);
	this.g = Math.round(g, 10);
	this.b = Math.round(b, 10);

	"rgb".split("").forEach(function(x){
		this[x] = (this[x] >= 255)? 255
		         :(this[x] <=   0)? 0
		         : this[x];
	});
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

Color.prototype.each = function(f){
	f(this.r, "r", this);
	f(this.g, "g", this);
	f(this.b, "b", this);
};

Color.prototype.average = function(){
	return (this.r + this.g + this.b) / 3;
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

	var ht = H * 6;
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
	this.canvas   = element;
	this.context  = element.getContext("2d");
	this.gContext = element.getContext("opera-2dgame");
};

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
	data: function(){
		return this.canvas.toDataURL();
	},

	getPixel: function(x, y){
		return ImageProcessing.Color.fromHex(this.gContext.getPixel(x, y));
	},

	setPixel: function(x, y, pixel){
		this.gContext.setPixel(x, y, pixel.toString());
	},

	lock: function(){
		this.gContext.lockCanvasUpdates(true);
	},

	unlock: function(){
		this.gContext.lockCanvasUpdates(false);
	},

	update: function(){
		this.gContext.updateCanvas();
	},

	each: function(f){
		for(var x = 0, w = this.canvas.width; x < w; x++)
			for(var y = 0, h = this.canvas.height; y < h; y++)
				f(this.getPixel(x, y), x, y, this);
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

		var ip = new ImageProcessing(this.canvas.cloneNode(false));
		var gContext = ip.canvas.getContext("opera-2dgame");

		var n = parseInt(flt.length / 2);
		var width  = this.canvas.width - n;
		var height = this.canvas.height - n;
		var length = flt.length;

		var c = new ImageProcessing.Color(offset, offset, offset);
		var p = null;

		gContext.lockCanvasUpdates(true);

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

				gContext.setPixel(x, y, c);

				c = new ImageProcessing.Color(offset, offset, offset)
			}
		}

		gContext.lockCanvasUpdates(false);
		gContext.updateCanvas();

		return ip;
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
	},

	grayScale: function(){
		var self = this;
		this.each(function(px, x, y){
			var v = px.r * 0.299 + px.g * 0.587 + px.b * 0.114;
			self.setPixel(x, y, new ImageProcessing.Color(v, v, v));
		});
	},

	dither: function(pattern){
		var self = this;
		var black = new ImageProcessing.Color(0, 0, 0);
		var white = new ImageProcessing.Color(255, 255, 255);
		var l = pattern.length;
		var n = 256 / (l * l);

		this.each(function(px, x, y){
			if(self.getPixel(x, y).average() > pattern[x % l][y % l] * n + 8)
				self.setPixel(x, y, white);
			else
				self.setPixel(x, y, black);
		});
	}
};
