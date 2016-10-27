#!/usr/bin/env node --harmony
var path = require( "path" );
var dir = path.basename( __dirname );

require( "babel-register" )( {
	ignore: false,
	only: new RegExp( path.join( dir, "src" ) )
} );
require( "./src/index.js" );
