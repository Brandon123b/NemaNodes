// Generated by Haxe 4.0.5
(function ($hx_exports, $global) { "use strict";
$hx_exports["markov"] = $hx_exports["markov"] || {};
$hx_exports["markov"]["util"] = $hx_exports["markov"]["util"] || {};
;$hx_exports["markov"]["namegen"] = $hx_exports["markov"]["namegen"] || {};
function $extend(from, fields) {
	var proto = Object.create(from);
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	this.r = new RegExp(r,opt.split("u").join(""));
};
EReg.prototype = {
	match: function(s) {
		if(this.r.global) {
			this.r.lastIndex = 0;
		}
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
};
var HxOverrides = function() { };
HxOverrides.substr = function(s,pos,len) {
	if(len == null) {
		len = s.length;
	} else if(len < 0) {
		if(pos == 0) {
			len = s.length + len;
		} else {
			return "";
		}
	}
	return s.substr(pos,len);
};
HxOverrides.remove = function(a,obj) {
	var i = a.indexOf(obj);
	if(i == -1) {
		return false;
	}
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Main = function() { };
Main.main = function() {
};
var StringTools = function() { };
StringTools.startsWith = function(s,start) {
	if(s.length >= start.length) {
		return s.lastIndexOf(start,0) == 0;
	} else {
		return false;
	}
};
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	if(slen >= elen) {
		return s.indexOf(end,slen - elen) == slen - elen;
	} else {
		return false;
	}
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
var _$UInt_UInt_$Impl_$ = {};
_$UInt_UInt_$Impl_$.gte = function(a,b) {
	var aNeg = a < 0;
	var bNeg = b < 0;
	if(aNeg != bNeg) {
		return aNeg;
	} else {
		return a >= b;
	}
};
var haxe_ds_List = function() {
	this.length = 0;
};
haxe_ds_List.prototype = {
	add: function(item) {
		var x = new haxe_ds__$List_ListNode(item,null);
		if(this.h == null) {
			this.h = x;
		} else {
			this.q.next = x;
		}
		this.q = x;
		this.length++;
	}
	,pop: function() {
		if(this.h == null) {
			return null;
		}
		var x = this.h.item;
		this.h = this.h.next;
		if(this.h == null) {
			this.q = null;
		}
		this.length--;
		return x;
	}
	,isEmpty: function() {
		return this.h == null;
	}
};
var haxe_ds__$List_ListNode = function(item,next) {
	this.item = item;
	this.next = next;
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
haxe_ds_StringMap.prototype = {
	setReserved: function(key,value) {
		if(this.rh == null) {
			this.rh = { };
		}
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) {
			return null;
		} else {
			return this.rh["$" + key];
		}
	}
	,keys: function() {
		return HxOverrides.iter(this.arrayKeys());
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) {
			out.push(key);
		}
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) {
				out.push(key.substr(1));
			}
			}
		}
		return out;
	}
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	if(Error.captureStackTrace) {
		Error.captureStackTrace(this,js__$Boot_HaxeError);
	}
};
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var markov_namegen_Generator = $hx_exports["markov"]["namegen"]["Generator"] = function(data,order,prior,backoff) {
	if(!(data != null)) {
		throw new js__$Boot_HaxeError("FAIL: data != null");
	}
	if(!_$UInt_UInt_$Impl_$.gte(order,1)) {
		throw new js__$Boot_HaxeError("FAIL: order >= 1");
	}
	if(!(prior >= 0)) {
		throw new js__$Boot_HaxeError("FAIL: prior >= 0");
	}
	this.order = order;
	this.prior = prior;
	this.backoff = backoff;
	var letters = markov_util__$ArraySet_ArraySet_$Impl_$.create();
	var _g = 0;
	while(_g < data.length) {
		var word = data[_g];
		++_g;
		var _g1 = 0;
		var _g11 = word.length;
		while(_g1 < _g11) {
			var i = _g1++;
			markov_util__$ArraySet_ArraySet_$Impl_$.add(letters,word.charAt(i));
		}
	}
	letters.sort(function(a,b) {
		if(a < b) {
			return -1;
		}
		if(a > b) {
			return 1;
		}
		return 0;
	});
	var domain = markov_util__$ArraySet_ArraySet_$Impl_$.toArray(letters);
	domain.splice(0,0,"#");
	this.models = [];
	if(this.backoff) {
		var _g12 = 0;
		var _g2 = order;
		while(_g12 < _g2) {
			var i1 = _g12++;
			this.models.push(new markov_namegen_Model(data.slice(),order - i1,prior,domain));
		}
	} else {
		this.models.push(new markov_namegen_Model(data.slice(),order,prior,domain));
	}
};
markov_namegen_Generator.prototype = {
	generate: function() {
		var times = this.order;
		if(!true) {
			throw new js__$Boot_HaxeError("FAIL: str != null");
		}
		if(!(times >= 1)) {
			throw new js__$Boot_HaxeError("FAIL: times >= 1");
		}
		var output = "";
		var _g = 0;
		var _g1 = times;
		while(_g < _g1) {
			var i = _g++;
			output += "#";
		}
		var word = output;
		var letter = this.getLetter(word);
		while(letter != "#" && letter != null) {
			if(letter != null) {
				word += letter;
			}
			letter = this.getLetter(word);
		}
		return word;
	}
	,getLetter: function(word) {
		if(!(word != null)) {
			throw new js__$Boot_HaxeError("FAIL: word != null");
		}
		if(!(word.length > 0)) {
			throw new js__$Boot_HaxeError("FAIL: word.length > 0");
		}
		var letter = null;
		var context = word.substring(word.length - this.order,word.length);
		var _g = 0;
		var _g1 = this.models;
		while(_g < _g1.length) {
			var model = _g1[_g];
			++_g;
			letter = model.generate(context);
			if(letter == null || letter == "#") {
				context = context.substring(1);
			} else {
				break;
			}
		}
		return letter;
	}
};
var markov_namegen_Model = function(data,order,prior,alphabet) {
	if(!(alphabet != null && data != null)) {
		throw new js__$Boot_HaxeError("FAIL: alphabet != null && data != null");
	}
	if(!(alphabet.length > 0 && data.length > 0)) {
		throw new js__$Boot_HaxeError("FAIL: alphabet.length > 0 && data.length > 0");
	}
	if(!(prior >= 0 && prior <= 1)) {
		throw new js__$Boot_HaxeError("FAIL: prior >= 0 && prior <= 1");
	}
	this.order = order;
	this.prior = prior;
	this.alphabet = alphabet;
	this.observations = new haxe_ds_StringMap();
	this.train(data);
	this.buildChains();
};
markov_namegen_Model.countMatches = function(arr,v) {
	if(arr == null) {
		return 0;
	}
	var i = 0;
	var _g = 0;
	while(_g < arr.length) {
		var s = arr[_g];
		++_g;
		if(s == v) {
			++i;
		}
	}
	return i;
};
markov_namegen_Model.selectIndex = function(chain) {
	var totals = [];
	var accumulator = 0;
	var _g = 0;
	while(_g < chain.length) {
		var weight = chain[_g];
		++_g;
		accumulator += weight;
		totals.push(accumulator);
	}
	var rand = Math.random() * accumulator;
	var _g1 = 0;
	var _g2 = totals.length;
	while(_g1 < _g2) {
		var i = _g1++;
		if(rand < totals[i]) {
			return i;
		}
	}
	return 0;
};
markov_namegen_Model.prototype = {
	generate: function(context) {
		if(!(context != null)) {
			throw new js__$Boot_HaxeError("FAIL: context != null");
		}
		var _this = this.chains;
		var chain = __map_reserved[context] != null ? _this.getReserved(context) : _this.h[context];
		if(chain == null) {
			return null;
		} else {
			if(!(chain.length > 0)) {
				throw new js__$Boot_HaxeError("FAIL: chain.length > 0");
			}
			return this.alphabet[markov_namegen_Model.selectIndex(chain)];
		}
	}
	,retrain: function(data) {
		if(!(data != null)) {
			throw new js__$Boot_HaxeError("FAIL: data != null");
		}
		this.train(data);
		this.buildChains();
	}
	,train: function(data) {
		while(data.length != 0) {
			var d = data.pop();
			var times = this.order;
			if(!true) {
				throw new js__$Boot_HaxeError("FAIL: str != null");
			}
			if(!(times >= 1)) {
				throw new js__$Boot_HaxeError("FAIL: times >= 1");
			}
			var output = "";
			var _g = 0;
			var _g1 = times;
			while(_g < _g1) {
				var i = _g++;
				output += "#";
			}
			d = output + d + "#";
			var _g2 = 0;
			var _g11 = d.length - this.order;
			while(_g2 < _g11) {
				var i1 = _g2++;
				var key = d.substring(i1,i1 + this.order);
				var _this = this.observations;
				var value = __map_reserved[key] != null ? _this.getReserved(key) : _this.h[key];
				if(value == null) {
					value = [];
					var _this1 = this.observations;
					if(__map_reserved[key] != null) {
						_this1.setReserved(key,value);
					} else {
						_this1.h[key] = value;
					}
				}
				value.push(d.charAt(i1 + this.order));
			}
		}
	}
	,buildChains: function() {
		this.chains = new haxe_ds_StringMap();
		var context = this.observations.keys();
		while(context.hasNext()) {
			var context1 = context.next();
			var _g = 0;
			var _g1 = this.alphabet;
			while(_g < _g1.length) {
				var prediction = _g1[_g];
				++_g;
				var _this = this.chains;
				var value = __map_reserved[context1] != null ? _this.getReserved(context1) : _this.h[context1];
				if(value == null) {
					value = [];
					var _this1 = this.chains;
					if(__map_reserved[context1] != null) {
						_this1.setReserved(context1,value);
					} else {
						_this1.h[context1] = value;
					}
				}
				var tmp = this.prior;
				var _this2 = this.observations;
				var arr = __map_reserved[context1] != null ? _this2.getReserved(context1) : _this2.h[context1];
				var tmp1;
				if(arr == null) {
					tmp1 = 0;
				} else {
					var i = 0;
					var _g2 = 0;
					while(_g2 < arr.length) {
						var s = arr[_g2];
						++_g2;
						if(s == prediction) {
							++i;
						}
					}
					tmp1 = i;
				}
				value.push(tmp + tmp1);
			}
		}
	}
};
var markov_namegen_NameGenerator = $hx_exports["markov"]["namegen"]["NameGenerator"] = function(data,order,prior,backoff) {
	if(backoff == null) {
		backoff = false;
	}
	this.generator = new markov_namegen_Generator(data,order,prior,backoff);
};
markov_namegen_NameGenerator.prototype = {
	generateName: function(minLength,maxLength,startsWith,endsWith,includes,excludes,regexMatch) {
		var name = "";
		name = this.generator.generate();
		name = StringTools.replace(name,"#","");
		if(name.length >= minLength && name.length <= maxLength && StringTools.startsWith(name,startsWith) && StringTools.endsWith(name,endsWith) && (includes.length == 0 || name.indexOf(includes) != -1) && (excludes.length == 0 || name.indexOf(excludes) == -1) && (regexMatch == null || regexMatch.match(name))) {
			return name;
		}
		return null;
	}
	,generateNames: function(n,minLength,maxLength,startsWith,endsWith,includes,excludes,maxTimePerName,regexMatch) {
		if(maxTimePerName == null) {
			maxTimePerName = 0.02;
		}
		var names = [];
		var startTime = new Date().getTime();
		var currentTime = new Date().getTime();
		while(names.length < n && currentTime > startTime + maxTimePerName * n) {
			var name = this.generateName(minLength,maxLength,startsWith,endsWith,includes,excludes,regexMatch);
			if(name != null) {
				names.push(name);
			}
			currentTime = new Date().getTime();
		}
		return names;
	}
};
var markov_util__$ArraySet_ArraySet_$Impl_$ = {};
markov_util__$ArraySet_ArraySet_$Impl_$.create = function(array) {
	if(array == null) {
		var this1 = [];
		return this1;
	}
	return markov_util__$ArraySet_ArraySet_$Impl_$.toSet(array);
};
markov_util__$ArraySet_ArraySet_$Impl_$.intersection = function(this1,set) {
	var result = [];
	var _g = 0;
	while(_g < this1.length) {
		var element = this1[_g];
		++_g;
		if(markov_util__$ArraySet_ArraySet_$Impl_$.contains(set,element)) {
			result.push(element);
		}
	}
	var this2 = result;
	return this2;
};
markov_util__$ArraySet_ArraySet_$Impl_$.union = function(this1,set) {
	return markov_util__$ArraySet_ArraySet_$Impl_$.toSet(this1.concat(markov_util__$ArraySet_ArraySet_$Impl_$.toArray(set)));
};
markov_util__$ArraySet_ArraySet_$Impl_$.unionArray = function(this1,array) {
	return markov_util__$ArraySet_ArraySet_$Impl_$.toSet(this1.concat(array));
};
markov_util__$ArraySet_ArraySet_$Impl_$.difference = function(this1,set) {
	var this2 = this1.slice();
	var result = this2;
	var _g = 0;
	var _g1 = set;
	while(_g < _g1.length) {
		var element = _g1[_g];
		++_g;
		HxOverrides.remove(result,element);
	}
	var this3 = markov_util__$ArraySet_ArraySet_$Impl_$.toArray(result);
	return this3;
};
markov_util__$ArraySet_ArraySet_$Impl_$.add = function(this1,element) {
	if(!(element != null)) {
		throw new js__$Boot_HaxeError("FAIL: element != null");
	}
	if(markov_util__$ArraySet_ArraySet_$Impl_$.contains(this1,element)) {
		return false;
	}
	this1.push(element);
	return true;
};
markov_util__$ArraySet_ArraySet_$Impl_$.contains = function(this1,element) {
	var _g = 0;
	while(_g < this1.length) {
		var i = this1[_g];
		++_g;
		if(i == element) {
			return true;
		}
	}
	return false;
};
markov_util__$ArraySet_ArraySet_$Impl_$.copy = function(this1) {
	var this2 = this1.slice();
	return this2;
};
markov_util__$ArraySet_ArraySet_$Impl_$.slice = function(this1,position,end) {
	var this2 = this1.slice(position,end);
	return this2;
};
markov_util__$ArraySet_ArraySet_$Impl_$.splice = function(this1,position,length) {
	var this2 = this1.splice(position,length);
	return this2;
};
markov_util__$ArraySet_ArraySet_$Impl_$.toArray = function(this1) {
	return this1.slice();
};
markov_util__$ArraySet_ArraySet_$Impl_$.toSet = function(array) {
	var this1 = [];
	var set = this1;
	var _g = 0;
	while(_g < array.length) {
		var v = array[_g];
		++_g;
		markov_util__$ArraySet_ArraySet_$Impl_$.add(set,v);
	}
	return set;
};
markov_util__$ArraySet_ArraySet_$Impl_$._new = function(array) {
	var this1 = array;
	return this1;
};
var markov_util_EditDistanceMetrics = $hx_exports["markov"]["util"]["EditDistanceMetrics"] = function() { };
markov_util_EditDistanceMetrics.levenshtein = function(source,target) {
	if(!(source != null)) {
		throw new js__$Boot_HaxeError("FAIL: source != null");
	}
	if(!(target != null)) {
		throw new js__$Boot_HaxeError("FAIL: target != null");
	}
	var slen = source.length;
	var tlen = target.length;
	if(slen == 0) {
		return tlen;
	}
	if(tlen == 0) {
		return slen;
	}
	var this1 = new Array(tlen + 1);
	var costs = this1;
	var _g = 0;
	var _g1 = costs.length;
	while(_g < _g1) {
		var i = _g++;
		costs[i] = i;
	}
	var s = 0;
	while(s < source.length) {
		costs[0] = s + 1;
		var corner = s;
		var t = 0;
		while(t < target.length) {
			var upper = costs[t + 1];
			if(source.charAt(s) == target.charAt(t)) {
				costs[t + 1] = corner;
			} else {
				var tc = upper < corner ? upper : corner;
				costs[t + 1] = (costs[t] < tc ? costs[t] : tc) + 1;
			}
			corner = upper;
			++t;
		}
		++s;
	}
	return costs[costs.length - 1];
};
markov_util_EditDistanceMetrics.damerauLevenshtein = function(source,target) {
	if(!(source != null)) {
		throw new js__$Boot_HaxeError("FAIL: source != null");
	}
	if(!(target != null)) {
		throw new js__$Boot_HaxeError("FAIL: target != null");
	}
	if(source.length == 0) {
		return target.length;
	}
	if(target.length == 0) {
		return source.length;
	}
	var table = markov_util_EditDistanceMetrics.damerauLevenshteinMatrix(source,target,true);
	return table[table.length - 1];
};
markov_util_EditDistanceMetrics.damerauLevenshteinMatrix = function(source,target,enableTranspositions) {
	if(enableTranspositions == null) {
		enableTranspositions = true;
	}
	if(!(source != null && target != null)) {
		throw new js__$Boot_HaxeError("FAIL: source != null && target != null");
	}
	var w = source.length;
	var h = target.length;
	if(w == 0 || h == 0) {
		var this1 = new Array(0);
		return this1;
	}
	++w;
	++h;
	var this2 = new Array(w * h);
	var costs = this2;
	var _g = 0;
	var _g1 = w;
	while(_g < _g1) {
		var i = _g++;
		costs[i] = i;
	}
	var _g2 = 1;
	var _g3 = h;
	while(_g2 < _g3) {
		var j = _g2++;
		costs[j * w] = j;
	}
	var cost = 0;
	var _g4 = 1;
	var _g5 = w;
	while(_g4 < _g5) {
		var x = _g4++;
		var _g41 = 1;
		var _g51 = h;
		while(_g41 < _g51) {
			var y = _g41++;
			if(source.charAt(x - 1) == target.charAt(y - 1)) {
				cost = 0;
			} else {
				cost = 1;
			}
			var a = costs[x - 1 + y * w] + 1;
			var a1 = costs[x + (y - 1) * w] + 1;
			var b = costs[x - 1 + (y - 1) * w] + cost;
			var b1 = a1 < b ? a1 : b;
			costs[x + y * w] = a < b1 ? a : b1;
			if(enableTranspositions && x > 1 && y > 1 && source.charAt(x) == target.charAt(y - 1) && source.charAt(x - 1) == target.charAt(y)) {
				var a2 = costs[x + y * w];
				var b2 = costs[x - 2 + (y - 2) * w] + cost;
				costs[x + y * w] = a2 < b2 ? a2 : b2;
			}
		}
	}
	return costs;
};
var markov_util_FileReader = function() { };
var markov_util_IntExtensions = function() { };
markov_util_IntExtensions.clamp = function(value,min,max) {
	if(value < min) {
		return min;
	}
	if(value > max) {
		return max;
	}
	return value;
};
markov_util_IntExtensions.min = function(a,b) {
	if(a < b) {
		return a;
	}
	return b;
};
var markov_util_PrefixTrie = function() {
	this.root = new markov_util_PrefixNode(null,"",0);
};
markov_util_PrefixTrie.findChild = function(node,letter) {
	var _g = 0;
	var _g1 = node.children;
	while(_g < _g1.length) {
		var child = _g1[_g];
		++_g;
		if(child.letter == letter) {
			return child;
		}
	}
	return null;
};
markov_util_PrefixTrie.prototype = {
	insert: function(word) {
		var current = this.root;
		var _g = 0;
		var _g1 = word.length;
		while(_g < _g1) {
			var i = _g++;
			var ch = word.charAt(i);
			var child = markov_util_PrefixTrie.findChild(current,ch);
			if(child == null) {
				child = new markov_util_PrefixNode(current,ch,i);
				current.children.push(child);
			} else {
				child.frequency++;
			}
			current = child;
		}
		current.word = true;
		return current.frequency;
	}
	,find: function(word) {
		var current = this.root;
		var _g = 0;
		var _g1 = word.length;
		while(_g < _g1) {
			var i = _g++;
			current = markov_util_PrefixTrie.findChild(current,word.charAt(i));
			if(current == null) {
				return false;
			}
		}
		if(!current.word) {
			return false;
		}
		return true;
	}
	,getWords: function() {
		var queue = new haxe_ds_List();
		queue.add(this.root);
		var words = [];
		while(!queue.isEmpty()) {
			var node = queue.pop();
			if(node.word) {
				var word = node.letter;
				var parent = node.parent;
				while(parent != null) {
					word += parent.letter;
					parent = parent.parent;
				}
				if(!(word != null)) {
					throw new js__$Boot_HaxeError("FAIL: str != null");
				}
				var arr = word.split("");
				arr.reverse();
				words.push(arr.join(""));
			}
			var _g = 0;
			var _g1 = node.children;
			while(_g < _g1.length) {
				var child = _g1[_g];
				++_g;
				queue.add(child);
			}
		}
		return words;
	}
};
var markov_util_PrefixNode = function(parent,letter,depth) {
	if(!(letter.length == 1 || parent == null && depth == 0)) {
		throw new js__$Boot_HaxeError("FAIL: letter.length == 1 || (parent == null && depth == 0)");
	}
	this.parent = parent;
	this.children = [];
	this.letter = letter;
	this.depth = depth;
	this.frequency = 1;
	this.word = false;
};
var markov_util_StringExtensions = function() { };
markov_util_StringExtensions.reverse = function(str) {
	if(!(str != null)) {
		throw new js__$Boot_HaxeError("FAIL: str != null");
	}
	var arr = str.split("");
	arr.reverse();
	return arr.join("");
};
markov_util_StringExtensions.repeat = function(str,times) {
	if(!(str != null)) {
		throw new js__$Boot_HaxeError("FAIL: str != null");
	}
	if(!(times >= 1)) {
		throw new js__$Boot_HaxeError("FAIL: times >= 1");
	}
	var output = "";
	var _g = 0;
	var _g1 = times;
	while(_g < _g1) {
		var i = _g++;
		output += str;
	}
	return output;
};
markov_util_StringExtensions.contains = function(str,substr) {
	if(!(str != null)) {
		throw new js__$Boot_HaxeError("FAIL: str != null");
	}
	if(!(substr != null)) {
		throw new js__$Boot_HaxeError("FAIL: substr != null");
	}
	return str.indexOf(substr) >= 0;
};
markov_util_StringExtensions.capitalize = function(str) {
	if(!(str != null && str.length > 0)) {
		throw new js__$Boot_HaxeError("FAIL: str != null && str.length > 0");
	}
	return HxOverrides.substr(str,0,1).toUpperCase() + HxOverrides.substr(str,1,str.length - 1);
};
markov_util_StringExtensions.lowercase = function(str) {
	if(!(str != null && str.length > 0)) {
		throw new js__$Boot_HaxeError("FAIL: str != null && str.length > 0");
	}
	return HxOverrides.substr(str,0,1).toLowerCase() + HxOverrides.substr(str,1,str.length - 1);
};
markov_util_StringExtensions.capitalizeWords = function(str) {
	if(!(str != null)) {
		throw new js__$Boot_HaxeError("FAIL: str != null");
	}
	var parts = str.split(" ");
	var results = "";
	var _g = 0;
	var _g1 = parts.length;
	while(_g < _g1) {
		var i = _g++;
		var str1 = parts[i];
		if(!(str1 != null && str1.length > 0)) {
			throw new js__$Boot_HaxeError("FAIL: str != null && str.length > 0");
		}
		results += HxOverrides.substr(str1,0,1).toUpperCase() + HxOverrides.substr(str1,1,str1.length - 1);
		if(i <= parts.length - 1) {
			results += " ";
		}
	}
	return results;
};
markov_util_StringExtensions.lowercaseWords = function(str) {
	if(!(str != null)) {
		throw new js__$Boot_HaxeError("FAIL: str != null");
	}
	var parts = str.split(" ");
	var results = "";
	var _g = 0;
	var _g1 = parts.length;
	while(_g < _g1) {
		var i = _g++;
		var str1 = parts[i];
		if(!(str1 != null && str1.length > 0)) {
			throw new js__$Boot_HaxeError("FAIL: str != null && str.length > 0");
		}
		results += HxOverrides.substr(str1,0,1).toLowerCase() + HxOverrides.substr(str1,1,str1.length - 1);
		if(i <= parts.length - 1) {
			results += " ";
		}
	}
	return results;
};
var __map_reserved = {};
Object.defineProperty(js__$Boot_HaxeError.prototype,"message",{ get : function() {
	return String(this.val);
}});
})(typeof exports != "undefined" ? exports : typeof window != "undefined" ? window : typeof self != "undefined" ? self : this, {});