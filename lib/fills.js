
'use strict';

	require('harmony-reflect');

/////////////////////////////////////////////////////////////////////////////////////////////
// REQUIRES

	const Assign 	= require('object-assign');
	const colors 	= require('colors');
	const Imm 		= require('immutable');
	const StrTime 	= require('strftime');
	const TZ        = require('tzdata');
	const ROOTD 	= require('app-root-path');
	const LJ 		= require('longjohn'); LJ.async_trace_limit = -1;
	const PATH 		= require('path');
	const os 		= require('os');
	const fs 		= require('fs');


/////////////////////////////////////////////////////////////////////////////////////////////
// Misc

	function ARGS	(args, from) { return Array.prototype.slice.call(args).slice(from || 0); }
	function TYPE 	(obj, typ) { return obj.constructor.name == (typeof(typ)=='string'?typ:typ.name); }
	function OF 	(val) { return Object.prototype.toString.call(val).match(/\[object (\w+)\]/)[1]; };
	function EXTEND (sup, base, handlers) {
		var descriptor, handles, proxy;
		descriptor = Object.getOwnPropertyDescriptor(
			base.prototype, 'constructor'
		);
		base.prototype = Object.create(sup.prototype);
		handles = Assign({
			construct  (target, args) {
				var pro = Object.create(base.prototype),
					obj = new Proxy(pro, handlers || {});
				this.apply(target, obj, args); return obj;
			},
			apply  (target, that, args) {
				if (!(that instanceof base)) {
					return this.construct(target, args);
				}
				sup.apply( that, args);
				base.apply(that, args);
			}
		}, handlers || {});
		proxy = new Proxy(base, handles); descriptor.value = proxy;
		Object.defineProperty(base.prototype, "constructor", descriptor);
		return proxy;
	}
	function HIDDEN (value, isGetSet) {
		var def = { enumerable: false, configurable: false };
		return Assign(def, (!!isGetSet ? value : {
			writable: false, value: value
		}));
	}
	function DEFINE (proto, properties) {
		// Just a Wrapper to Shorten the Call
		Object.defineProperties(proto, properties);
	}
	function NIL 	(val) { return [null, undefined].indexOf(val) > -1; }
	function UoN 	(val, def, log) { let is = NIL(val); return (!!def ? (is?def:val) : is); }
	function IaN 	(val) { return !NIL(val) && !isNaN(val); }
	function ISS 	(arg) {
		var OBJ = false, RET = {}, STR, NAN = true,
			ANS, BLN, DTE, ARR, NMB, NUM, EML, IMG, LNK, SCK, TXT, RAW, FNC, SYM,
			dReg = /^\d{4}(-\d{2}){2}[T ](\d{2}:){2}\d{2}(?:\.\d{3})?Z?$/,
			lReg = /^(?:\/[^\/\n\t]+)+|\/$/,
			sReg = /^SocketLink\{.+\}$/,
			eReg = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
			nReg = /^\.?(?:\d+\.){2,}\d+$|^(?:[a-f\d]{2}:){5}[a-f\d]{2}$/i,
			iReg = /^(data:image\/gif;base64,)(.+)$/;
		// String Representation
		STR = !!arg ? arg.toString() : '';
		try { NAN = isNaN(eval(arg)); } catch (e) {}
		// Determine Array
		ARR = (arg instanceof Array);
		// Determine Types w/ Regex
		DTE = (!!!ARR&&!!STR.match(dReg));
		EML = (!!!ARR&&!!STR.match(eReg));
		LNK = (!!!ARR&&!!STR.match(lReg));
		SCK = (!!!ARR&&!!STR.match(sReg));
		IMG = (!!!ARR&&!!STR.match(iReg));
		NUM = (!!!ARR&&!!STR.match(nReg));
		// Determine Types w/o Regex
		BLN = (typeof(arg) == 'boolean');
		NMB = (!(NUM||ARR||BLN||DTE||NAN));
		TXT = (!(SCK||IMG||EML||LNK||NMB||DTE) && NAN && typeof(arg) == 'string');
		RAW = (arg instanceof RegExp);
		FNC = (typeof arg == 'function');
		SYM = (typeof(arg) == 'symbol');
		// Fill-In Return
		ANS = Imm.Map({
			'date': 	(DTE),
			'email': 	(EML),
			'link': 	(LNK),
			'socket': 	(SCK),
			'image': 	(IMG),
			'boolean': 	(BLN),
			'string': 	(TXT),
			'raw': 		(RAW),
			'number': 	(NMB),
			'numeric': 	(NUM),
			'function': (FNC),
			'symbol': 	(SYM),
			'array': 	ARR,
			'null': 	NIL(arg),
			'object': 	false
		});
		// Determine IF Object
		ANS.map((V, K) => {
			OBJ = !OBJ ? (V ? 1 : 0) : 1;
		});
		RET = ANS.toJS(); RET.object = !OBJ;
		// Return Answers
		return Object.keys(RET).filter(v => { return RET[v]; })[0];
	}
	function IS 	(arg) {
		var OBJ = false, RET = {}, STR, NAN = true, ANS, BLN, DTE;
		// Determine Types
		STR = arg.toString();
		BLN = (typeof(arg) == 'boolean');
		DTE = (arg instanceof Date);
		try { NAN = isNaN(eval(arg)); } catch (e) {}
		// Fill-In Return
		ANS = Imm.Map({
			bln: 	(BLN),
			dte: 	(DTE),
			txt: 	(NAN && typeof(arg) == 'string'),
			raw: 	(arg instanceof RegExp),
			num: 	(!BLN && !DTE && !NAN),
			arr: 	(arg instanceof Array),
			obj: 	false
		});
		// Determine IF Object
		ANS.map((V, K) => {
			OBJ = !OBJ ? (V ? 1 : 0) : 1;
		});
		RET = ANS.toJS(); RET.obj = !OBJ;
		// Return Answers
		return RET;
	}
	function preARGS(func, defs) {
		function PARAM_NAMES (func, defs) {
			try {
				var O = {},
					K = func.toString()
							.replace(/(\s*\/\*(?:\/(?!\*).|\*(?!\/).|[^\*\/])+\*\/\s*)/g, "")
							.match(/function\s*(?:[^\s()]+|)(?:[(]([^()]+)[)])/g)[0]
							.match(/(?:[(]([^()]+)[)])/)[0]
							.replace(/(\s+)/g, "")
							.match(/([^({, })]+(?=,[\s\n\t]*|[)]))/gm);
				K.map((ke, y) => { O[ke] = defs[ke]; });
				return O;
			} catch (err) {
				console.log("PARAM_NAMES ERROR: %s", err.stack);
				// console.trace();
				return [];
			}
		}
		function PARAM_OBJECT (defs, args) {
			try {
				var P = Object.keys(args), K = Object.keys(defs), R = {}, D = {}, V = {}, A = {};
				// ---
				P.map((ke, y) => { var ky = K[y]; if (!!ky) { R[ky] = args[y]; D[ky] = defs[ky]; } });
				// ---
				V = Imm.OrderedMap(D).mergeDeepWith((p, n) => {
						switch (true) {
							case p instanceof Function: return p(n);
							default: return n === undefined || n === null ? p : n;
						}
					}, Imm.fromJS(R)).toJS();
				// ---
				A = P.map((ke, y) => { return V[(K[y]||y)]; });
				// ---
				return { Vals: V, Args: A }
			} catch (err) { console.log("PARAM_OBJECT ERROR: %s", err); return {}; }
		}
		try {
			var nmes = PARAM_NAMES(func, defs);
			return function () {
				var prms = PARAM_OBJECT(nmes, arguments); func['@'] = prms.Vals;
				return func.apply(func, prms.Args);
			}
		} catch (err) { console.log("preARGS ERROR: %s", err); return func; }
	}
	function TOP 	(arr, by, dsc) {
		var res = '', num = false, srt = {
				true   (a, b) { return by(a) - by(b); },
				false  (a, b) { return by(b) - by(a); },
			}[!!dsc];
		by  = by || function (v) { return (num ? v : v.toString().len); };
		arr = Imm.List(arr).toArray();
		try { res = (arr.length > 1 ? arr.sort(srt) : arr)[0].toString(); } catch (e) { }
		try { num = arr.filter(v=>IaN(v)).length==arr.length; } catch (e) { }
		try { return by(res); } catch (e) { res.length; }
	}

/////////////////////////////////////////////////////////////////////////////////////////////
// Extendable Proxy

	class EPROXY {

		/**
		 * Creates an instance of EPROXY.
		 * @typedef {object} EHANDLERS
		 * @prop {(target:object,argumentsList:Array,newTarget:object)=>void} construct
		 * @prop {(target:object,thisArg:object,argumentsList:Array)=>void} apply
		 * @prop {(target:object)=>void} ownKeys
		 * @prop {(target:object,property:(string|number|symbol)=>void} has
		 * @prop {(target:object,property:(string|number|symbol,receiver:Proxy)=>void} get
		 * @prop {(target:object,property:(string|number|symbol,value:any,receiver:Proxy)=>void} set
		 * @prop {(target:object,property:(string|number|symbol)=>void} deleteProperty
		 */

		/**
		 * Creates an instance of EPROXY.
		 * @param {EHANDLERS} [configs={}] The `Proxy` handlers
		 * @memberof EPROXY
		 */
		constructor(configs = {}) { 
			return new Proxy(this, configs||{}); 
		}

		/**
		 * Makes an `Object` "callable"
		 * @param {any} obj The `Object` to make "callable"
		 * @param {EHANDLERS} handles The `Proxy` handlers
		 * @returns {Proxy} A new, `Proxied` `Object`
		 * @memberof EPROXY
		 * @static
		 */
		static CALLABLE(obj, handles) {
			return new Proxy(obj, Assign(handles||{}, {
				apply (target, thisArg, argumentsList) {
					return new target(...argumentsList);
				}
			})	);
		}

	}
	

