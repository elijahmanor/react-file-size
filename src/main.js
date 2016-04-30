import shell from "shelljs";
import fs from "fs";
import logUpdate from "log-update";
import _ from "lodash";
import gzipSize from "gzip-size";
import prettyBytes from "pretty-bytes";

const VERSIONS = [
	"15.0.1",
	"15.0.0",
	"0.14.8",
	"0.14.7",
	"0.14.6",
	"0.14.5",
	"0.14.4",
	"0.14.3",
	"0.14.2",
	"0.14.1",
	"0.14.0",
	"0.13.3",
	"0.13.2",
	"0.13.1",
	"0.13.0",
	"0.12.2",
	"0.12.1",
	"0.12.0",
	"0.11.2",
	"0.11.1",
	"0.11.0",
	"0.10.0",
	"0.9.0",
	"0.8.0",
	"0.7.1",
	"0.7.0",
	"0.6.3",
	"0.6.2",
	"0.6.1",
	"0.6.0",
	"0.5.2",
	"0.5.1",
	"0.5.0",
	"0.4.2",
	"0.4.1",
	"0.4.0",
	"0.3.3",
	"0.3.2",
	"0.3.1",
	"0.3.0"
];

shell.exec( "mkdir vendor", { silent: true } );

const DATA = {
	react: {
		versions: []
	},
	"react-dom": {
		versions: []
	}
};

VERSIONS.reverse();

DATA.react.versions = getStatistics( "react", VERSIONS );
DATA[ "react-dom" ].versions = getStatistics( "react-dom", VERSIONS.filter( version => {
	const semver = version.split( "." );
	return semver[ 0 ] > 0 || semver[ 1 ] >= 14;
} ) );
DATA.combined = _.clone( DATA.react.versions );
DATA.combined = DATA.combined.map( item => {
	const dom = _.find( DATA[ "react-dom" ].versions, { version: item.version } );
	return {
		version: item.version,
		react: item.size,
		reactGz: item.sizeGzipped,
		reactMin: item.minified,
		reactMinGz: item.minifiedGzipped,
		reactDom: dom ? dom.size : 0,
		reactDomMin: dom ? dom.minified : 0
	};
} );

fs.writeFileSync( "data.json", JSON.stringify( DATA, null, 2 ), "utf8" );

logUpdate.done();

function getStatistics( name, versions ) {
	return versions.reduce( ( memo, version ) => {
		logUpdate( `Progress... ${ name }-${ version }` );

		const regex = /Original size: (.+)\nCompressed size: (.+)/;

		if ( !fileExists( `vendor/${ name }-${ version }.js` ) ) {
			shell.exec( `curl https://cdnjs.cloudflare.com/ajax/libs/react/${ version }/${ name }.js --output vendor/${ name }-${ version }.js` );
		}
		const size = fs.statSync( `vendor/${ name }-${ version }.js` ).size;
		const sizeGzipped = parseInt( shell.exec( `gzip-size vendor/${ name }-${ version }.js`, { silent: true } ).output );

		if ( !fileExists( `vendor/${ name }-${ version }.min.js` ) ) {
			shell.exec( `curl https://cdnjs.cloudflare.com/ajax/libs/react/${ version }/${ name }.min.js --output vendor/${ name }-${ version }.min.js` );
		}
		const minified = fs.statSync( `vendor/${ name }-${ version }.min.js` ).size;
		const minifiedGzipped = parseInt( shell.exec( `gzip-size vendor/${ name }-${ version }.min.js`, { silent: true } ).output );

		memo.push( {
			version,
			size,
			sizeGzipped,
			minified,
			minifiedGzipped
		} );

		return memo;
	}, [] );
}

function fileExists( path ) {
	try {
		return fs.statSync( path ).isFile();
	} catch ( error ) {
		return false;
	}
}
