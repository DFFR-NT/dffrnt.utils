
'use strict';

/////////////////////////////////////////////////////////////////////////////////
// REQUIRES

	const {
		colors, Assign, Imm, StrTime, ROOTD, LJ, path, os, fs,
		ARGS, TYPE, EXTEND, HIDDEN, DEFINE, NIL, UoN, IaN, IS,
		ISS, OF, FOLDER, DCT, RGX, FRMT, CLM, CLMNS, EPROXY,
		preARGS, Platform, TZ
	} = require('./fills');

	let CFG = { Debug: false }, STG = {};

	/**
	 * Template options for the `JSN`.`MapPrint()` function
	 * @typedef {object} JTemplates
	 * @prop {{pattern:string}} all A template for both the key & val
	 * @prop {{pattern:string}} key A template for both the key only
	 * @prop {{pattern:string}} val A template for both the val only
	 */
	/**
	 * Delimiter options for the `JSN`.`MapPrint()` function
	 * @typedef {object} JDelimiter
	 * @prop {string} all A delimiter between each key/value pair
	 * @prop {string} pairs A delimiter between the key & value
	 */
	/**
	 * Options for the `JSN`.`MapPrint()` function
	 * @typedef {object} JPatterns
	 * @prop {JDelimiter} delims Delimiters for the key, values & pairs
	 * @prop {JTemplates} patterns Templates for the key, values & pairs
	 */
	/**
	 * A page `Number` for the `JSON` results
	 * @typedef {number} JSNPage
	 */
	/**
	 * A limit `Number` for the `JSON` results
	 * @typedef {number} JSNLimit
	 */
	/**
	 * A link to the **previous** page of `JSON` results
	 * @typedef {string} JSNPrev
	 */
	/**
	 * A link to the **next** page of `JSON` results
	 * @typedef {string} JSNNext
	 */
	/**
	 * A query parameter in a query `Object`
	 * @typedef {string|number} JSNQParam
	 */
	/**
	 * The query `Object` in a `JSON` result
	 * @typedef {{[param:string]:JSNQParam,page:JSNPage,limit:JSNLimit}} JSNQuery
	 */
	/**
	 * The `POST` parameters `Object` in a `JSON` result
	 * @typedef {{[param:string]:JSNQParam}} JSNPost
	 */
	/**
	 * The metadata in a `JSON` result object
	 * @typedef {object} JSNOptions
	 * @prop {JSNPost} params The `POST` parameters
	 * @prop {JSNQuery} query The query parameters
	 */
	/**
	 * Related links for the `JSON` result object
	 * @typedef {{[link_name:string]:string,prev:JSNPrev,next:JSNNext}} JSNLinks
	 */
	/**
	 * A `JSON` object for `HTTP` results
	 * @typedef {object} JSNResult
	 * @prop {number} status A `0` for success or an `Error` code
	 * @prop {JSNOptions} options The result's metadata
	 * @prop {JSNLinks} links The result's relavent links
	 * @prop {{}|[]} result The actual results themselves
	 */
	/**
	 * The payload object with a `JSON` results object
	 * @typedef {object} JSNPayload
	 * @prop {number} code The `HTTP` status code
	 * @prop {JSNResult} payload The `JSON` results object
	 */