/////////////////////////////////////////////////////////////////////////////////////////////
// Pulic File Object

	class FOLDER {
		/// CONSTRUCTOR /////////////////////////////////////////////////////////////////////////
			constructor(location, age) {
				this.location = location;
				this.age = age;
			}

		/// FUNCTIONS ///////////////////////////////////////////////////////////////////////////
			get    root() { return '/'+this.location; }

			get fullDir() { return path.join.apply(path, this.dir); }

			get     dir() { return [ROOTD, this.location]; }

			get   index() { return this.path('index.html'); }

			ext(ext, file) {
				// -- UNDER CONSTRUCTION --------
				return this.path(ext, file);
			}

			join() {
				return ARGS(arguments).join('/')
						   .replace(/([\/\\])[\/\\]+/g, "$1")
						   .replace(/([^\/\\][^\/\\]+)\1/g, "$1");
			}

			path() {
				var args = ARGS(arguments), file = this.dir.concat(args);
				return PATH.resolve(this.join.apply(this, file));
			}

			  html(file) { return this.path('html',	  file); }

				js(file) { return this.path('js', 	  file); }

			   css(file) { return this.path('css',	  file); }

			 comps(file) { return this.path('comps',  file); }

			images(file) { return this.path('images', file); }

			 fonts(file) { return this.path('fonts',  file); }
	}


/////////////////////////////////////////////////////////////////////////////////////////////
// Extended Dictionary

	/// CHILDREN ////////////////////////////////////////////////////////////////////////////
		
		class ITM {
			constructor(key, value, parent) {
				var THS = this;
				Object.defineProperty(THS, 'par', {
					enumerable: false, configurable: false, value: (parent || {})
				});
				if (TYPE(key, Object)) {
					THS.key = key.key; THS.val = key.val;
				} else {
					THS.key = key; THS.val = value;
				}
			}

			get parent  () { return this.par; }
			get idx     () { return this.parent.obj.indexOf(this); }
			get pos     () {
					var THS = this, obj = THS.parent.obj,
						key = this.key, pos = 0;
					for (let p = 0; p < obj.length; p++) {
						var v = obj[p];
						if (v.key == key) {
							pos++; if (v.val == THS.val) break;
						}
					}; return pos;
				}

			toString() { return "hi" }
			toArray () { var THS = this; return [THS.key, THS.val, THS.idx, THS.pos]; }
			toObject() {
				var THS = this; return {
					key: THS.key, val: THS.val,
					idx: THS.idx, pos: THS.pos,
				};
			}
			toJSON  () { var THS = this; return THS.toObject(); }
		}

	class DCT extends EPROXY {
		/// CONSTRUCTOR /////////////////////////////////////////////////////////////////////////

			constructor(KVs) {
				super({
					get(target, prop, receiver) {
						if (typeof(prop)!=='symbol') {
							return Reflect.has(target, prop) ? 
								Reflect.get(target, prop, receiver) : 
								target.find(prop).val;
						}
					},
					set: DCT.set,
					deleteProperty(target, prop) {
						var prs = target.parse(prop);
						if (!isNaN(Number(prop))) { return true; } 
						else if (!!prs.pos) { target.pull(prs.key, prs.pos); } 
						else { while (target.has(prs.key)) {
							target.pull(prs.key);
						}	}
					},
					has(target, prop) {
						var prs = target.parse(prop);
						return target.has(prs.key, prs.pos);
					},
				});
				var THS = this, obj = (KVs || {});
				DEFINE(THS, { 
					obj: { enumerable: false, configurable: false, writable: true, value: [] },	
					kys: { enumerable: false, configurable: false, writable: true, value: [] },	
					vls: { enumerable: false, configurable: false, writable: true, value: [] },	
					set: { enumerable: false, configurable: false, writable: false, 
						value(name, value, item) { return DCT.set(THS, name, value, item); } 
					}	
				});
				Object.keys(obj).map((k, i) => { THS.set(k, obj[k], true); });
			}

		/// MEMBERS /////////////////////////////////////////////////////////////////////////////

			get   size(     ) { return this.obj.length || 0; }
			get length(     ) { return this.size; }

			get  first(     ) { return this[1]; }
			set  first(value) { this[1].val = value; }
			get   last(     ) { return this[this.size]; }
			set   last(value) { this[this.size].val = value; }

		/// ACQUIRES ////////////////////////////////////////////////////////////////////////////

			keys() { return this.kys; }
			vals() { return this.vls; }
			parse(name, strict) {
				var THS = this, mch = name.match(/^(.*?)(\$?)(\d*)$/);
				return {
					key: mch[1], idx: !!mch[2],
					pos: parseInt(!!mch[2] ? (mch[3] || 0) : (mch[3] || 1))
				}
			}
			find(name) {
				var THS = this, res = {}, prs = THS.parse(name);
				// ----
				if (!!prs.pos) {
					let flt = THS.obj.filter((v, i) => {
						return v.key == prs.key && v.pos == prs.pos;
					});
					res = !!flt.length ? THS.obj[flt[0].idx] : res;
				}
				// ----
				return res;
			}
			has(key, pos) {
				var THS = this,
					andIdx = {
						true   (i1, i2) { return i2 == i2; },
						false  (i1, i2) { return true; }
					}[!!pos];
				return !!THS.obj.filter((v, i) => {
					return v.key == key && andIdx(v.pos, pos);
				}).length;
			}
			contains(value) {
				var THS = this;
				return !!THS.obj.filter((v, i) => {
					return v.val == value;
				}).length;
			}

		/// FUNCTIONS ///////////////////////////////////////////////////////////////////////////

			/**
			 * Pushes a new `ITM` into the `DCT`
			 * @param {string|symbol|RegExp|number} key The `ITM` key
			 * @param {any} value The `ITM` value
			 * @returns {DCT}
			 * @memberof DCT
			 */
			push(key, value) {
				var THS = this, sz = THS.size;
				THS.obj[sz] = new ITM(key, value, THS);
				THS.kys[sz] = key; THS.vls[sz] = value;
				THS.set(THS.size, THS.obj[THS.size-1]);
				return THS;
			}
			pull(key, pos) {
				var THS = this, nme = (key+'$'+(pos || 1)),
					fnd = THS.find(nme),
					idx = fnd.idx;
				THS.obj.splice(idx, 1);
				THS.kys.splice(idx, 1);
				THS.vls.splice(idx, 1);
				THS.obj.map((v, i) => i>idx && (THS[i] = v));
				delete THS[THS.size+1]; return THS;
			}
			forEach(callback) {
				var THS = this;
				return THS.obj.map((v, i) => {
					return callback(Assign(v), i.toString());
				});
			}
			loop(callback) {
				var THS = this, res = new DCT();
				THS.forEach((v, i) => {
					res.push(i, callback(v.val, v.key, v.pos, v.idx));
				}); return res;
			}
			map(callback) {
				var THS = this, res = new DCT();
				THS.forEach((v, k) => {
					res.push(v.key, callback(v.val, v.key, v.pos, v.idx));
				});
				return res;
			}
			filter(callback) {
				var THS = this, res = new DCT();
				THS.forEach((v, i) => {
					callback(v.val, v.key, v.pos, v.idx) && //res.push(v);
					res.push(v.key, v.val);
				}); return res;
			}
			
			toString() {
				var THS  = this, TAB = '    ',
					name = THS.constructor.name.replace(/_+$/, ''),
					obj  = THS.forEach((v, k) => {
						return `"${v.key}":\t${v.val}`;
					}).join(`,\n${TAB}`);
				return `${name} {\n${TAB}${obj}\n}`;
			}
			toArray() {
				var THS = this; return THS.obj.map(v=>v.val);
			}
			toObject() {
				var THS = this, res = {};
				THS.forEach((v, i) => {
					res[i] = v.toObject();
				}); return res;
			}
			toJSON() { var THS = this; return THS.toObject(); }

		/// STATICS /////////////////////////////////////////////////////////////////////////////

			static set(target, name, value, item) {
				var IsMBR = key => ['last','first','kys','vls'].indexOf(key)>-1,
					IsIDX = key => typeof(key) == 'number',
					IsITM = val => val instanceof ITM;
				if (!IsMBR(name) && !IsIDX(name) && !IsITM(value) && !!value) {
					var prs = target.parse(name),
						fnd = target.find(name),
						idx = fnd.idx;
					if (!!idx) target.obj[idx].val = value;
					else target.push(prs.key, value);
				} else { target[name] = value; }; return true;
			}

	}

