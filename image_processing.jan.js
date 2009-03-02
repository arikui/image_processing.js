ImageProcessing.prototype.readJAN = function(){
	var self = this
		.clone()
		.lock()
		.clip(0, Math.round(this.canvas.height / 2), this.canvas.width, 1)
		.autoContrast()
		.each(function(px, x, y, self){
			(px.average() > 127)? self.setPixel(x, y, ImageProcessing.Color.fromHex(0))
			                    : self.setPixel(x, y, ImageProcessing.Color.fromHex(0xffffff));
		});

	return (function(fnc){
		var bits = self
			.map(function(px, x, y){
				return (px.r == 0)? "0" : "1";
			})
			.join("")
			.replace(/^0*(.+1)0*$/, "$1");

		var mod0s    = bits.replace(/^1*(.+0)1*$/, "$1").split(/1+/);
		var mod1s    = bits.split(/0+/);
		var modWidth = Math.round((mod1s[0] + mod1s[1] + mod0s[0] + mod0s[1]).length / 4);

		var mods = [
			[(new Array(Math.round(v.length / modWidth) + 1)).join(0) for each(v in mod0s)],
			[(new Array(Math.round(v.length / modWidth) + 1)).join(1) for each(v in mod1s)]
		];

		bits = (function(s){
			for(var i = 0; i < mods[0].length; ++i){
				s += mods[1][i] + mods[0][i];
			}
			return s + mods[1][i];
		})("")

		bits = /^101(.{7})(.{7})(.{7})(.{7})(.{7})(.{7})01010(.{7})(.{7})(.{7})(.{7})(.{7})(.{7})/.exec(bits);
		bits.shift();

			return fnc(bits);
	})(function(bits){
		var odd     = ImageProcessing.JAN.chars.left.odd;
		var even    = ImageProcessing.JAN.chars.left.even;
		var chars   = "";
		var initKey = "";

		for(var i = 0; i < 6; ++i){
			if(bits[i] in odd){
				chars   += odd[bits[i]];
				initKey += "o";
			}
			else if(bits[i] in even){
				chars   += even[bits[i]];
				initKey += "e";
			}
		}

		chars = ImageProcessing.JAN.initial[initKey] + chars;

		for(var i = 6; i < 12; ++i){
			if(bits[i] in ImageProcessing.JAN.chars.right)
				chars += ImageProcessing.JAN.chars.right[bits[i]];
		}

		return chars;
	})
};

ImageProcessing.JAN = {
	chars: {
		left: {
			odd: {
				"0001101": 0, "0011001": 1, "0010011": 2, "0111101": 3, "0100011": 4,
				"0110001": 5, "0101111": 6, "0111011": 7, "0110111": 8, "0001011": 9
			},
			even: {
				"0100111": 0, "0110011": 1, "0011011": 2, "0100001": 3, "0011101": 4,
				"0111001": 5, "0000101": 6, "0010001": 7, "0001001": 8, "0010111": 9
			}
		},

		right: {
			"1110010": 0, "1100110": 1, "1101100": 2, "1000010": 3, "1011100": 4,
			"1001110": 5, "1010000": 6, "1000100": 7, "1001000": 8, "1110100": 9
		}
	},

	initial: {
		"oooooo": 0, "ooeoee": 1, "ooeeoe": 2, "ooeeeo": 3, "oeooee": 4,
		"oeeooe": 5, "oeeeoo": 6, "oeoeoe": 7, "oooooo": 8, "oeeoeo": 9
	},

	checkDigit: function(bits){
		var n = 0;

		bits.forEach(function(v, i){
			n += v * ((i % 2 == 0)? 1 : 3);
		});

		return 10 - (n % 10);
	}
};