/////////////////////////////////////////////////////////////////////////////////
// LOGGER OBJECT

	let hTmp = { kind: 'msg', msg: '', clr: 'yellow', name: '',
				 key: '', func: function func () { return; }, },
		dTmp = "%!(err)s%!(msg|-/ - )s",
		dErr = { message: 'unknown' };

	//////////////////////////////////////////////////////////////////////////////

	/**
	 * Options for handling an `ELOGR` `Event`
	 * @typedef {object} LOptions
	 * @prop {string} kind The type of message
	 * @prop {string} msg The message to print
	 * @prop {string} clr A color to format the message
	 * @prop {string} func A handler to call on the `Event`
	 */
	/**
	 * A collection of Handlers for each `ELOGR` `Event`
	 * @typedef {Object.<string,LOptions>} LHandlers
	 */
	/**
	 * Handles and Logs the `Events` of an `Object`
	 * @class ELOGR
	 */
	class ELOGR {
		/**
		 * Creates an instance of ELOGR.
		 * @param {any} cli An object to call & log methods
		 * @param {string|number|symbol} key An `Namspace` identifier
		 * @param {string|number|symbol} name The name of the `Namespace`
		 * @param {LHandlers} handlers A set of options & handlers for each `Event`
		 * @memberof ELOGR
		 */
		constructor(cli, key, name, handlers) {
			if (this instanceof ELOGR) {
				// -----------------------------------------------------------------------
				var th = this; th.def = Imm.Map(hTmp).mergeDeep({
					key: (key||'####'), name: (name||'????')
				});
				// -----------------------------------------------------------------------
				th.cli = cli; th.key = th.def.key; th.name = th.def.name;
				// -----------------------------------------------------------------------
				Imm.OrderedMap(handlers).map((v,k) => { cli.on(k, th.log(v)); });
			} else { return new ELOGR(cli, key, name, handlers); }
		}
		/**
		 * Formats the `Event's` log message
		 * @param {Error} [err] The log message, if an error occurs
		 * @param {any} [msg] The log message upon a successful `Event`
		 * @returns {string} The formatted message
		 * @memberof ELOGR
		 */
		format(err, msg) { return dTmp.format({ err: (err||dErr).message, msg: msg }); }
		/**
		 * Returns a logging handler for the `Event`
		 * @param {{kind:string,msg:string,clr:string,name:string,key:string,func:function}} [options] The logging options 
		 * @returns {function} A logging handler for the `Event`
		 * @memberof ELOGR
		 */
		log(options) {
			// -------------------------------------------------------------------
			var opts = this.def.mergeDeep(options).toJS(),
				kind = opts.kind, msg = opts.msg, clr = opts.clr, res,
				name = opts.name, key = opts.key, func = opts.func.bind(this);
			// -------------------------------------------------------------------
			switch (opts.kind) {
				case 'err': res = (err, res) => {
						func(); !!err && LG.Error(key, name, this.format(err, msg));
					}; break;;
				case 'msg': res = () => {
						func(); LG.Server(key, name, msg, clr);
					}; break;;
				default: return func;
			}
			// -------------------------------------------------------------------
			return res.bind(this);
		}
	}


