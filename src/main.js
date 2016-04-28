import shell from "shelljs";
import fs from "fs";
import logUpdate from "log-update";

const VERSIONS = [
	"15.0.1",
	"15.0.0-rc.2",
	"15.0.0-rc.1",
	"15.0.0",
	"0.15.0-alpha.1",
	"0.14.8",
	"0.14.7",
	"0.14.6",
	"0.14.5",
	"0.14.4",
	"0.14.3",
	"0.14.2",
	"0.14.1",
	"0.14.0-rc1",
	"0.14.0-beta3",
	"0.14.0-beta2",
	"0.14.0-beta1",
	"0.14.0-alpha3",
	"0.14.0-alpha2",
	"0.14.0-alpha1",
	"0.14.0",
	"0.13.3",
	"0.13.2",
	"0.13.1",
	"0.13.0-rc2",
	"0.13.0-rc1",
	"0.13.0-beta.2",
	"0.13.0-beta.1",
	"0.13.0-alpha.2",
	"0.13.0-alpha.1",
	"0.13.0",
	"0.12.2",
	"0.12.1",
	"0.12.0-rc1",
	"0.12.0",
	"0.11.2",
	"0.11.1",
	"0.11.0-rc1",
	"0.11.0",
	"0.10.0-rc1",
	"0.10.0",
	"0.9.0-rc1",
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
	versions: []
};

VERSIONS.reverse();
VERSIONS.forEach( ( version, index ) => {
	const gzippedRegex = /Original size: (.+)\nCompressed size: (.+)/;
	if ( !fileExists( `vendor/react-${ version }.js` ) ) {
		shell.exec( `curl https://cdnjs.cloudflare.com/ajax/libs/react/${ version }/react.js --output vendor/react-${ version }.js` );
	}
	const reactGzipped = shell.exec( `gzipped vendor/react-${ version }.js`, { silent: true } ).output;
	if ( !fileExists( `vendor/react-${ version }.min.js` ) ) {
		shell.exec( `curl https://cdnjs.cloudflare.com/ajax/libs/react/${ version }/react.min.js --output vendor/react-${ version }.min.js` );
	}
	const reactMinifiedGzipped = shell.exec( `gzipped vendor/react-${ version }.min.js`, { silent: true } ).output;
	const [ , size, sizeGzipped ] = gzippedRegex.exec( reactGzipped );
	const [ , minified, minifiedGzipped ] = gzippedRegex.exec( reactMinifiedGzipped );

	DATA.versions.push( {
		version,
		size,
		sizeGzipped,
		minified,
		minifiedGzipped
	} );

	logUpdate( `Progress... ${ ( ( ( index + 1 ) / VERSIONS.length ) * 100 ).toFixed( 1 ) }% - v${version}` );
} );

fs.writeFileSync( "data.json", JSON.stringify( DATA, null, 2 ), "utf8" );

logUpdate.done();

function fileExists( path ) {
	try {
		return fs.statSync( path ).isFile();
	} catch ( error ) {
		return false;
	}
}
