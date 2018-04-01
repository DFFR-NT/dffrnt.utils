
'use strict';

/////////////////////////////////////////////////////////////////////////////////
// REQUIRES

	import {
		colors, Assign, Imm, StrTime, ROOTD, LJ, path, os, fs,
	 	ARGS, TYPE, EXTEND, HIDDEN, DEFINE, NIL, UoN, IaN, IS,
		preARGS, ISS, OF, FOLDER, DCT, RGX, FRMT, CLM, CLMNS
	} from './fills';

	let CFG 	= { debug: false };


/////////////////////////////////////////////////////////////////////////////////
// LOGGER OBJECT

	let hTmp = { kind: 'msg', msg: '', clr: 'yellow', name: '',
				 key: '', func: function func () { return; }, },
		dTmp = "%!(err)s%!(msg|-/ - )s",
		dErr = { message: 'unknown' };

	//////////////////////////////////////////////////////////////////////////////

	class ELOGR {
		constructor(cli, key, name, handlers) {
			if (this instanceof ELOGR) {
				// -----------------------------------------------------------------------
				var th = this; th.def = Imm.Map(hTmp).mergeDeep({
					key: (key||'####'), name: (name||'????')
				});
				// -----------------------------------------------------------------------
				th.cli = cli; th.key = th.def.key; th.name = th.def.name;
				// -----------------------------------------------------------------------
				Imm.OrderedMap(handlers).map(function (v,k) { cli.on(k, th.log(v)); });
			} else { return new ELOGR(cli, key, name, handlers); }
		}

		format(err, msg) { return dTmp.format({ err: (err||dErr).message, msg: msg }); }

		log(options) {
			// -------------------------------------------------------------------
			var opts = this.def.mergeDeep(options).toJS(),
				kind = opts.kind, msg = opts.msg, clr = opts.clr, res,
				name = opts.name, key = opts.key, func = opts.func.bind(this);
			// -------------------------------------------------------------------
			switch (opts.kind) {
				case 'err': res = function (err, res) {
						func(); !!err && LG.Error(key, name, this.format(err, msg));
					}; break;;
				case 'msg': res = function () {
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

	let Log  	= {
		IF  	() { if (CFG.debug && arguments.length) console.log.apply(console, arguments); },
		Object  (obj) { Log.IF(Json.Pretty(obj)); },
		Server  (id, prefix, suffix, clr) {
			var dte = '.<$D-$I:$M:$S$p>'; prefix = prefix || ''; id = id || ''; clr = !!clr ? '|@C/'+clr : '';
			console.log(
				("[%(Stamp|@C/grey)"+dte+"d] %(Prefix"+clr+"|^/U)10+s [%(ID"+clr+")4-s] %(Suffix|^/S)s")
				.format({
					Stamp: Tools.DT(), Prefix: prefix, ID: id, Suffix: suffix
				}, new FRMT({}, [])) /*.colored({ red: /([\-])/g })*/ /*.inColor()*/
			);
		},
		Error  	(id, prefix, suffix) {
			var dte = '.<$D-$I:$M:$S$p>'; prefix = prefix || ''; id = id || '';
			console.log(
				("[%(Stamp|@C/grey)"+dte+"d] %(Prefix|@C/red|^/U)10+s [%(ID|@C/red)4s] %(Suffix|^/S)s")
				.format({
					Stamp: Tools.DT(), Prefix: prefix, ID: id, Suffix: suffix
				})
			);
		}
	}

	let Tools 	= {
		Args  		(args, from) { return Array.prototype.slice.call(args).slice(from || 0); },
		Cnt  		(items) { return Object.keys(items || {}).length; },
		DT  		() { return new Date().toLocaleString(); },
		Insert  	(options) {
			var opts = opts = Tools.Fill(options, {
					pattern: '%s', condition: function condition (val) { return !!val; }, value: '', empty: ''
				}), ptn = opts.pattern, cnd = opts.condition, val = opts.value, emp = opts.empty;
			return cnd(val) ? ptn.replace('%s', val) : emp;
		},
		Hug  		() {
			var args = Tools.Args(arguments), brack = args.length >= 2 ? args[0] : '(,)';
			brack = brack.indexOf(",") > -1 ? brack.split(",") : [brack, brack];
			return brack[0]+(args.slice(1) || args).join("")+brack[1];
		},
		Fill  		(val, def)  { return Imm.fromJS(def || {}).mergeDeep(val || {}).toJS(); },
		Format  	(template) {
			try {
				var res = template, args = Tools.Args(arguments),
					key = function (ky) {
						var ptn = Tools.Concat("{{", ky,"}}");
						return new RegExp(ptn, "g");
					};
				switch (args.length) {
					case 0: res = ''; break;; case 1: res = template; break;;
					default: var lst = args.slice(1), obj  = {};
						if (lst[0] instanceof Object) {
							obj = lst[0]; lst = lst.slice(1);
							Object.keys(obj).map(function (ob, o) {
								res = res.replace(key(ob), obj[ob]);
							});
						}; lst.map(function (ls, l) { res = res.replace("%s", ls); });
				}; return res;
			} catch (e) { console.log(e); return template; }
		},
		Strip  		(str, what) { return str.replace(what || /([\t\n\r\s]|\\[trns])/g, ''); },
		Trunc  		(str, len) { return str.substr(0, len)+'...'; },
		Tree  		(list, others) {
			var res = {}, add = function (itm, lst) {
					if (Array.isArray(lst)) lst.push(itm);
					else if (lst.hasOwnProperty(others)) lst[others].push(itm);
					else lst[others] = [itm];
				};
			list.map(function (ls, l) {
				var obj = res, len = ls.length;
				ls.map(function (ar, a) {
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
		},
		Path  		(paths, query) {
			let qstr = Object.keys(query || {}).map(function (qu, q) { return qu+"="+query[qu]; }).join("&"); paths = Tools.Compact(paths || []);
			return encodeURI(('/'+paths.join('/').toLowerCase())
									   .replace(/\/{2,}/g, "/")
									   .replace(/\/+\?/g, "?")
									   .replace(/\/$/, "")+(qstr ? '?'+qstr : ''));
		},
		Lng2IP  	(num) {
			if ((typeof num) === 'string') {
				var OCT = function(nm, base) { return ((nm >> base) & 255); },
					O1 = OCT(num,  0), O2 = OCT(num,  8), O3 = OCT(num, 16), O4 = OCT(num, 24);
				return O4 + "." + O3 + "." + O2 + "." + O1;
			} else { return num; }
		},
		IP2Lng  	(ip) {
			if ((typeof num) === 'number') {
				var OCT = ip.split('.').reverse(), Res = 0;
				OCT.map(function (oc, o) { Res += (parseInt(oc) * Math.pow(256, o)); });
				return Res;
			} else { return ip; }
		},
		Mac2Dec  	(txt) {
			var mac = txt.indexOf(':') > -1 ? txt.split(':') : [];
			return mac.map(function (mc, m) { return parseInt(mc, 16); }).join('.');
		},
		Dec2Mac  	(num) {
			var arr = new Array( 7 ).join( '00' ).match( /../g ),
				dec = num.split('.').map(function (dc, d) { return parseInt(dc).toString(16); });
			return arr.concat( dec.reverse() ).reverse().slice( 0, 6 ).join(':').toUpperCase()
		},
		Coalesce  	(val, none, add, insert) {
			if (!!val) {
				if (!!insert) { return insert.replace("%s", val)+(add || ''); }
				else { return val+(add || ''); }
			} else { return (none || ''); }
		},
		Concat  	() { return Tools.Args(arguments).join(""); },
		ConcatD  	(delim, strings) { return strings.join(delim); },
		Clean  		(val, conds) {  conds.map(function (cd, c) { val = val.replace(cd.find, cd.rep); }); return val; },
		Positive  	(val, limit) { return val <= limit ? limit+1 : val; },
		Negative  	(val, limit) { return val >= limit ? limit-1 : val; },
		Compact  	(list) { return list.filter(function (fl, f) { return fl !== null && fl !== undefined; }); },
		RGX  		(pattern, fillIn, options) {
			try { var args = (fillIn instanceof Array) ? fillIn : [fillIn];
				return new RegExp(Tools.Format.apply(this, [pattern].concat(args)), options || '');
			} catch (e) { console.log(e); return null; }
		},
	}

	let Json 	= {
		Pretty  	(obj) { return JSON.stringify(obj || {}, null, '    '); },
		Has  		(obj, prop) { try { return obj.hasOwnProperty(prop) } catch (e) { return false; }; },
		Map  		(obj, handler) {
			try { var res = {}, keys = Object.keys(obj);
				keys.map(function (ob, j) {
					try { res[obj] = handler(ob, j); } catch (e) { res[obj] = null; }
				}); return res;
			} catch (err) { return {}; }
		},
		MapWith  	(obj, prop) { return Json.Map(obj, function (ob, j) { return ob[prop] || null; }); },
		MapEdit  	(obj, handler, opts) {
			var edt  = Assign({}, obj),
				hndl = handler || function (val) { return val; };
				opts = Tools.Fill(opts, { depth: 0, match: '.+' });
			Json.Map(edt, function (ob, j) {
				if (ob.match(Tools.RGX("^%s$", opts.match))) edt[ob] = handler(edt[ob]);
			}); return edt
		},
		MapPrint  	(obj, patterns, reverse) {
			var revs = { true: 'reverse', false: 'slice' }[!!reverse],
				opts = Tools.Fill(patterns, { delims: { all: ', ', pairs: '=' },
					patterns: { all: { pattern: "(%s)" }, key: { pattern: "'%s'" }, val: { pattern: "%s" } }
				}), Keys = Object.keys(obj), Ins  = Tools.Insert, Fll = Tools.Fill,
				KeyP = opts.patterns.key, ValP = opts.patterns.val,
				AllD = opts.delims.all,   PrsD = opts.delims.pairs,
				RgxP = new RegExp("^(.*)("+PrsD+")+$");
			// --
			return Ins(Fll(opts.all, {
				value: Keys.map(function (ob, j) {
					var ky = ob, vl = obj[ob]; return [
						Ins(Fll(KeyP, { value: ky })), Ins(Fll(ValP, { value: vl })),
					][revs]().join(PrsD).replace(RgxP, '$1');
				}).join(AllD).replace(/^ *(.*) *$/, '$1')
			}));
		},
		Len  		(obj) { return (Object.keys(obj || {}) || []).length; },
		KV  		(obj) {
			var keys = Object.keys(obj);
			return { K: keys, V: keys.map(function (ky, k) { return obj[ky]; }) }
		},
		Objectify  	(list, key, cols, qry) {
			cols = (!!cols?(cols[qry.id]||[]):[]);
			console.log('CL:', cols)
			var omt = ['payload','result'].concat(cols), res = Imm.Map({}),
				flt = function (lid) { return function (v,i) {
					return !!!lid.match(new RegExp('^'+v+'$'));
				}; 	},
				to  = qry.to.filter(function (v) {
					// console.log('\t['+v+']:')
					var c = omt.filter(function (o) {
							var r = new RegExp('^'+o+'$'),
								s = !!v.match(r);
							// console.log('\t\t"'+v+'".match('+r+') =', s)
							return s;
						}).length;
					// console.log('\t\t('+c+') =', c == 0)
					return c == 0;
				});
				console.log('TO:', to)


			var cns = console;

			list.map(function(ls, l) {
				var lid = ls[key].toString(), itm = {}, ky = [],
					// pth = to.filter(flt(lid)),
					pth = to,
					mp  = function (k) { itm[k]=itm[k]; },
					mt  = function (k) { itm=itm[k]; };
				try {
					// cns.log('LS:', ls)
					// cns.log('QY:', qry)
					// cns.log('PT:', pth.concat(pth.has(lid)?[]:[lid]), 'of', qry.to)
					cns.log('PT:', pth, 'of', qry.to)
					// cns.log('COLS:', cols)
					// var m = Imm.Map(ls).filter(function (v,k) {
							// var r = pth.has(k);
							// console.log('\t>>', k, ':', v)
							// r && (itm = v);
							// return r;
					// 	});
					// (m.size == 0) && ( itm = ls );

					itm = ls; delete itm[key];
					if (!!pth[0]) {
						ky = Object.keys(itm)
						pth.map(function (v) {
							console.log('\t>>', v, 'in', ky)
							ky.has(v) && (itm = itm[v], ky = Object.keys(itm));
						})
					} else {
						if (!!cols[0]) {
							var ky = Object.keys(itm),
								cl = cols.filter(function (v) {
									return ky.has(v);
								});
							if (cl.length > 1) {
								console.log('\tMAPPING MULTI')
								cl.map(mp);
							} else {
								console.log('\tMAPPING SINGL')
								cl.map(mt)
							}
						}; 	pth = pth.concat(pth.has(lid)?[]:[lid]);
					};	res = res.setIn(pth, itm);

					// console.log('ITM:', itm)

					//

				} catch (e) {
					console.log('MERROR', e.stack);
				} finally {
					console.log('SO FAR >>>>', pth, '\nRES:', res, '\nITM:', itm);
				}
			});

			console.log('RES:', JSON.stringify(res.toJS(),null,'  '))
			return res.toJS();
		},
		Optify  	(pgn, items, prefix, params, links) {
			var cnt = Tools.Cnt(items), pge = parseInt(pgn.page), lmt = parseInt(pgn.limit),
				mke = function (chg) { return { page:pge+chg, limit:lmt, as:'list', kind:'ext' }; },
				pnt = { point: prefix.split('/').slice(1) }, def = "/",
				opt = { params: params, query: Assign({}, pgn, { page: pge, limit: lmt || cnt }) },
				lnk = Assign({}, pnt, { params: Imm.Map(params).map(function (v,k) { return (!!v.join ? v.join(';') : v); }).toObject() }),
				prv = (pge >  1 ? Assign({}, lnk, { query: mke(-1) }) : def),
				nxt = (cnt==lmt ? Assign({}, lnk, { query: mke( 1) }) : def);
			return { Options: opt, Links: Assign({}, links, { prev: prv, next: nxt }) }
		},
		Result  	(status, value, options, links) {
			return {
				status: 	status,
				options: 	options || {},
				links: 		links 	|| {},
				result: 	value 	|| {}
			}
		},
		Valid 		(itms, options, links, code) {
			var stat = Number(!!itms.error), payload;
			payload = Json.Result(stat, itms, options, links);
			return { code: code, payload: payload }
		},
		Help  		(url, message, vals, code) {
			return {
				code: 	 code,
				payload: Json.Result(code == 200 ? 0 : 1, {
							request: url, message: message, usage: vals
						})
			}
		},
		Error  		(message, err) {
			try { return message || err.stack.match(/\s([^:\n]+)\n/)[1] }
			catch (e) { return e; }
		},
		Send  		(res, err, itms, options, links) {
			var obj = Json.Valid(err, itms, options, links);
			!!Json.Len(links) && res.links(links);
			res.status(obj.code).send(obj.json);
		},
	}


/////////////////////////////////////////////////////////////////////////////////
// EXPORTS

	try {
		STG = require('dffrnt.confs');
		CFG = Tools.Fill(STG, CFG);
	} catch (e) {}


	// Globals
		const Dbg 	= CFG.debug || false;
		const LG 	= Log;
		const TLS 	= Tools;
		const JSN 	= Json;

		export {
			colors, Assign, Imm, StrTime, ROOTD, LJ, path, os, fs,
			ARGS, TYPE, EXTEND, HIDDEN, DEFINE, NIL, UoN, IaN, IS,
			ISS, OF, FOLDER, DCT, RGX, FRMT, CLM, CLMNS, ELOGR,
			preARGS, Dbg, LG, TLS, JSN
		};

		const UTILS = {
			colors, Assign, Imm, StrTime, ROOTD, LJ, path, os, fs,
			ARGS, TYPE, EXTEND, HIDDEN, DEFINE, NIL, UoN, IaN, IS,
			ISS, OF, FOLDER, DCT, RGX, FRMT, CLM, CLMNS, ELOGR,
			preARGS, Dbg, LG, TLS, JSN
		};

		export default UTILS;


/////////////////////////////////////////////////////////////////////////////////////////////
// TESTING

	// console.log((
		// 	// "\n%s, to the %!(Stuff:[%(v)s]{&:(,| and) the })a!\n" +
		// 	// "As well as to; %!{%(k)s. %(v<<Names>>)s|;/ & }s!\n" +
		// 	// "Of course, let's not forget our..." +
		// 	// "%!{%(k)s;\\n%(v<<Planets>>)s}s!\n"
		// 	"\n" +
		// 	"%!{%!(v)s%!(k|-/\tAS\t|@C/gray)s|;/,\\n \t|-/SELECT\t}s\n" +
		// 	"%{%!(k|^/U)s\t%!(v<<TABLES>>)s|;/\\n|-/FROM}s\n" +
		// 	"%!{%!(k)s\t%!(v<<CLAUSES>>)s|;/\\n}s" +
		// 	"%!{%!([GROUP BY,ORDER BY])s\t%!(v<<LIST>>)s|;/\\n}s" +
		// 	"%!{%!([LIMIT,OFFSET])s\t%!(v)s|;/\\n}s" +
		// 	"\n"
		// ).format2(
		// 	'hello', [
		// 		'world', 'moon', '', 'stars'
		// 	], {
		// 		Mr:  { first: 'Arian', 	  middle: 'LeShaun',   last: 'Johnson' },
		// 		Ms:  { first: 'LindyAnn', middle: 'Christina', last: 'Ephraim' },
		// 	}, {
		// 		planets: [
		// 			'Mercury', 'Venus', 'Mars', 'Saturn',
		// 			'Jupiter', 'Uranus', 'Neptune', 'Pluto'
		// 		]
		// 	}, FRMT2({
		// 		'Names': 	"%(first)s %(middle)s %(last)s",
		// 		'Planets': 	"%[%s|;/, \\n|&/ & \\n]s",
		// 	}, [])
		// )
	// );

	// console.log((

		// 	"\n" +
		// 	"%!{%!(v)s%!(k|-/\tAS\t|@C/gray)s|;/,\\n \t|-/SELECT\t}s\n" +
		// 	"%{%!(k|^/U)s\t%!(v<<TABLES>>)s|;/\\n|-/FROM}s\n" +
		// 	"%!{%!(k)s\t%!(v<<CLAUSES>>)s|;/\\n}s" +
		// 	"%!{%!([GROUP BY,ORDER BY])s\t%!(v<<LIST>>)s|;/\\n}s" +
		// 	"%!{%!([LIMIT,OFFSET])s\t%!(v)s|;/\\n}s" +
		// 	"\n"
		// ).format({
		// 		'tid': 		'ct.client_text_id',
		// 		'name': 	'ct.client_name',
		// 		'brand': 	 'b.brand_name',
		// 		'live': 	'ct.live_date',
		// 		'sid': 		'ct.status_id',
		// 		'hid': 		'ct.hotel_code',
		// 		'nid': 		'ct.navision_code',
		// 		'cid': 		'ct.client_id',
		// 	},
		// 	DCT().push('', { clients: 			{ AS: 'ct' } })
		// 		 .push('INNER JOIN', { client_brands: 		{ AS:  'b', CLS: { ON: 'b.brand_id', 		"=": 'ct.brand_id'		} } })
		// 		 .push('INNER JOIN', { client_isp: 		 	{ AS:  'i', CLS: { ON: 'i.client_id', 		"=": 'ct.client_id' 	} } })
		// 		 .push('INNER JOIN', { client_network_info: { AS:  'n', CLS: { ON: 'n.client_isp_id', 	"=":  'i.client_isp_id' } } })
		// 	, {
		// 		WHERE: 		{ 'ct.status_id': 	{ IN: '(1,2,3,4,5)' } },
		// 		'AND': 		{  'b.brand_id': 	{ IS: 'NOT NULL' 	} },
		// 		':TERMS:': 	{ },
		// 	}, new FRMT({
		// 		'KEYWORD': 	"%|^/U|s",
		// 		'COLUMNS': 	"%[%!s|;/,\\n\t]s",
		// 		'TABLES':  	"%!{%!(k)s%!(v<<ALIAS,EXT,JOINS>>)s}s",
		// 		'ALIAS': 	"%!(AS|-/\t%|//^/U|//s\t|@C/gray)s",
		// 		'EXT': 		"%!(DB|-/\tIN\t)s",
		// 		'JOINS': 	"%!(CLS<<OPS>>)s",
		// 		'INTO': 	"%[%!s|;/, \\n \t |-/(\\n|+/\\n)//]s",
		// 		'VALUES':  	"%![%s|;/, \\n \t |-/VALUES (\\n|+/\\n)//]s",
		// 		'SET': 		"%!{%!(k<<DOT>>)s\t%(=)s\t%!(v<<STRING>>)s|;/,\\n \t}s ",
		// 		'COMPARE': 	"%!{%!(k|-/\t|+/\t)s%!(v|-/\t)s}s",
		// 		'CLAUSES': 	"%!{%!(k<<DOT>>)s%!(v<<OPS>>)s}s",
		// 		'OPS': 		"%!([WHERE,ON,AND,OR,=,<>,>,<,>=,<=,LIKE,RLIKE,IN,IS,IS NOT,BETWEEN]|-/\t%s\t)s",
		// 		'STRING': 	"'%s'",
		// 		'DOT': 		"%s",
		// 		'OPTS': 	"%!{%!(v)s}s",
		// }, ['']))
		// .toColumns({
		// 	delimiter: 	'\t',
		// 	suffix: 	false,
		// 	align: 		{
		// 		3: '+'
		// 	},
		// 	border: 	null, //' | ',
		// 	callback: 	function callback (v) {
		// 		var res =  v.align('\\.', '-').align("',?", '-');
		// 		return res;
		// 	},
		// 	debug: 		false,
		// })
		// .colored({
		// 	ltGreen:  	/([^']+\b(?='))/g,
		// 	gray: 		{ '/': /([^.])([^.\s]+(?=\.))|(\.)([^.\s]+)/g, '$': 2 },
		// 	magenta: 	/(\.|[<=>])/g,
		// 	ltYellow: 	{ '/': /([^\w])((?:\d+)(?![\dm']|\x1b))/g, '$': 2 },
		// 	ltBlue: 	/(:\w+:)/g,
		// 	ltCyan: 	(
		// 		"/(\\b(?:(?:SELECT|INSERT)(?:\\s+INTO)?|UPDATE|SET|VALUES|" +
		// 		"FROM|(?:INNER|OUTER|FULL|LEFT|RIGHT)\\s+JOIN|AS|WHERE|" +
		// 		"ON|AND|OR|NULL|LIKE|RLIKE|IN|IS|NOT|BETWEEN)\\b)/gi"
		// 	),
		// })
		// .match(/([(](?:\x1b\[\d+m\d+\x1b\[\d+m,?)+[)])/)[1].len
		// .inColor()
	// );

