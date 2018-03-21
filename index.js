
// ----------------------------------------------------------------------------------------------
// Handle Requires ------------------------------------------------------------------------------

	// All of our successive `require`s will be Babel'd
	// require('babel-register')({
		// presets: ['babel-preset-env'],
		// ignore:  function ignore(filename) {
		// 	try {
		// 		var RGX = /(node_modules\/)(?!dffrnt\.)[^\/]+(\/[^\/]+)*/,
		// 			MCH = filename.match(RGX);
		// 		console.log("IGNORE: %s | %s", !!MCH, filename);
		// 		return !!MCH;
		// 	} catch (e) {
		// 		console.log(e)
		// 		return true;
		// 	}
		// }
	// });

	// Start the server
	require('./lib/utils.js');
  