/////////////////////////////////////////////////////////////////////////////////////////////
// Regex 4 Regex
	class RGX {
		/// CONSTRUCTOR /////////////////////////////////////////////////////////////////////////

			constructor(variables) {
				if (this instanceof RGX) {
					var THS = this;
					// Variables
					THS.VARS = variables || {};
					// Format Vars
					function Traverse (vars) {
						Object.keys(vars).map((va, r) => {
							var item = vars[va];
							switch (typeof(item)) {
								case "string": vars[va] = THS.Format(item); break;;
								default: Traverse(item);
							}
						});
					}
					Traverse(THS.VARS);
					// Return
					return this;
				} else { return new RGX(variables); }
			}

		/// CONSTANTS ///////////////////////////////////////////////////////////////////////////

			get PLCHLD() { return /\/%\/(\d+)?/; }
			get SLASH () { return "\\\\"; }

		/// PRIVATES ////////////////////////////////////////////////////////////////////////////

			Repeat(pattern, amount) {
				var THS = this, res = pattern.replace(THS.PLCHLD, "");
				for (let R = 1; R < parseInt(amount || 1); R++) res = pattern.replace(THS.PLCHLD, res);
				return res;
			}
			Format(pattern) {
				var THS = this,
					match = /\{{2}([^{\[(|.+)\]}]+?)((?:\.[^{\[(|.+)\]}]+?)*|(?:\+[^{\[(|.+)\]}]+?)*)\}{2}/g;
				return pattern.replace(match, (mch, key, sub) => {
					var rslt = !!THS.VARS[key] ? THS.VARS[key] : mch;
						subs = sub.match(/([^\.\+]+)/g);
					if (!!subs) {
						switch (true) {
							case sub.indexOf(".") > -1:
								for (let s = 0; s < subs.length; s++) {
									rslt = !!rslt.hasOwnProperty(subs[s]) ? rslt[subs[s]].toString() : mch;
								}
								break;;
							case sub.indexOf("+") > -1:
								var val = "", subs = [""].concat(subs);
								for (let s = 0; s < subs.length; s++) {
									val += rslt.hasOwnProperty(subs[s]) ? rslt[subs[s]].toString() : mch;
								}; rslt = val;
								break;;
						}
					} else {
						switch (typeof(rslt)) {
							case "string": break;;
							default: rslt = rslt[""];
						}
					}
					return typeof(rslt) == "string" ? THS.__(rslt) : mch;
				});
			}
			Parse(pattern) {
				var THS = this, ret = pattern.match(/^(?:\/|)?(.*?)(?:\/([gmi]{0,3})?|)$/);
				return { pattern: ret[1], options: ret[2] };
			}

		/// PUBLICS /////////////////////////////////////////////////////////////////////////////

			__(pattern) {

				// console.log('PAT:', pattern)

				var THS = this, res = pattern,
					left = /(\[)/g, rght = /(\])/g,
					mdle = /^\^([+*?]\??|\{\d+(?:,\d)?\})?$/,
					alph = /(\\A)/ig,
					alrg = /.*\[.*?([A-Z]~[a-z]).*?\].*/g,
					wrap = /([^\\]|^)<([<({\[]+|[^?+*]+|\\(?=[?+*]).+)\/(.*?)\/(\2|[\]})>]+)>/g,
					peat = /([^\\]|^)<\/(.*\/%\/(\d+)?.*?)\/>/g,
					escp = /([^\\]|^)<\|(.*?)\|>/g,
					btwn = /(([^(]|\\[(]|[(]\/)*[^\\]\b(?=\)))/g,
					pbhd = /([^\\]|^)\(\?\<\=(.+)(.)\)(\\.|[(\[].+[\])]|[^\\?+*](?:[?+*]\??|\{\d+(?:,\d+)?\})?)/g,
					nbhd = /([^\\]|^)\(\?\<\!(.+)\)(\\.|[(\[].+[\])]|[^\\?+*](?:[?+*]\??|\{\d+(?:,\d+)?\})?)/g;

				// Handle Wrap Patterns
				while (res.match(wrap)) {
					res = res.replace(wrap, (mch, frst, lft, mid, rgt) => {
						lft = lft.replace(left, '\\['); rgt = rgt.replace(rght, '\\]');
						mid = mid.replace(mdle, '[^'+lft+rgt+']$1');
						return (frst || '')+'['+lft+']' + mid + '['+rgt+']';
					});
				}
				// --
				res = res
					// Handle Escape Patterns
					.replace(escp, (mch, frst, escapees) => {
						escapees = escapees.replace(/([\^\[\]\\])/g, "\\$1")
						return (frst || '')+"[^"+escapees+"]|["+escapees+"]\\/\\/";
					})
					// Handle Repeated Patterns
					.replace(peat, (mch, frst, repeat, count) => {
						return (frst || '')+THS.Repeat(repeat, count);
					})
					// Handle Positive Look-Behind
					.replace(pbhd, (mch, frst, chr, rest, target) => {
						return (frst || '')+"(?:.?"+chr+"(?="+rest+").)"+('('+target+')').replace(/^\({2}(.*)\){2}$/g, "($1)");
					})
					// Handle Negative Look-Behind
					.replace(nbhd, (mch, frst, main, target) => {
						var mach = /((?:\\.|[^\[{()}\]]|\[.+\]|\(.+\))(?:[?+*]\??|\{\d+(?:,\d+)?\})?)/g,
							each = main.match(mach).reverse(), rlst = [];
						// Render Template
						each.map((ea, ch) => {
							if (ch > 0) {
								var cur = ch-1, nxt = ch, temp = "[^%N]%NQ(?:%R1|[^%C]%CQ%R2)",
									mcr = each[cur].match(/([^+*]+)((?:[?+*]\??|\{\d+(?:,\d+)?\})?)/);
									mnx = each[nxt].match(/([^+*]+)((?:[?+*]\??|\{\d+(?:,\d+)?\})?)/);
								switch (true) {
									case !!mnx[1].match(/^\(.+\)$/):
										each[nxt] = each[nxt].replace(/\((?:\?[!:=<]?)?(.+)\)(.*)/g, "(?:$1)$2");
										mnx = each[nxt].match(/([^{+*}]+)((?:[?+*]\??|\{\d+(?:,\d+)?\})?)/);
										rlst.push("(?:%C)(?!%R)"
											.replace(/(%C)/g, mnx[1].match(/^\((?:\?[!:=<]?)?(.+)\)$/)[1])
											.replace(/(%R)/g, each.slice(0, nxt).reverse().join('')));
										break;;
									case !!mcr[1].match(/^\(.+\)$/): temp = "[^%N]%NQ(?:%R1|%C%CQ%R2)";
									default:
										rlst.push(temp
											.replace(/(%NQ)/g, mnx[2])
											.replace(/(%N)/g, mnx[1])
											.replace(/(%R1)/g, each.slice(0, nxt).reverse().join(''))
											.replace(/(%CQ)/g, mcr[2])
											.replace(/(%C)/g, mcr[1])
											.replace(/(%R2)/g, each.slice(0, cur).reverse().join(''))
											.replace(/\[\^\[(.+)\]((?:[?+*]\??|\{\d+(?:,\d+)?\})?)\]/g, '[^$1]$2'));
								}
							}
						}); return (frst || '')+"(?:^|(?:"+rlst.join('|')+"))"+('('+target+')').replace(/^\({2}(.*)\){2}$/g, "($1)");
					});

				return res;
			}
			_(pattern) {
				var THS = this, ptrn = THS.Parse(THS.Format(pattern)),
					res = ptrn.pattern, opt = ptrn.options;
				return new RegExp(THS.__(res), opt);
			}
	}


/////////////////////////////////////////////////////////////////////////////////////////////
// String Formatter

	/**
	 * A format style for an expected value type 
	 * (`txt`|`dte`|`num`|`num`|`bln`|`arr`|`obj`|`raw`).
	 * @typedef  {string} FMType
	 */
	/**
	 * An `Object` literal that tracks and indexes the amount of 
	 * the template values by `type`.
	 * @typedef  {Object.<string,number>} FMCounts
	 * @property {number} str The current index of `String` values
	 * @property {number} lst The current index of `Array` values
	 * @property {number} obj The current index of `Object` values
	 */
	/**
	 * An `Object` literal of `Arrays` that holds each value by `type`.
	 * @typedef  {Object.<string,array>} FMGroups
	 * @property {string[]} str All of the `String` values
	 * @property {[][]} lst All of the `Array` values
	 * @property {{}[]} obj All of the `Object` values
	 */
	/**
	 * Whether of not to treat the formatting of a specific `FMType` in a **strict**
	 * manor. If `true`, a value given that is **not** the same type as the expected
	 * `FMType` will not be **blank**.
	 * @typedef  {boolean} FMStrict
	 */
	/**
	 * An `Object` literal that matches the **key** variables to their values.
	 * @typedef  {object} FMKeyVal
	 * @property {boolean[]} [emp=[]] Emphasis -- 
	 * @property {string[]} [key=[]] Key -- The list of named variables marker for this template
	 * @property {any[]} [val=[]] Value -- The list of values given for said template variables
	 * @property {number} [cnt=1] Count -- 
	 */
	/**
	 * A `String` template for the `FRMT` class. (see: [`printf (C++)`](http://www.cplusplus.com/reference/cstdio/printf/))
	 * 
	 * ### Formatters:
	 * | ... | Name | Output |
	 * | :-------- | :--: | :----- |
	 * | `%(t)` | `Stringy` | _Any value, formatted as (`t`)._ |
	 * | `%[%s](t)` | `Array` | _The `Array`, formatted as specified._ |
	 * | `%{%(k¦v)s}(t)` | `Object` | _The `Object`, formatted as specified._ |
	 * | `%(named)(t)` | `Named` | _The property matching the named variable._ |
	 * 
	 * ### Types:
	 * | ... | Name | Output | Example |
	 * | ---: | :--: | :----- | :------ |
	 * | `s` | `String` | _String of characters._ | hello, world |
	 * | `d` | `Date` | _A date string or object._ | May 4 05:00PM |
	 * | `i` | `Integer` | _Signed decimal integer._ | 392 |
	 * | `f` | `Float` | _Decimal floating point, lowercase._ | 392.65 |
	 * | `b` | `Boolean` | _A truthy or falsy statement._ | true |
	 * | `a` | `Array` | _An array or items_ | [1,2,3,4,5] |
	 * | `o` | `Object` | _An object of items._ | {hello:"world"} |
	 * | `r` | `Raw` | _Anything. Evalutes and auto formats._ | 1 or "hello" |
	 * | `%%` | `String` | _A literal percent sign._ | % |
	 * 
	 * ### Flags:
	 * | ... | Name | Output |
	 * | :--: | :--: | :----- |
	 * | `!` | `Strict` | _Blank, if the value does not match the type._ |
	 * | `-` | `Left` | _**Left**-justify within the given field width; **Right** justification is the default._ |
	 * | `(number)` | `Width` | _Minimum number of characters to be printed._ |
	 * | `.(number)` | `Width` | _The minimum number of digits or decimal places to be printed._ |
	 * 
	 * ### Modifiers:
	 * | Context | Name | Description | Example |
	 * | :-- | :--: | :----- | :------ |
	 * | `%`&#124;`-/Mr. `&#124;`s` | `Prefix` | _Prepend the template value with `Mr. `_ | Smith => Mr. Smith |
	 * | `%`&#124;`+/ Sr.`&#124;`s` | `Suffix` | _Append the template value with ` Sr.`_ | Jacob => Jacob Sr. |
	 * | `%[%s`&#124;`;/ or ]s` | `Delimiter` | _Delimit the template value by `or`_ | [1,2] => 1 or 2 |
	 * | `%[ %s`&#124;`&/ and]s` | `Last` | _Prepend the **last** `Array` item with ` and `_ | [1,2,3] => 1 2 and 3 |
	 * | `%`&#124;`^/U`&#124;`s` | `Case` | _Format the case as `U`&#124;`L`&#124;`T`_ | hello => HELLO |
	 * | `%`&#124;`@/grey`&#124;`s` | `Color` | _Color the template value_ | ... |
	 * | `%`&#124;`=/ll/77`&#124;`s` | `Replace` | _Replace occurences of characters with another_ | hello => he77o |
	 * | `%`&#124;`#/Name:`&#124;`s` | `Index` | _Comming soon..._ | ... |
	 * | `%`&#124;`?/Name:`&#124;`s` | `Column` | _Coming soon..._ | ... |
	 * 
	 * @typedef  {string} FMTemplate
	 */

	/// STATICS /////////////////////////////////////////////////////////////////////////////
		
		// PARAMETERS
			const FRMT_PRMS = {
				S: Imm.fromJS({
					/** @alias     prefix */ PFX: '-', 
					/** @alias     suffix */ SFX: '+', 
					/** @alias  delimiter */ DLM: ';', 
					/** @alias   elements */ ELM: '&',
					/** @alias       case */ CSE: '^', 
					/** @alias    replace */ REP: '='
				}),
				P: {
					Mod: Imm.fromJS({ CLR: '@', IDX: '#', COL: '?' }),
					Prm: {
						CLR: { C: '', B: '', S: '', F: '' },
						IDX: { P: '', '<': '', '>': '' },
						COL: { C: '', W: '', R: '' }
					}
				},
			};
			const FRMT_MODS = Assign(FRMT_PRMS.P.Mod.toJS(), FRMT_PRMS.S.toJS());
			const FRMT_OPTS = {
				Modify: '[' + FRMT_PRMS.S.valueSeq().toJS().join('').replace(/([\\^\\-])/g, '\\$1') +
						']|[' + FRMT_PRMS.P.Mod.valueSeq().toJS().join('').replace(/([\\^\\-])/g, '\\$1') +
						']',
				Params: '[' +
						[].concat.apply([],Imm.fromJS(FRMT_PRMS.P.Prm)
						  .valueSeq().toJS().map((mo, d) => {
						  	return Imm.fromJS(mo).keySeq().toJS();
						})).join('') +
						']',
				Struct: Imm.fromJS({
					'-': '', '+': '', ';': '', '&': '',
					'@': FRMT_PRMS.P.Prm.CLR,
					'^': '', '=': '',
					'?': FRMT_PRMS.P.Prm.COL,
					'#': FRMT_PRMS.P.Prm.IDX,
				}),
			};
			const FRMT_TYPS = {
				/** @alias  string */ s: 'txt',
				/** @alias    date */ d: 'dte',
				/** @alias  number */ i: 'num',
				/** @alias   float */ f: 'num',
				/** @alias boolean */ b: 'bln',
				/** @alias   array */ a: 'arr',
				/** @alias  object */ o: 'obj',
				/** @alias     raw */ r: 'raw',
			};
			const FRMT_FNTS = {
				color: '|black|red|green|yellow|blue|magenta|cyan|white|gray|grey|' +
					   '|ltRed|ltGreen|ltYellow|ltBlue|ltMagenta|ltCyan|ltWhite',
				backg: '|bgBlack|bgRed|bgGreen|bgYellow|bgBlue|bgMagenta|bgCyan|bgWhite|',
				style: '|reset|bold|dim|italic|underline|inverse|hidden|strikethrough|',
			};
			FRMT_FNTS.fonts = (
				FRMT_FNTS.color+
				FRMT_FNTS.backg+
				FRMT_FNTS.style
			).replace(/([|]{2,})/, '|');

		// PATTERNS
			const FRMT_REG 	= new RGX({
				'!': 	{ "":  '%(!)?', Non: '%!?' },
				Typ: 	{
					Opt: '['+Object.keys(FRMT_TYPS).join('')+']',
					M: 	 '[.]',
					Dec: '(?:\\d+(?=f))',
					Dte: '(?:<[^<>]+?>(?=d))',
					Spl: '^(?:(?:{{Typ.M}}(?:({{Typ.Dec}})|({{Typ.Dte}})))?)({{Typ.Opt}})$',
					"":  '(?:(?:{{Typ.M}}(?:{{Typ.Dec}}|{{Typ.Dte}}))?){{Typ.Opt}}',
					G: 	 '({{Typ}})',
				},
				Opts: 	{
					Prm:  FRMT_OPTS.Params,
					Mod:  FRMT_OPTS.Modify + '(?={{Opts.Prm}})',
					Key:  '(?:(?:{{Opts.Mod}}.)[\\/])',
					Val:  '{{Opts.Key}}(?:<|}|])|>)*',
					"":   '((?:[|]{{Opts.Val}})*)',
					Non:  '(?:[|]{{Opts.Val}})*',
					One:  '^[|]({{Opts.Mod}})({{Opts.Prm}}?)[\\/](.*)$',
				},
				// *******************************************************
					// *************** PADDING ***************************
					// ***************************************************
					// 	Example: #+5-{#>2}{#<}
					// 		 . + |  5  |  -  | #>2 | # <
					// 		 (1) | (2) | (3) | (4) | (5)
					// ***************************************************
					// 1: [Optional] Pad Character (Default: ' ' [space])
					// 2: [Required] Padding Amount (Threshold)
					// 3: [Optional] Pad at the End instead of the Start
					// 4: [IterOnly] Only items w/ an Index (#) > 2
					// 5: [IterOnly] Only items w/ an Index (#) < Length
					// ***************************************************
				Pad: 	{
					Itr: '(<{/(?:\\d+|#)[<>]\\d*(?:,(?:\\d+|#)<[\\-+]?\\d*)?/}>)',
					Tmp: '<{/(?:\\d+|#)[<>]\\d*(?:,(?:\\d+|#)<[\\-+]?\\d*)?/}>',
					Non: '(?:(?:.\\+)?(?:\\d+|#)[\\-+]?(?:{{Pad.Tmp}})?)?',
					Num: '(?:(?:(.)\\+)?(#)([\\-+])?{{Pad.Itr}}?)?',
					Spl: '(?:(.?)\\+)?(\\d+|#)([\\-+]?)',
					"":  '((?:.\\+)?(?:\\d+|#)(?:[\\-+])?)?',
				},
				Pair: 	{
					"":  '((?:{{!.Non}}<(/[kv]<[({/.*/})]>/)>{{Typ}}|.)+?)',
					Opt: '{{Opts}}',
					Non: '(?:<[({/.*/})]>)?(?:{{Opts.Non}})?',
					Pad: '^({{!.Non}}<(/([kv]){{Pair.Non}}/)>){{Pad.Num}}{{Typ}}$',
				},
				List: 	{
					"":  '((?:<|||>)+)',
					Opt: '{{Opts}}',
				},
				Keys: 	{
					Wrd: '<[/(?:<|[{(|)}]|>+,?)+/]>',
					"":  '((?:[^\\[{(<|>)}\\]]+|{{Keys.Wrd}}))',
					Sub: '(?:(?:<<([\\w,]+)>>)?)',
					Opt: '{{Opts}}',
				},
				Each: {
					"":  "",
					BRK: '(?:\\((?:\\(.+?(?!\\))|[^\\(\\n])+?\\))|',
					CRL: '(?:\\{(?:\\{.+?(?!\\})|[^\\{\\n])+?\\})|',
					SQR: '(?:\\[(?:\\[.+?(?!\\])|[^\\[\\n])+?\\])|',
					NRM: '(?:{{Opts.Non}}[|])?',
					Itr: '<[({/(?:<|[{()}]|>+|.+)/})]>',
					Key: '<(/(?:[^\\[{(|)}\\]]+)/)>)+',
				},
			});

		// MATCHERS
			const FRMT_REG_Each = FRMT_REG._("/({{!.Non}}(?:{{Each+BRK+CRL+SQR+NRM}}){{Pad.Non}}{{Typ}})/g");
			const FRMT_REG_Nstr = FRMT_REG._("/([^\\\\]?)<<(\\w+)>>/g");
			const FRMT_REG_Pair = FRMT_REG._("/^{{!}}<{/{{Pair+Opt}}/}>{{Pad}}{{Typ.G}}$/");
			const FRMT_REG_List = FRMT_REG._("/^{{!}}<[/{{List+Opt}}/]>{{Pad}}{{Typ.G}}$/");
			const FRMT_REG_Norm = FRMT_REG._("/^{{!}}({{Each.NRM}}){{Pad}}{{Typ.G}}$/");
			const FRMT_REG_Keys = FRMT_REG._("/^{{!}}<(/{{Keys+Sub+Opt}}/)>{{Pad}}{{Typ.G}}$/");
			const FRMT_REG_Idxr = FRMT_REG._("/({{Pad.Tmp}})(?={{Typ}}$)/g");
			const FRMT_REG_PItr = FRMT_REG._("/{{Pair.Pad}}/");
			const FRMT_REG_Opts = FRMT_REG._("/(?:[|]({{Opts.Val}}))/g");
			const FRMT_REG_OptO = FRMT_REG._("/{{Opts.One}}/");
			const FRMT_REG_Pads = FRMT_REG._("/{{Pad.Spl}}/");
			const FRMT_REG_Typs = FRMT_REG._("/{{Typ.Spl}}/");

	/**
	 * A robust, _`printf`-style_ `String` formatter
	 * @see http://www.cplusplus.com/reference/cstdio/printf/
	 * @class FRMT
	 */
	class FRMT {
		/// CONSTRUCTOR /////////////////////////////////////////////////////////////////////////

			/**
			 * Creates an instance of FRMT.
			 * @param {FMTemplate[]} nests A collection of inner templates that the primary template will reference
			 * @param {boolean} debug If `true`, output debug information to the console
			 * @returns {FRMT}
			 * @memberof FRMT
			 */
			constructor(nests, debug) {
				if (this instanceof FRMT) {
					var THS = this;
					THS.DEBUG 	= debug || false;
					THS.NESTS 	= nests || {};
					DEFINE(THS, { LOGR: HIDDEN(THS.LOGS()) });
				} else { return new FRMT(nests, debug); }
			}

		/// CONSTANTS ///////////////////////////////////////////////////////////////////////////

			get MODS 	() { return FRMT_MODS; 	   }
			get OPTNS 	() { return FRMT_OPTS; 	   }
			get FNTS 	() { return FRMT_FNTS; 	   }
			get TYPS 	() { return FRMT_TYPS; 	   }
			// Patterns
			get REG 	() { return FRMT_REG; 	   }
			get Nstr 	() { return FRMT_REG_Nstr; }
			get Idxr 	() { return FRMT_REG_Idxr; }
			get Each 	() { return FRMT_REG_Each; }
			get Pair 	() { return FRMT_REG_Pair; }
			get List 	() { return FRMT_REG_List; }
			get Norm 	() { return FRMT_REG_Norm; }
			get Keys 	() { return FRMT_REG_Keys; }
			get PItr 	() { return FRMT_REG_PItr; }
			get Opts 	() { return FRMT_REG_Opts; }
			get OptO 	() { return FRMT_REG_OptO; }
			get Pads 	() { return FRMT_REG_Pads; }
			get Typs 	() { return FRMT_REG_Typs; }

		/// COLLECTIONS /////////////////////////////////////////////////////////////////////////

			LOGS() {
				var THS = this,
					T = (name, prm, val, res) => {
						console.log.apply(console, [
							"\n%s: %s", name, JSON.stringify({ prm: prm, val: val, res: res }, null, '\t')
						]);
					},
					F = () => { return false; },
					tru = { O: T, L: T, N: T, K: T },
					fls = { O: F, L: F, N: F, K: F },
					pck = { true: tru, false: fls }, res;

				if (THS.DEBUG instanceof Array) {
					res = fls;
					for (let f = 0; f < THS.DEBUG.length; f++) {
						var choice = THS.DEBUG[f];
						switch (true) {
							case !!choice.match(/^O$/i): res.O = T; break;;
							case !!choice.match(/^L$/i): res.L = T; break;;
							case !!choice.match(/^N$/i): res.N = T; break;;
							case !!choice.match(/^K$/i): res.K = T; break;;
						}
					}
				} else { res = ( THS.DEBUG in pck ? pck[THS.DEBUG] : pck.false); }
				return res;
			}
			get IDX () { return {
				Get  (text, i, itr) {
					var THS = this, len = itr.length;
					return 	text.toString().replace(THS.Each, (mch, item) => {
						return item.replace(THS.Idxr, (mch, idx) => {
								return 	idx.replace(/#/g, i)
											.replace(/>(?=,|\})/, ">0")
											.replace(/<([\\-+]\d+)(?=\})/, (mch, num) => {
												return '<'+(len + parseInt(num));
											})
											.replace(/<(?=\})/, "<"+(len-1));
							});
					});
				},
				'>': function (amt, idx, num) { return parseInt(idx) > parseInt(num) ? amt : 0; },
				'<': function (amt, idx, num) { return parseInt(idx) < parseInt(num) ? amt : 0; },
				'&': function (amt, mch) {
					return 	(parseInt(mch[1]) > parseInt(mch[2])) &&
							(parseInt(mch[3]) < parseInt(mch[4])) ? amt : 0;
				},
				Set  (text, pads) {
					var THS = this, itr,
						pad = pads.pad,
						amt = pads.amt,
						rev = pads.rev;
					if (!!itr) {
						if (itr.indexOf(',') > -1) {
							var mch = itr.match(/^\{(\d+)>(\d*),(\d+)<(\d*)\}$/);
							if (!!mch) amt = THS.IDX['&'](amt, mch);
						} else {
							var mch = itr.match(/^\{(\d+)([<>])(\d*)\}$/);
							if (!!mch) amt = THS.IDX[mch[2]](amt, mch[1], mch[3]);
						}
					}
					return !!amt ? text.pad(pad, amt, rev, pads.log) : text;
				},
			};	}
			get PADS() { return {
				O  (dct, format) {
					var THS = this,
						keys = dct.keys.slice(0),
						vals = keys.map((ke, y) => { return dct.vals[ke]; }),
						Lens = { k: keys.max(), v: vals.max() };
					return format.replace(THS.Each, (match, ptrn) => {
						return ptrn.replace(THS.PItr, (mch, frm, wch, pad, amt, rev, idx) => {
							return !!amt ? frm+(!!pad?pad+'+':'')+Lens[wch]+(rev||"")+(idx||"")+"s" : mch;
						});
					});
				},
				L  (lst, format) {
					var THS = this, Len = lst.sort((a, b) => { return a.length > b.length ? a : b; })[0].length
					return format.replace(THS.REG._("/([^\\])(#)(?=[\\-+]?<||]|>.*s$)/"), "$1"+Len);
				},
				Rndr  (pads, opts) {
					var THS = this, pad = pads.pad, amt = pads.amt, rev = pads.rev, idx = [];
					return "%!"+(!!pad?pad+'+':'')+(amt||'')+(rev||'')+"s";
				},
			};	}
			get FLTR() { return {
				O: {
					true   (v, k) { return !!k.toString().replace(/(%#\d+)/g, "").length && !!v; },
					false  (v, k) { return  true; },
				},
				L: {
					true   (val) { return !!val; },
					false  (val) { return  true; },
				}
			};	}

		/// PRIVATES ////////////////////////////////////////////////////////////////////////////

			/**
			 * 
			 * @type {{Obj:function,Lst:function,Nrm:function,Key:function}}
			 * @readonly
			 * @memberof FRMT
			 */
			get Find() {
				var THS = this;
				return {
					/**
					 * Finds the next `Object` literal to insert into the template
					 * @param {FMCounts} cnts The `FMCounts` object
					 * @param {FMGroups} grps The `FMGroups` object
					 * @param {boolean} strict The `FMStrict` flag
					 * @param {FMType} typ The `FMtype` flag
					 * @returns {DCT|Immutable.Map} The next `Object` literal
					 */
					Obj  (cnts, grps, strict, typ) {
						cnts.obj++; var res = [], obj = (grps.obj[cnts.obj] || {});
						if (!!!obj.map) obj = Imm.Map(obj);
						return obj.filter(THS.FLTR.O[!!strict]);
					},
					/**
					 * Finds the next `Array` list to insert into the template
					 * @param {FMCounts} cnts The `FMCounts` object
					 * @param {FMGroups} grps The `FMGroups` object
					 * @param {boolean} strict The `FMStrict` flag
					 * @param {FMType} typ The `FMtype` flag
					 * @returns {[]} The next `Array` list
					 */
					Lst  (cnts, grps, strict, typ) {
						cnts.lst++; var res = [];
						return (grps.lst[cnts.lst] || []).filter(THS.FLTR.L[!!strict]);
					},
					/**
					 * Finds & formats the next `String|Number` to insert into the 
					 * template. This is the end of all template variables.
					 * @param {string|number} mch A value to replace or format; if applicable
					 * @param {FMCounts} cnts The `FMCounts` object
					 * @param {FMGroups} grps The `FMGroups` object
					 * @param {boolean} strict The `FMStrict` flag
					 * @param {FMType} typ The `FMtype` flag
					 * @returns {string} The formatted `String`
					 */
					Nrm  (mch, cnts, grps, strict, typ) {
						cnts.str++; var val = grps.str[cnts.str]||mch,
										raw = typ.cls=='r', iss=ISS(val),
										its = raw||IS(val)[THS.TYPS[typ.cls]];
						// Filter Empty/Bad-Types
						val = (val != mch && its ? val : (!!strict ? '' : val));
						// Parse Numbers
						switch (typ.cls) {
							case 'i': val = parseInt(val).toString(); break;;
							case 'f': val = parseFloat(val).toFixed(typ.dec).toString(); break;;
							case 'd': val = StrTime(typ.dte, new Date(val)); break;;
						}
						// Enclose; if necessary
						if (raw) switch (iss) {
							case   'string': val = `"${val}"`;  break;;
							case  'boolean': val = Number(val); break;;
							case      'raw': val = `${val}`.replace(/^\/(.+)\/$/,'$1'); break;;
							case 'function': val = val(); break;;
							case   'symbol': val = val.toString(); break;;
						}
						return val;
					},
					/**
					 * Finds the next set of named variable to insert into the template 
					 * @param {string} txt The name variable `String`
					 * @param {string|number} mch The full name template variable
					 * @param {FMGroups} grps The `FMGroups` object for named variables
					 * @param {boolean} strict The `FMStrict` flag
					 * @param {FMType} typ The `FMtype` flag
					 * @returns {FMKeyVal} The formatted `String`
					 */
					Key  (txt, mch, grp, strict, typ) {
						var rslt = { emp: [], key: [], val: [], cnt: 0 }, keys = [];
						if (txt.match(THS.REG._("/^{{Keys.Wrd}}$/"))) {
							keys = txt.replace(THS.REG._("/^\\[(.*)\\]$/"), "$1").split(",")
						} else { keys = [txt]; }
						for (let k = 0; k < keys.length; k++) {
							var key = keys[k];
							if (grp.hasOwnProperty(key)) {
								var val = grp[key], emp = THS.Empty(val);
								rslt.key.push(key); rslt.emp.push(emp);
								rslt.val.push(!emp ? val : (!!strict ? '' : mch));
								rslt.cnt++;
							};
						}; 	return !!rslt.cnt ? rslt : {
							emp: [true], key: [keys[0]], val: [keys[0]], cnt: 1
						};
					},
				}
			}

			Options(opts) {
				var THS = this,
					res = THS.OPTNS.Struct.toJS(),
					mch = opts.match(THS.Opts) || [];
				mch.map((mc, h) => {
					var m = mc.match(THS.OptO), k = m[1], s = m[2], v = m[3];
					if (!!k) if (!!!s) res[k] = v; else res[k][s] = v;
				}); return res;
			}
			Types(typs) {
				var THS = this, mch = typs.match(THS.Typs),
					def = '%d/%m/%y-%I:%M:%S%p',
					evl = '%Y%m%d%H%M%S';
				return !!mch ? {
					opt: mch[0],
					dec: parseInt(mch[1] || 0),
					dte: (mch[3]=='r' ? evl : mch[2] || def)
							.replace(/\$/g, '%')
							.replace(/^<?(.*?)>?$/m, '$1'),
					cls: mch[3],
				} : { opt: typs, dec: 0, cls: 's' }
			}
			Paddings(pads) {
				var THS = this, mch = (pads||'').match(THS.Pads) || [],
					res = { pad: mch[1] || '', amt: mch[2] || 0, rev: mch[3] };
				return res;
			}
			Replace(text, opt) {
				if (!!opt) {
					var val = opt.replace(/\/{2}/g, ''),
						spl = val.match(/^(.*)\/(?!\/)(.*)$/),
						pat = spl[1], rep = spl[2];
					return text.replace(new RegExp(pat, 'g'), rep);
				} else { return text }
			}
			Empty(val) {
				var THS = this;
				return !!!(val||'').toString().replace(/(%#\d+)/g, "");
			}
			Case(text, cases) {
				var THS = this; cases = cases || '';
				switch (true) {
					case !!cases.match(/^U$/i): return text.toUpperCase(); break;;
					case !!cases.match(/^L$/i): return text.toLowerCase(); break;;
					case !!cases.match(/^T$/i): return text.toTitleCase(); break;;
					case !!cases.match(/^S$/i): return text.toSentenceCase(); break;;
					default: return text;
				}
			}
			Font(text, font) {
				var THS = this, ret = text, fnt = THS.FNTS,
					exs = (which, val) => {
						var bg = which == 'backg' ? '(?:bg)?' : '',
							res = (fnt[which]||'').match(
								THS.REG._('/[|]('+bg+(val||'')+')[|]/i')
							);
						return !!res ? (res[1] || '') : '';
					},
					clr = exs('color', font.C), bkg = exs('backg', font.B),
					sty = exs('style', font.S), fon = exs('fonts', font.F);
				if (!!fon.length) ret = colors[fon](ret);
				if (!!clr.length) ret = colors[clr](ret);
				if (!!bkg.length) ret = colors[bkg](ret);
				if (!!sty.length) ret = colors[sty](ret);
				return ret;
			}
			Close(text, pfx, sfx, key) {
				var THS = this, fmt = '%s', ea = THS.Each,
					rep = (m, p)=>THS._(p,key||fmt), 
					sym = text => { let ret = text.toString();
						return !TYPE(text, Symbol) ? ret :
							ret.replace(/^Symbol\((.+)\)$/,'$1');
					}, fnd = /\|\/\//g, P = '|', res = '';
				pfx = (pfx||'').replace(fnd,P).replace(ea,rep);
				sfx = (sfx||'').replace(fnd,P).replace(ea,rep);
				return pfx+sym(text)+sfx;
			}
			KVs(ArgS) {
				var THS = this, is = (ArgS.length == 1) && (ArgS[0] instanceof Object) && !(ArgS[0] instanceof Array);
				return !!is ? ArgS[0] : null;
			}
			Nest(key) {
				var THS = this, res = '', keys = (key||'').split(',');
				keys.map( (ke, y) => {
					if (!!THS.NESTS[ke]) res += THS.NESTS[ke];
				});
				return res || '%s';
			}
			Delimit(res, opts, pads) {
				var THS = this;
				if (!!!Object.keys(res).length) return '';
				if (!(res instanceof Array)) res = res.toArray() || [];
				// --
				var delim  = opts[THS.MODS.DLM],
					endlim = opts[THS.MODS.ELM],
					blim =  !!delim ? '('+delim : '',
					elim =  !!endlim ? '|'+endlim+')' : ')',
					dlim =  !!blim ? '(\\s+)'+blim+elim+'(?=\\n)?' : '',
					lims =  THS.REG._('/'+(!!dlim ? dlim : '$^')+'/g'),
					rslt =  THS.Finalize(
						(	res.length > 1 ?
							[res.slice(0, -1).join(delim)]
								.concat(res.slice(-1)[0]) :
							res
						).join(endlim || delim),
						opts, pads
					).replace(lims, (match, wspce, delim) => {
						return (delim||'')+(wspce||'');
					});
				return rslt;
			}
			Finalize(text, opts, pad, key) {
				var THS = this;
				return THS.Close(
					THS.Replace(
						THS.Font(
							THS.Case(
								THS.IDX.Set(text, pad),
								opts[THS.MODS.CSE]
							), opts[THS.MODS.CLR]
						), opts[THS.MODS.REP]
					), opts[THS.MODS.PFX],
					opts[THS.MODS.SFX],
					key
				);
			}

		/// PUBLICS /////////////////////////////////////////////////////////////////////////////

			/**
			 * Formats a `String` with a _`printf`-style_ template and given arguments.
			 * @param {FMTemplate} template A _`printf`-style_ template ()
			 * @param {...any} VARS The values to inster into the template. The last argument can be an `Object.<string,any>` for named variable. 
			 * @returns {string} The formatted `String`
			 * @memberof FRMT
			 */
			_(template, ...VARS) {
				let THS = this,
					KVPS = null,
					TEMP = template,
					CNTS = { str: -1, lst: -1, obj: -1 },
					GRPS = {
						str: VARS.filter((ar, g) => {
							return ar instanceof RegExp || !(
								ar instanceof Array || (!(ar instanceof Date) && typeof(ar) == 'object')
							);
						}),
						lst: VARS.filter((ar, g) => { return ar instanceof Array; }),
						obj: VARS.filter((ar, g) => {
							return !(ar instanceof Array||ar instanceof RegExp) && (typeof(ar) == 'object');
						}),
					},
					ITR = (fmt, which) => {
						return {
							obj  (v, k) { return THS._(fmt, { k: k, v: v }); },
							lst  (l, s) { return THS._(fmt, l); },
						}[which].bind(THS);
					},
					DEFS = (format) => { return {
						mch: '', key: '',
						pad: THS.Paddings.bind(THS),
						fmt: !!format ? THS.Nest.bind(THS) : '%s',
						stc: Boolean,
						opt: THS.Options.bind(THS),
						typ: THS.Types.bind(THS),
					};	};

				// Hide New Lines
				template = template.replace(/(\n)/g, "\\n");

				// Handle Formats
				template = 	template.replace(THS.Each, (match, pattern) => {
					var pos = VARS.slice(-2, -1),
						res = pattern
							// Handle Dictionary Formats
							.replace(THS.Pair, preARGS(function handleDict(mch, stc, fmt, opt, pad, typ) {
								var res = '', obj = THS.Find.Obj(CNTS, GRPS, stc, typ);
								res = THS.Delimit(obj.map(ITR(fmt, 'obj')), opt, pad);
								THS.LOGR.O('OBJ', this['@'], obj, res); return res;
							}, DEFS()))
							// Handle List Formats
							.replace(THS.List, preARGS(function handleList(mch, stc, fmt, opt, pad, typ) {
								var res = '', lst = THS.Find.Lst(CNTS, GRPS, stc, typ);
								res = THS.Delimit(lst.map(ITR(fmt, 'lst')), opt, pad);
								THS.LOGR.L('LST', this['@'], lst, res); return res;
							}, DEFS()))
							// Handle Generic Formats
							.replace(THS.Norm, preARGS(function handleNorm(mch, stc, opt, pad, typ) {
								var val = THS.Find.Nrm(mch, CNTS, GRPS, stc, typ),
									res = THS.Finalize(val, opt, pad);
								THS.LOGR.N('NRM', this['@'], val, res); return res;
							}, DEFS()));

					// Handle Named Formats
					KVPS = THS.KVs(VARS);
					if (!!KVPS) {
						res = res.replace(THS.Keys, preARGS(function handleKVs(mch, stc, key, fmt, opt, pad, typ) {
							var fnd = THS.Find.Key(key, mch, KVPS, stc, typ), res = '', val = '';
							fmt = fmt.replace(/^%s$/, "%"+typ.opt)
							for (let f = 0; f < fnd.cnt; f++) {
								var emp = fnd.emp[f], key = fnd.key[f], vl = fnd.val[f];
								this['@'].emp = emp && stc;
								res += emp && stc ? '' : THS.Finalize(THS._(fmt, vl), opt, pad, key);
							};	THS.LOGR.K('KEY', this['@'], val, res); return res;
						}, DEFS(true)));
					}

					// Return
					return res;
				});

				// Re-Add New Lines, Dup Index & Return
				return  template.replace(/\\n/g, "\n")
								.replace(/(%#\d+)/g, "")
								.replace(/(\D)\/{2}/g, "$1");
			}
			ie() {
				var frm = new FRMT_({
						'Names': 	"%(first)s %(middle)s %(last)s",
						'Formal': 	"%{%(k)s: '%(v)s|,' }s",
						'Planets': 	"%[%16{#>}s|, \\n\t| & \\n\t]s",
					}),
					tmp = 	(
						"\t%s, to the %![%s|, the | and the ]s!\n" +
						"\tAs well as to; \n\t%!{%(k)s. %(v<<Names>>)s| & \\n\t}s!\n" +
						"\tOf course, let's not forget our...\n\t%!{%(k)s; %(v<<Planets>>)s}s!\n"
					),
					val = [ 'hello', [ 'world', 'moon', '', 'stars'
						], { Mr:  { first: 'Arian', 	  middle: 'LeShaun',   last: 'Johnson' },
							 Ms:  { first: 'LindyAnn', middle: 'Christina', last: 'Ephraim' },
						}, { Mr:  { first: 'Arian', 	  middle: 'LeShaun',   last: 'Johnson' },
							 Ms:  { first: 'LindyAnn', middle: 'Christina', last: 'Ephraim' },
						}, { planets: [ 'Mercury', 'Venus', 'Mars', 'Saturn',
										'Jupiter', 'Uranus', 'Neptune', 'Pluto'
					]}],
					res = frm._.apply(frm, [tmp].concat(val)).toTitleCase(),
					arg = JSON.stringify(val, null, '    ').replace(/^(.+)$/gm, '\t$1');
				console.log("TEMP: %s\nARGS: %s\nRSLT: %s", tmp, arg, res); return res;
			}
	}


/////////////////////////////////////////////////////////////////////////////////////////////
// Text Columns

	/////////////////////////////////////////////////////////////////////////////////////////
	// COLUMN (SINGLE)
		class CLM { constructor(lst, num, title) {
			var res = new String(lst.join('\n'));

			function props (val) {
				return {
					enumerable: false, configurable: false,
					writable: true, value: val
				};
			}

			Object.defineProperty(res, "_", props(lst));
			Object.defineProperty(res, "lines", props(lst.length));

			return res;
		}	}

	/////////////////////////////////////////////////////////////////////////////////////////
	// COLUMNS (MULTIPLE)

		class CLMNS {
			/// COLUMNS.PUBLISH /////////////////////////////////////////////////////////////////////
				constructor(txt, delim, suffix, log) {
					var THS = this, SHL = [];

					function props (val) {
						return {
							enumerable: false, configurable: false,
							writable: true, value: val
						};
					}

					// PROPERTIES
						DEFINE(THS, {
							DLM: props(THS.clean(delim, '\t', true)),
							SFX: props(THS.clean(!!suffix ? delim : '')),
						});
						DEFINE(THS, {
							TXT: props(THS.fresh(txt)),
							LOG: props(!!log),
							OBJ: props({}),
							IDX: props(-1),
							MCH: props([]),
							LNE: props(txt.lines),
						});
						DEFINE(THS, {
							RGX: props(new RGX({
								DLM: { Ky: THS.DLM, Fr: THS.limit(THS.DLM) },
								LFT: "(?:(^(?:{{DLM.Fr}}{{DLM.Ky}})",
								RGT: ")({{DLM.Fr}}(?={{DLM.Ky}})))",
							})),
						});

					// CREATION
						SHL = (txt.match(/(?=\n)/g) || []).concat(['']);
						while (THS.group()) {
							var K = (THS.IDX+1); THS.OBJ[K] = THS[K] = THS.MCH.join('\n') //CLM(K, THS.MCH);
							// console.log(THS[K]);
						};
						// if (THS.LOG) console.log("CLMNS: %s", JSON.stringify(this, null, '    '));

					// INFORMATION
						DEFINE(THS, {
							CNT: props(Object.keys(THS.OBJ).length),
							IMM: props(Imm.Map(THS.OBJ)),
						});
						DEFINE(THS, {
							DRC: props(THS.getDirects()),
							SHL: props(SHL),
						});
				}

			/// COLUMNS.MEMBERS /////////////////////////////////////////////////////////////////////

				get 0 		 () { return this.OBJ[0]; }
				get count 	 () { return this.CNT; 	  }
				get lines 	 () { return this.LNE; 	  }

				get shell 	 () { return this.SHL; 	  }
				get directs  () { return this.DRC; 	  }
				set directs  (obj) {
					try {
						if (obj.hasOwnProperty('*')) {
							this.DRC = this.getDirects(obj['*']);
						} else {
							this.DRC = Assign(this.DRC, obj);
						}
					} catch (e) {  }
				}

			/// COLUMNS.PRIVATES ////////////////////////////////////////////////////////////////////

				fresh(val) {
					// ------
					var THS = this,TX = val.toString(), RB = null, RA = null, MD = 0, DF = '';
					// if (THS.DLM != '\t') console.log(TX.match(/^(.*)$/gm))
					// ------
					RB = new RegExp('^(|['+THS.DLM+'].*)$',  'gm');
					RA = new RegExp('^(|.*[^'+THS.DLM+'])$', 'gm');
					TX = TX.replace(RB, ' $1').replace(RA, '$1'+THS.DLM);
					// if (THS.DLM == '\t') console.log(TX.match(/^(.*)$/gm))
					// ------
					MD =  TX.match(/^(.*)$/gm)
							.max(v => {
								return v.appears(THS.DLM);
							});
					DF = ' '+THS.DLM;
					TX = TX.replace(/^.*$/gm, $0 => {
						var ct = $0.appears(THS.DLM),
							dl = DF.dup((MD-ct)+1);
						return $0 + dl;
					});
					// if (THS.DLM != '\t') console.log(TX.match(/^(.*)$/gm))
					// ------
					return TX;
				}
				clean(val, def, slash) {
					var THS = this,
						res = (val || def || ''), rep = "$1\\$2",
						reg = /([^\\]|^)([({\[.+\-*?^$\/\]})])/g;
					return !!slash ? res.replace( reg, rep ): res;
				}
				limit(val) {
					var THS = this,
						reg = /(\x1b\[\d+m|\\.|.)/g,
						mch = (val.match(reg)||[]),
						fst = mch[0] || '',
						lst = mch.length > 1 ?
							  ('|'+fst+'(?!' +
							  	mch.slice(1).join('') +
							  ')') :
							  '',
						res = '(?:' +
							'[^'+(fst || val)+'\\n]' + lst +
						')*';
					return res;
				}
				regex(idx) {
					var THS = this, ndex = parseInt(idx||0);
					// if (THS.LOG) console.log(THS.RGX._("/{{LFT}}{"+ndex+"}{{RGT}}/gm"))
					return THS.RGX._("/{{LFT}}{"+ndex+"}{{RGT}}/gm");
				}
				group() {
					// ---
					var THS = this, reg, i = 0, ketch; THS.IDX++; THS.MCH = THS.shlls();
					reg = THS.regex(THS.IDX); ketch = THS.TXT.match(reg);
					// ---
					THS.TXT.replace(reg, ($0, $1, $2, len, txt) => {
						THS.MCH[i] = $2; i++; return '';
					});
					// if (THS.LOG) console.log("C%d: %s", THS.IDX+1, JSON.stringify(THS.MCH, null, '    '));
					// ----
					return !!THS.MCH.filter(m => { return !!m; }).length;
				}
				shlls() {
					var THS = this;
					return new Array(THS.LNE).join('\n')
											 .split('\n');
				}

			/// COLUMNS.FUNCTIONS ///////////////////////////////////////////////////////////////////

				map(cb) { return this.IMM.map(cb); }
				getDirects(delim) {
					var THS = this,
						jns = UoN(delim) ? '+' : (delim || ','),
						spl = jns == ',' ? ',' : '';
					var arr = new Array(THS.CNT+2).join(jns).split(spl),
						res = Imm.List(arr).toKeyedSeq().toObject();
					delete res[0]; return res;
				}
				distribute(align, border, callback) {
					var THS = this, callback; border = border || ' ';

					// DEFAULTS
						THS.directs = align;
						callback = callback || function (val) { return val._; }

					// PRIVATES
						function form (cols, cllbck, level) {
							var res = cols.shell;
							// -----
							cols.map((V, K) => {
								// -----
								var Y = parseInt(K), R = THS.directs[Y],
									P = cllbck(V).toLines(), H = P.max();
								// -----
								res = res.map((re, s) => {
									return re+border+(!!P[s] ? P[s].pad(' ', H, R, THS.LOG) : '');
								});
							});
							// -----
							return (res.join(border+'\n')+border);
						}

					return form(this, callback, 1);
				}
		}

/////////////////////////////////////////////////////////////////////////////////////////////
// PolyFills

	/// ARRAYS //////////////////////////////////////////////////////////////////////////////
		// MAXIMUM ITEM
			if (!Array.prototype.hasOwnProperty('max')) {
				Object.defineProperty(Array.prototype, 'max', {
					enumerable: false, configurable: false, writable: false,
					value  (by) { return TOP(this, by, false); },
				});
			}
		// MINIMUM ITEM
			if (!Array.prototype.hasOwnProperty('min')) {
				Object.defineProperty(Array.prototype, 'min', {
					enumerable: false, configurable: false, writable: false,
					value  (by) { return TOP(this, by,  true); },
				});
			}
		// HAS ITEM
			if (!Array.prototype.hasOwnProperty('has')) {
				Object.defineProperty(Array.prototype, 'has', {
					enumerable: false, configurable: false, writable: false,
					value  (val) {
						var ths = this; return !Array.isArray(val) ? ths.indexOf(val) > -1 :
						val.filter(v => { return ths.indexOf(v)>-1 }).length > 0;
					},
				});
			}
		// REPEAT ITEMS
			if (!Array.prototype.hasOwnProperty('repeat')) {
				Object.defineProperty(Array.prototype, 'repeat', {
					enumerable: false, configurable: true, writable: true,
					value  (match, strict) {
						let ths = this, M = match, A = ISS(M), N, C, L;
						if (!['array','number','numeric'].has(A)) return;
						N = Array.of(...(!!ths.length?ths:[undefined]));
						L = (A=='array'?M.length:Number(M));
						C = N.length; L = !!strict?L:L>C?L:C;
						while (N.length < L) N = N.concat(N);
						return N.slice(0, L);
					},
				});
			}

	/// STRINGS /////////////////////////////////////////////////////////////////////////////
		// DISTIJNCT
			if (!String.prototype.hasOwnProperty('distinct')) {
				Object.defineProperty(String.prototype, 'distinct', {
					enumerable: false, configurable: false, writable: false,
					value () {
						var text = String(this),
							args = ARGS(arguments).join('\\'),
							dups = new RegExp('[^\\'+args+']+', 	 'g'),
							rest = new RegExp('([\\'+args+'])\\1+','g');
						return 	this.replace(dups, '')
									.split('').sort().join('')
									.replace(rest, '$1');
					}
				})
			}
		// COLOR 4 REGEX
			const clrs 	= {
				opn: '(\\x1b\\[(?:'+[
					0,1,2,'3[0-7]?','4[0-7]?',7,8,'9[0-7]?',
				].join('|')+')m)',
				cls: '(\\x1b\\[(?:'+[
					22,23,24,27,28,29,39,49
				].join('|')+')m)',
			};
			if (!String.prototype.hasOwnProperty('colored')) {
				Object.defineProperty(String.prototype, 'colored', {
					enumerable: false, configurable: false, writable: false,
					value (opts) {
						let ths = this; opts = Imm.Map(opts || {});
						opts.map((v, k) => {
							let reg, ptn = '', opt = '', mch = [],
								clr = clrs.opn+'?', idx = 2;
							switch (true) {
								case v instanceof RegExp: v = v.toString(); break;;
								case v instanceof Array:
									 v = '('+v.join('').match(/([^\/]+)(?=\/[gmi])/g).join('|')+')';
									 break;;
								case typeof(v) === 'object' &&
									 v.hasOwnProperty('/') && v.hasOwnProperty('$'):
									 idx = v['$']+1; v = v['/'].toString();
									 break;;
							}
							mch = v.match(/^\/?(.+?)(?:\/([gmi]+))?$/);
							ptn = clr+(mch[1] || '([^\S\s])');
							opt = mch[2] || 'g';
							reg = new RGX()._('/'+ptn+'/'+opt);
							ths = ths.replace(reg, (...params) => {
								let args  =  params.map((p,i)=>p||'').slice(0, -2), 
									aft = args.length > idx ? args.slice(idx+1).join('') : '',
									bfr = idx > 2 ? args.slice(2, idx).join('') : '',
									clr = args[1], mid = args[idx];
								return bfr+mid[k]+aft+clr
							});
						});
						return ths;
					}
				})
				Object.defineProperty(String.prototype, 'inColor', {
					enumerable: false, configurable: false, writable: false,
					value (lft, rgt) {
						var opn = clrs.opn, cls = clrs.cls,
							reg = '('+opn+'((?:[^\\x1b\\n]+?)?)'+cls+')';
						lft = lft || '{'; rgt = rgt || '}';
						return this.replace(
							new RegExp(reg, 'g'),
							(mch, $1, $2, $3, $4) => {
								return 	$2+lft+
											$2.replace(/\x1b\[(\d+)m/g, '$1')+
										'|'+$4+
										($3||'')+
										$2+'|'+
											$4.replace(/\x1b\[(\d+)m/g, '$1')+
										rgt+$4
							}
						)//.replace(/^(\x1b)(\[\d+m)$/, '\x1b$2{}\x1b[0m');
					}
				})
			}
		// TEXT APPEARANCES
			if (!String.prototype.hasOwnProperty('appears')) {
				Object.defineProperty(String.prototype, 'appears', {
					enumerable: false, configurable: false, writable: false,
					value (char) {
						var reg = new RegExp(char, 'g');
						return (this.match(reg) || []).length;
					}
				})
			}
		// REAL LENGTH
			if (!String.prototype.hasOwnProperty('len')) {
				Object.defineProperty(String.prototype, "len", {
					get  () { return this.replace(/\x1b\[\d+m/g, "").length; }
				});
			}
		// HIDDEN COUNT
			if (!String.prototype.hasOwnProperty('hideCnt')) {
				Object.defineProperty(String.prototype, "hideCnt", {
					get  () { return (this.match(/(\x1b\[\d+m)/g) || []).length; }
				});
			}
		// HAS (CONTAINS)
			if (!String.prototype.hasOwnProperty('has')) {
				Object.defineProperty(String.prototype, 'has', {
					enumerable: false, configurable: false, writable: false,
					value (text) { return (String.prototype.indexOf.apply(this, [text]) > -1); }
				})
			}
		// DUPLICATE
			if (!String.prototype.hasOwnProperty('dup')) {
				Object.defineProperty(String.prototype, 'dup', {
					enumerable: false, configurable: false, writable: false,
					value (amount) { return new Array(amount).join(this); }
				})
			}
		// INDENT
			if (!String.prototype.hasOwnProperty('indent')) {
				Object.defineProperty(String.prototype, 'indent', {
					enumerable: false, configurable: false, writable: false,
					value (count, chr, from) {
						var txt = (this.toString() || ''),
							tab = (chr || '\t').dup(count || 1),
							frm = (from || 1),
							lne = txt.match(/^(.*)$/gm) || [],
							fst = (lne[0] ? lne[0] : ''),
							rst = (lne[frm] ?  lne.slice(frm).join('\n')
												.replace(/^(.*)$/gm, tab+'$1')
												.split('\n') :
								   []);
						return [fst].concat(rst).join('\n');
					}
				})
			}
		// PADDING
			if (!String.prototype.hasOwnProperty('pad')) {
				Object.defineProperty(String.prototype, 'pad', {
					enumerable: false, configurable: false, writable: false,
					value (pad, amount, direct, log) {
						var ths = this.toString(), len = ths.length, rln = ths.len,
							rmd = ths.hideCnt, reg = /(\x1b\[\d+m|.)/g,
							dir = UoN(direct, '+');
						pad = pad || ' '; amount = parseInt(amount);
						// ------
						function DoLog (which, what) {
							if (!!log) console.log("\n%s: %s\n", which, JSON.stringify(what, null, '    '));
						}
						// ------
						if (!!amount && amount >= rln) {
							var amt = Math.abs(amount),
								bse = new Array(amt).join(pad).split(""),
								mch = ths.match(reg).reverse(),
								arr = {
									"-": function () {
										var slc = rln == 0 ? 0 : rln - 1;
										DoLog('BFORE', { PAD: pad, AMT: amount, DIR: direct, TXT: ths });
										return mch.concat( bse ).reverse().slice( slc ).join('');
									},
									"":  function () {
										var slc = amt + rmd, cut = slc - rln,
											hlf = Math.round(cut / 2), spl = bse.slice(0, cut),
											lft = spl.slice(0, hlf), rgt = spl.slice(hlf);
										DoLog('MIDDL', { PAD: pad, AMT: amount, DIR: direct, LFT: lft, RGT: rgt, TXT: ths });
										return lft.concat( mch, rgt ).reverse().join('');
									},
									"+":  function () {
										var slc = amt + rmd;
										DoLog('AFTER', { PAD: pad, AMT: amount, DIR: direct, TXT: ths });
										return bse.concat( mch ).reverse().slice( 0, slc ).join('');
									},
								};
							return arr[dir]();
						} else if (ths.has(' ')) {
							switch (dir) {
								case '-': 	DoLog('LBFOR', { PAD: pad, AMT: amount, DIR: direct, TXT: ths });
									return 	ths.replace(/^( *)((?: ?[^ ]+)+)( +(?= ))( ?)$/, ($0, $1, $2, $3, $4) => {
												DoLog('LBREP', { Issue: "I don't know, but it's here..." });
												return ($1+$3+$2+$4)//.replace(/ /g, "-");
											});
								case '+': 	DoLog('LAFTR', { PAD: pad, AMT: amount, DIR: direct, TXT: ths });
									return 	ths.replace(/^( )( {2,})((?:[^ ]+ ?)+)( *)$/, ($0, $1, $2, $3, $4) => {
												return ($1+$3+$2+$4)//.replace(/ /g, "+");
											});
								default: return ths;
							}
						} else {
							DoLog('LMIDL', { PAD: pad, AMT: amount, DIR: direct, TXT: ths });
							return 	ths;
						}
					}
				})
			}
		// SENTENCE-CASE
			if (!String.prototype.hasOwnProperty('toSentenceCase')) {
				Object.defineProperty(String.prototype, 'toSentenceCase', {
					enumerable: false, configurable: false, writable: false,
					value () {
						return this.replace(/^((?:\s+)?)([a-z])(.*)/, (match, begin, first, rest) => {
							return begin+first.toUpperCase()+rest;
						});
					}
				})
			}
		// TITLE-CASE
			if (!String.prototype.hasOwnProperty('toTitleCase')) {
				Object.defineProperty(String.prototype, 'toTitleCase', {
					enumerable: false, configurable: false, writable: false,
					value () {
						return this.replace(/(^|[^\w])([a-z])/g, (match, begin, letter) => {
							return begin+letter.toUpperCase();
						});
					}
				})
			}
		// FORMATTING
			if (!String.prototype.hasOwnProperty('format')) {
				Object.defineProperty(String.prototype, 'format', {
					enumerable: false, configurable: false, writable: false,
					value () {
						var ths = this, frmt, vars = ARGS(arguments);
						// Handle Args
						if (!!vars && vars.slice(-1)[0].constructor.name == "FRMT") {
							frmt = vars.slice(-1)[0]; vars = vars.slice(0, -1);
						} else { frmt = new FRMT({}); }
						return frmt._.apply(frmt, [ths.toString()].concat(vars))
					}
				})
			}
		// ALIGN
			if (!String.prototype.hasOwnProperty('align')) {
				Object.defineProperty(String.prototype, 'align', {
					enumerable: false, configurable: false, writable: false,
					value (delim, direction) {
						var txt = this.toString(), dlm = '', rgx = null,
							dir = '', amt = 0, res = '';
						// -----
						dlm = '('+(!!delim ? '.+(?='+delim+')' : '^.*$')+')';
						rgx = new RegExp(dlm, 'gm');
						dir = direction || '+';
						amt = (txt.match(rgx) || []).max();
						// -----
						res = txt.replace(rgx, ($0, $1) => {
							return $1.pad(' ', amt, dir);
						});
						// -----
						return res;
					}
				})
			}
		// TO LINES
			if (!String.prototype.hasOwnProperty('toLines')) {
				Object.defineProperty(String.prototype, 'toLines', {
					enumerable: false, configurable: false, writable: false,
					value () { return (this.match(/(^.*$)/gm) || []); }
				})
			}
		// LINE COUNT
			if (!String.prototype.hasOwnProperty('lines')) {
				Object.defineProperty(String.prototype, "lines", {
					get  () { return this.toLines().length; }
				});
			}
		// COLUMNS
			if (!String.prototype.hasOwnProperty('toColumns')) {
				Object.defineProperty(String.prototype, 'toColumns', {
					enumerable: false, configurable: false, writable: false,
					value (options) {
						// Divide Text into Delimited Columns
						var opt = options || {};
						return new CLMNS(this, opt.delimiter, opt.suffix, opt.debug)
									.distribute(opt.align, opt.border, opt.callback);
					}
				})
				Object.defineProperty(String.prototype, 'columned', {
					enumerable: false, configurable: false, writable: false,
					value (direct, border, callback, log) {
						// Align Delimited Columns
						return this.toColumns(null, null, true).distribute(direct, border, callback)
					}
				})
			}

/////////////////////////////////////////////////////////////////////////////////////////////
// EXPORT

	module.exports = {
		colors, Assign, Imm, StrTime, ROOTD, LJ, path: PATH, os, fs,
	 	ARGS, TYPE, EXTEND, HIDDEN, DEFINE, NIL, UoN, IaN, preARGS, IS,
		ISS, OF, FOLDER, ITM, DCT, RGX, FRMT, CLM, CLMNS, Platform: {
			'darwin': 		'nix',
			'darwin-x64': 	'nix',
			'linux': 		'nix',
			'linux-ia32': 	'nix',
			'linux-x64': 	'nix',
			'win32': 		'win',
			'win32-ia32': 	'win',
			'win64-64': 	'win',
		}[os.platform()], EPROXY, TZ
	}

	////////////////////////////
	/*	// FOR IMPORTING
	 *	import {
	 *		colors, Assign, Imm, StrTime, ROOTD, LJ, path, os, fs,
	 *	 	ARGS, TYPE, EXTEND, HIDDEN, DEFINE, NIL, UoN, IaN, preARGS, IS,
	 *		ISS, OF, FOLDER, DCT, RGX, FRMT, CLM, CLMNS, EPROXY
	 *	} from './fills';
	*/



/////////////////////////////////////////////////////////////////////////////////////////////