/////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

	/**
	 * A collections of logging `functions`
	 * @class LG
	 */
	class LG {
		/**
		 * Exactly like `console`, but only prints if the `Debug` option is
		 * set to `true` in the `/config/settings.cfg.js` file
		 * @static
		 * @param {...any} args Arguments to print to the `console`
		 * @memberof LG
		 */
		static IF		(...args) { CFG.Debug && args.length && console.log(...args); }
		/**
		 * Prints a formatted `Object` as **JSON** to the `console`
		 * @static
		 * @param {any} obj An `Object` to print to the `console`
		 * @memberof LG
		 */
		static Object	(obj) { LG.IF(JSN.Pretty(obj)); }
		/**
		 * Prints a formatted `Server` message to the `console`
		 * @static
		 * @param {string|number} id A message identifier
		 * @param {string} prefix A string to prepend to the message
		 * @param {string} suffix A string to append to the message
		 * @param {string} color A display color for the message
		 * @memberof LG
		 */
		static Server	(id, prefix, suffix, color) {
			var dte = '.<$D-$I:$M:$S$p>'; prefix = prefix || ''; id = id || ''; color = !!color ? '|@C/'+color : '';
			console.log(
				("[%(Stamp|@C/grey)"+dte+"d] %(Prefix"+color+"|^/U)10+s [%(ID"+color+")4-s] %(Suffix|^/S)s")
				.format({ Stamp: TLS.DT(), Prefix: prefix, ID: id, Suffix: suffix }, new FRMT({}, []))
			);
		}
		/**
		 * Prints a formatted `Error` message to the `console`
		 * @static
		 * @param {string|number} id A message identifier
		 * @param {string} prefix A string to prepend to the message
		 * @param {string} suffix A string to append to the message
		 * @memberof LG
		 */
		static Error	(id, prefix, suffix) {
			var dte = '.<$D-$I:$M:$S$p>'; prefix = prefix || ''; id = id || '';
			console.log(
				("[%(Stamp|@C/grey)"+dte+"d] %(Prefix|@C/red|^/U)10+s [%(ID|@C/red)4s] %(Suffix|^/S)s")
				.format({ Stamp: TLS.DT(), Prefix: prefix, ID: id, Suffix: suffix })
			);
		}
	}
	/**
	 * A collection formatting `functions`
	 * @class TLS
	 */
	class TLS {
		/**
		 * Pulls `Array` of `Function` arguments
		 * @static
		 * @param {arguments} args The `Function` arguments object
		 * @param {number} [from] A `Number` to start the `Array` at
		 * @returns An `Array` of `Function` arguments
		 * @memberof TLS
		 */
		static Args  	(args, from) { return Array.prototype.slice.call(args).slice(from || 0); }
		/**
		 * Gets the number of properties in an `Object`
		 * @static
		 * @param {any} items An `Object` to count
		 * @returns The number of properties in the `Object`
		 * @memberof TLS
		 */
		static Cnt  	(items) { return Object.keys(items || {}).length; }
		/**
		 * Formats the current `Date` to a `String`
		 * @static
		 * @returns The `String`-formatted `Date`
		 * @memberof TLS
		 */
		static DT  		() { return new Date().toLocaleString(); }
		/**
		 * Insert a String value if said value is truthy
		 * @static
		 * @param {{pattern:string,condition:function(any):boolean,value:string,empty:string}} options 
		 * @returns 
		 * @memberof TLS
		 */
		static Insert  	(options) {
			var opts = opts = TLS.Fill(options, {
					pattern: '%s', condition: function condition (val) { return !!val; }, value: '', empty: ''
				}), ptn = opts.pattern, cnd = opts.condition, val = opts.value, emp = opts.empty;
			return cnd(val) ? ptn.replace('%s', val) : emp;
		}
		/**
		 * I'll get back to you on this one.....
		 * @static
		 * @param {...args} args 
		 * @returns {string} The formatted `String`?
		 * @memberof TLS
		 */
		static Hug  	(...args) {
			var brack = args.length >= 2 ? args[0] : '(,)';
			brack = brack.indexOf(",") > -1 ? brack.split(",") : [brack, brack];
			return brack[0]+(args.slice(1) || args).join("")+brack[1];
		}
		/**
		 * Performs a deep-merge on two `Objects` (_great for default options_)
		 * @static
		 * @param {Object.<string,any>} val An intial `Object`
		 * @param {Object.<string,any>} def An `Object` of default values or mixins
		 * @returns {Object.<string,any>} The fully merged `Object`
		 * @memberof TLS
		 */
		static Fill  	(val, def)  { return Imm.fromJS(def || {}).mergeDeep(val || {}).toJS(); }
		/**
		 * Performs a `sprintf`-style `String` formattng given a template and input items
		 * @static
		 * @param {string} template The string template
		 * @param {...any} items The items to places in the template
		 * @returns A `sprintf`-formatted `String`
		 * @memberof TLS
		 */
		static Format  	(template, ...items) {
			try {
				var res = template,
					key = function (ky) {
						var ptn = TLS.Concat("{{", ky,"}}");
						return new RegExp(ptn, "g");
					};
				switch (true) {
					case !!template: res = ''; break;; 
					case !!!items.length: res = template; break;;
					default: var lst = items, obj  = {};
						if (lst[0] instanceof Object) {
							obj = lst[0]; lst = lst.slice(1);
							Object.keys(obj).map((ob, o) => {
								res = res.replace(key(ob), obj[ob]);
							});
						}; lst.map((ls, l) => { res = res.replace("%s", ls); });
				}; return res;
			} catch (e) { console.log(e); return template; }
		}
		/**
		 * Strips a character or set of characters from a given `String`
		 * @static
		 * @param {string} str The `String` toe strip
		 * @param {string} what The character(s) to strip
		 * @returns The `String`, minus the character(s) given
		 * @memberof TLS
		 */
		static Strip  	(str, what) { return str.replace(what || /([\t\n\r\s]|\\[trns])/g, ''); }
		/**
		 * Truncates a `String`
		 * @static
		 * @param {string} str The `String` to truncate
		 * @param {number} len The maxium lenth of the `String`
		 * @returns The truncated `String`
		 * @memberof TLS
		 */
		static Trunc  	(str, len) { return str.substr(0, len)+'...'; }
		/**
		 * Creates a tree `Object` out of a multi-dimensional `Array`
		 * @static
		 * @param {Array} list A multi-dimensional `Array`
		 * @param {string} others A property name for single-items
		 * @returns {{[grandparent:string]:{[parent:string]:{[child:string]:{}}}}} The tree `Object`
		 * @memberof TLS
		 */
		static Tree  	(list, others) {
			var res = {}, add = (itm, lst) => {
					if (Array.isArray(lst)) lst.push(itm);
					else if (lst.hasOwnProperty(others)) lst[others].push(itm);
					else lst[others] = [itm];
				};
			list.map((ls, l) => {
				var obj = res, len = ls.length;
				ls.map((ar, a) => {
					var exists = obj.hasOwnProperty(ar);
					switch (exists) {
						case  true: obj = obj[ar]; break;;
						case false:
							switch (true) {
								case len-a == 2: obj = obj[ar] = []; break;;
								case len-a == 1: add(ar, obj); break;;
								default: obj = obj[ar] = {}; break;;
							}
					}
				});
			});
			return res;
		}
		/**
		 * Formats a URI Path with Query parameters
		 * @static
		 * @param {Array.<string>} paths An `Array` of Path
		 * @param {{[param:string]:string}} query An `Object` literal of Query parameters
		 * @returns {string} The formatted URI
		 * @memberof TLS
		 */
		static Path  	(paths, query) {
			let qstr = Object.keys(query || {}).map((qu, q)=>(qu+"="+query[qu])).join("&"); 
			paths = TLS.Compact(paths || []);
			return encodeURI(('/'+paths.join('/').toLowerCase())
									.replace(/\/{2,}/g, "/")
									.replace(/\/+\?/g, "?")
									.replace(/\/$/, "")+(qstr ? '?'+qstr : ''));
		}
		/**
		 * Converts a IP `Long Number` into an **IP Address**. If the IP
		 * `Long Number` is not a `String`, it returns the same value
		 * @static
		 * @param {string|number} long The IP `Long Number`
		 * @returns {string} An **IP Address** (`#`.`#`.`#`.`#`)
		 * @memberof TLS
		 */
		static Lng2IP  	(long) {
			if ((typeof long) === 'string') {
				var OCT = function(nm, base) { return ((nm >> base) & 255); },
					O1 = OCT(long,  0), O2 = OCT(long,  8), O3 = OCT(long, 16), O4 = OCT(long, 24);
				return O4 + "." + O3 + "." + O2 + "." + O1;
			} else { return long; }
		}
		/**
		 * Converts an **IP Address** to an IP `Long Number`
		 * @static
		 * @param {string} ip An **IP Address** (`#`.`#`.`#`.`#`)
		 * @returns {number} The IP `Long Number`
		 * @memberof TLS
		 */
		static IP2Lng  	(ip) {
			if ((typeof ip) === 'number') {
				var OCT = ip.split('.').reverse(), Res = 0;
				OCT.map((oc, o) => { Res += (parseInt(oc) * Math.pow(256, o)); });
				return Res;
			} else { return ip; }
		}
		/**
		 * Converts a MAC `Decimal String` into a **MAC Address**
		 * @static
		 * @param {string} dec The MAC `Decimal String`
		 * @returns {string} A **MAC Address** (`4F`:`12`:`CC`:`5D`:`D8`:`90`)
		 * @memberof TLS
		 */
		static Dec2Mac  (dec) {
			var arr = new Array( 7 ).join( '00' ).match( /../g ),
				spl = dec.split('.').map((dc, d)=>(parseInt(dc).toString(16)));
			return arr.concat( spl.reverse() ).reverse().slice( 0, 6 ).join(':').toUpperCase()
		}
		/**
		 * Converts an **MAC Address** to a MAC `Decimal String`
		 * @static
		 * @param {string} mac A **MAC Address** (`4F`:`12`:`CC`:`5D`:`D8`:`90`)
		 * @returns {number} The MAC `Decimal String`
		 * @memberof TLS
		 */
		static Mac2Dec  (mac) {
			var oct = mac.indexOf(':') > -1 ? mac.split(':') : [];
			return oct.map((mc, m)=>(parseInt(mc, 16))).join('.');
		}
		/**
		 * Evaluates the arguments in order and returns the current value of the 
		 * first expression that initially does not evaluate to `falsy`.
		 * @static
		 * @param {string|number} val The value to coalesce
		 * @param {string} [none] The string to use if the value is `null`
		 * @param {string} [add] A string to append to the value
		 * @param {string} [insert="%s"] A `sprintf` template that the value will be placed into
		 * @returns The first `truthy` expression
		 * @memberof TLS
		 */
		static Coalesce (val, none, add, insert) {
			if (!!val) {
				if (!!insert) { return insert.replace("%s", val)+(add || ''); }
				else { return val+(add || ''); }
			} else { return (none || ''); }
		}
		/**
		 * Concantenates a set of `String|Number` arguments (_with **NO** delimiter_)
		 * @static
		 * @param {...(string|number)} args A set of arguments to concatenate
		 * @returns {string} The concatenate `String`
		 * @memberof TLS
		 */
		static Concat  	(...args) { return args.join(""); }
		/**
		 * Concantenates a set of delimited `String|Number` arguments
		 * @static
		 * @param {string} delim A set of characters to delimit the `Strings|Numbers` by
		 * @param {Array.<(string|number)>} strings An `Array` of `Strings|Numbers` to concatenate
		 * @returns {string} The concatenate `String`
		 * @memberof TLS
		 */
		static ConcatD  (delim, strings) { return strings.join(delim); }
		/**
		 * "Cleans" a `String` given a set of Patterns & Replacements
		 * @static
		 * @param {string} val The `String` to "clean"
		 * @param {Array.<{find:(string|number|RegExp),rep:(string|number)}>} conds An `Array` of _Find_ & _Replace_ values to "clean" the `String` with
		 * @returns The "clean" `String`
		 * @memberof TLS
		 */
		static Clean  	(val, conds) {  conds.map((cd, c) => { val = val.replace(cd.find, cd.rep); }); return val; }
		/**
		 * Ensures a `Number` value is always _**above**_ a given limit
		 * @static
		 * @param {number} val The `Number` value
		 * @param {number} limit The limit that this `Number` must _**exceed**_
		 * @returns The original `Number` value, or the `limit+1`
		 * @memberof TLS
		 */
		static Positive (val, limit) { return val <= limit ? limit+1 : val; }
		/**
		 * Ensures a `Number` value is always _**below**_ a given limit
		 * @static
		 * @param {number} val The `Number` value
		 * @param {number} limit The limit that this `Number` must _**subceed**_
		 * @returns The original `Number` value, or the `limit-1`
		 * @memberof TLS
		 */
		static Negative (val, limit) { return val >= limit ? limit-1 : val; }
		/**
		 * Removes all `falsy` elements from an `Array`
		 * @static
		 * @param {Array} list A set of items to be compacted
		 * @returns {Array} The compacted `Array`
		 * @memberof TLS
		 */
		static Compact  (list) { return list.filter((fl, f)=>(fl !== null && fl !== undefined)); }
		/**
		 * Creates a `RegExp` object for templating
		 * @static
		 * @param {string} pattern The template `String`
		 * @param {string|number|Array.<(string|number)>} fillIn The key or set of keys for the template
		 * @param {string} options A `String` of `RegExp` modifiers
		 * @returns {RegExp} The template `RegExp` object
		 * @memberof TLS
		 */
		static RGX  	(pattern, fillIn, options) {
			try { var args = (fillIn instanceof Array) ? fillIn : [fillIn];
				return new RegExp(TLS.Format.apply(this, [pattern].concat(args)), options || '');
			} catch (e) { console.log(e); return null; }
		}
	}
	/**
	 * A collection of `JSON` handling `functions`
	 * @class JSN
	 */
	class JSN {
		/**
		 * Formats and `Object` into a 4-space tabbed `JSON String`
		 * @static
		 * @param {any} obj The `Object` to format
		 * @returns {string} The formatted `JSON String`
		 * @memberof JSN
		 */
		static Pretty  	(obj) { return JSON.stringify(obj || {}, null, '    '); }
		/**
		 * A safe, compact version of `Object`.`hasOwnProperty(prop)`
		 * @static
		 * @param {any} obj The object to search
		 * @param {string|number} prop The property name to search for
		 * @returns {boolean} `true`, if found
		 * @memberof JSN
		 */
		static Has  	(obj, prop) { try { return obj.hasOwnProperty(prop) } catch (e) { return false; }; }
		/**
		 * Like `Array`.`map()`, but for `Object` literals
		 * @static
		 * @param {Object.<string,any>} obj An `Object` literal to Map
		 * @param {function(any,number)} handler The handler for each property
		 * @returns {Object.<string,any>} The newly mapped `Object` literal
		 * @memberof JSN
		 */
		static Map  	(obj, handler) {
			try { var res = {}, keys = Object.keys(obj);
				keys.map((ob, j) => {
					try { res[obj] = handler(ob, j); } catch (e) { res[obj] = null; }
				}); return res;
			} catch (err) { return {}; }
		}
		/**
		 * Like `JSN`.`map()`, except this maps to a specific property within 
		 * each property's own `Object` literal
		 * @static
		 * @param {Object.<string,any>} obj An `Object` literal to Map
		 * @param {string|number|symbol} prop The sub-property to map to
		 * @returns {Object.<string,any>} The newly mapped `Object` literal
		 * @memberof JSN
		 */
		static MapWith  (obj, prop) { return JSN.Map(obj, (ob, j)=>(ob[prop] || null)); }
		/**
		 * Edits the properties in an `Object` literal if the properties match a specified pattern
		 * @static
		 * @param {Object.<string,any>} obj An `Object` literal to Map
		 * @param {function(any,number)} handler The handler for each property
		 * @param {string} opts A `String` of `RegExp` modifiers
		 * @returns {Object.<string,any>} The newly edited `Object` literal
		 * @memberof JSN
		 */
		static MapEdit  (obj, handler, opts) {
			var edt  = Assign({}, obj),
				hndl = handler || (val => val);
				opts = TLS.Fill(opts, { depth: 0, match: '.+' });
			JSN.Map(edt, (ob, j) => {
				if (ob.match(TLS.RGX("^%s$", opts.match))) edt[ob] = hndl(edt[ob]);
			}); return edt
		}
		/**
		 * Formats an `Object` literal's keys & values into `String` given a specified template
		 * @static
		 * @param {Object.<string,string>} obj An `Object` literal to format
		 * @param {JPatterns} patterns Patterns to format the keys/value pairs by
		 * @param {boolean} reverse Reverses the key order, if `true`
		 * @returns {string} The formatted `JSON String`
		 * @memberof JSN
		 */
		static MapPrint (obj, patterns, reverse) {
			var revs = { true: 'reverse', false: 'slice' }[!!reverse],
				opts = TLS.Fill(patterns, { 
					delims: { all: ', ', pairs: '=' },
					patterns: { 
						all: { pattern: "(%s)" }, 
						key: { pattern: "'%s'" }, 
						val: { pattern:   "%s" } 
					}
				}), Keys = Object.keys(obj), Ins  = TLS.Insert, Fll = TLS.Fill,
				KeyP = opts.patterns.key, ValP = opts.patterns.val,
				AllD = opts.delims.all,   PrsD = opts.delims.pairs,
				RgxP = new RegExp("^(.*)("+PrsD+")+$");
			// --
			return Ins(Fll(opts.all, {
				value: Keys.map((ob, j) => {
					var ky = ob, vl = obj[ob]; return [
						Ins(Fll(KeyP, { value: ky })), Ins(Fll(ValP, { value: vl })),
					][revs]().join(PrsD).replace(RgxP, '$1');
				}).join(AllD).replace(/^ *(.*) *$/, '$1')
			}));
		}
		/**
		 * Gets the length of an `Object` literal
		 * @static
		 * @param {Object.<string,string>} obj The `Object` literal
		 * @returns The length of the `Object` literal
		 * @memberof JSN
		 */
		static Len  	(obj) { return (Object.keys(obj || {}) || []).length; }
		/**
		 * Splits an `Object` literal into separate key and value `Arrays`
		 * @static
		 * @param {Object.<string,string>} obj The `Object` literal
		 * @returns {{K:Array.<string|number>,V:Array}} An `Object` with the key and value `Arrays`
		 * @memberof JSN
		 */
		static KV  		(obj) {
			var keys = Object.keys(obj);
			return { K: keys, V: keys.map((ky, k)=>obj[ky]) }
		}
		/**
		 * Converts an `Array` of `Object` literals into a `JSON String` object for `HTTP` 
		 * requests. It does this by grabbing the specified **key** from each item, and adds
		 * said item into an `Object` literal property as `key: item`. This is useful when 
		 * dealing with `MySQL.RowData`.
		 * @example
		 * // All example will dervive from this `Rows` result
		 * > var Rows = [
		 * > 	{ name: 'James', age: 26 },
		 * > 	{ name: 'Tammy', age: 32 }
		 * > ];
		 * @example
		 * // yeilds { James: { age: 26 }, Tammy: { age: 32 } }
		 * > JSN.Objectify(Rows, 'name', {}, {});
		 * @example
		 * // yeilds { employees: { James: { age: 26 }, Tammy: { age: 32 } } }
		 * > JSN.Objectify(Rows, 'name', { 
		 * >     '/department': ['employees','<(\\w ?)+>'] 
		 * > }, {});
		 * @static
		 * @param {{}[]} list An `Array` of `Row` results
		 * @param {string|number} key The property 
		 * @param {{[path:string]:string[]}} cols An `Object` lieteral denoting the propety **path** to set each `Row` in.
		 * @param {JSNQuery} qry A query object used for further customization
		 * @returns {string} A `JSON` formatted `String`
		 * @memberof JSN
		 */
		static Objectify(list, key, cols, qry) {
			cols = (!!cols?(cols[qry.id]||[]):[]);
			let omt = ['payload','result'].concat(cols),
				flt = (lid) => (v,i)=>!!!lid.match(new RegExp('^'+v+'$')),
				rem = (!!key ? (k,a)=>{delete a[k];} : (k,a)=>0),
				gky = (!!key ? (k,a,i)=>a[k].toString() : (k,a,i)=>i),
				res = (!!key ? Imm.Map({}) : Imm.List([])),
				to  = (qry.to||[]).filter(v => {
					let c = omt.filter(o => {
							let r = new RegExp('^'+o+'$'),
								s = !!v.match(r); return s;
						}).length; return c == 0;
				});
			list.map((ls, l) => {
				let lid = gky(key,ls,l), itm = {}, ky = [], pth = to,
					mp = k=>(itm[k]=itm[k]), mt = k=>(itm=itm[k]);
				try { 
					itm = ls; rem(key,itm);
					if (!!pth[0]) {
						ky = Object.keys(itm); pth.map(v => {
							ky.has(v) && (itm=itm[v],ky=Object.keys(itm));
						});
					} else {
						if (!!cols[0]) {
							let ky = Object.keys(itm),
								cl = cols.filter(v => ky.has(v));
							cl.map(cl.length > 1 ? mp : mt);
						}; 	pth = pth.concat(pth.has(lid)?[]:[lid]);
					};
					res = res.setIn(pth, itm);
				} catch (e) { console.log('MERROR', e.stack); }
			}); return res.toJS();
		}
		/**
		 * Creates an `Object` literal of options & links
		 * @static
		 * @param {{page:JSNPage,limit:JSNLimit}} pgn The page & limit `Numbers`
		 * @param {{}|[]} items The actual results themselves
		 * @param {string} prefix A preceding path for this `Endpoint`
		 * @param {JSNPost} params The `POST` parameters
		 * @param {JSNLinks} [links] Any Related links
		 * @returns {{Options:JSNOptions,Links:JSNLinks}} An `Object` literal of options & links
		 * @memberof JSN
		 */
		static Optify  	(pgn, items, prefix, params, links) {
			var cnt = TLS.Cnt(items), pge = parseInt(pgn.page), lmt = parseInt(pgn.limit),
				mke = (chg)=>({ page:pge+chg, limit:lmt, as:'list', kind:'ext' }),
				pnt = { point: prefix.split('/').slice(1) }, def = "/",
				opt = { params: params, query: Assign({}, pgn, { page: pge, limit: lmt || cnt }) },
				lnk = Assign({}, pnt, { params: Imm.Map(params).map((v,k)=>((!!v&&!!v.join) ? v.join(';') : v)).toObject() }),
				prv = (pge >  1 ? Assign({}, lnk, { query: mke(-1) }) : def),
				nxt = (cnt==lmt ? Assign({}, lnk, { query: mke( 1) }) : def);
			return { Options: opt, Links: Assign({}, links, { prev: prv, next: nxt }) }
		}
		/**
		 * Creates a `JSON` object for `HTTP` results
		 * @static
		 * @param {number} status A `0` for success or an `Error` code
		 * @param {{}|[]} [value] The actual results themselves
		 * @param {JSNOptions} [options] The result's metadata
		 * @param {JSNLinks} [links] The result's relavent links
		 * @returns {JSNResult} A `JSON` object for `HTTP` results
		 * @memberof JSN
		 */
		static Result  	(status, value, options, links) {
			return {
				status: 	status,
				options: 	options || {},
				links: 		links 	|| {},
				result: 	value 	|| {}
			}
		}
		/**
		 * Creates a payload object of `HTTP` results
		 * @static
		 * @param {{}|[]} itms The actual results themselves
		 * @param {JSNOptions} options The result's metadata
		 * @param {JSNLinks} links The result's relavent links
		 * @param {number} code The `HTTP` status code
		 * @returns {JSNPayload} The payload object
		 * @memberof JSN
		 */
		static Valid 	(itms, options, links, code) {
			var stat = Number(!!itms.error), payload;
			payload = JSN.Result(stat, itms, options, links);
			return { code: code, payload: payload }
		}
		/**
		 * Creates a payload object of `HTTP` documentation
		 * @static
		 * @param {string} url The `Endpoint` being documented
		 * @param {string} message A decsriptive message
		 * @param {{}|[]} usage The actual documentation
		 * @param {number} code code The `HTTP` status code
		 * @returns {JSNPayload} The payload object
		 * @memberof JSN
		 */
		static Help  	(url, message, usage, code) {
			return {
				code: 	 code,
				payload: JSN.Result(code == 200 ? 0 : 1, {
							request: url, message: message, usage: usage
						})
			}
		}
		/**
		 * Displays a specified message or the first line of the `Error.stack` if the message if `null`
		 * @static
		 * @param {string} message A message to display for the `Error`
		 * @param {Error} err The `Error` object, which will be used if the message is `null`
		 * @returns {string} The `Error` message
		 * @memberof JSN
		 */
		static Error  	(message, err) {
			try { return message || err.stack.match(/\s([^:\n]+)\n/)[1] }
			catch (e) { return e; }
		}
		/**
		 * @ignore
		 */
		static Send  	(res, err, itms, options, links) {
			var obj = JSN.Valid(err, itms, options, links);
			!!JSN.Len(links) && res.links(links);
			res.status(obj.code).send(obj.json);
		}
	}

/////////////////////////////////////////////////////////////////////////////////
// EXPORTS

	try { CFG = TLS.Fill(require('dffrnt.confs').Settings, CFG); } 
	catch (error) { LG.IF(error); }

	// Globals
		const Dbg = CFG.Debug || false;
		module.exports = {
			colors, Assign, Imm, StrTime, ROOTD, LJ, path, os, fs,
			ARGS, TYPE, EXTEND, HIDDEN, DEFINE, NIL, UoN, IaN, IS,
			ISS, OF, FOLDER, DCT, RGX, FRMT, CLM, CLMNS, ELOGR, EPROXY,
			preARGS, Dbg, LG, TLS, JSN, Platform, TZ
		};
