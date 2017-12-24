#!/usr/bin/env node --harmony
const path = require( "path" );
const dir = path.basename( __dirname );

require( "babel-register" )( {
	ignore: false,
	only: new RegExp( path.join( dir, "src" ) )
} );
require( "./src/index.js" );
