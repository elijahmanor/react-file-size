import fs from "fs";
import request from "request-promise";
import cheerio from "cheerio";
import gzipSize from "gzip-size";
import when from "when";
import semver from "semver";

const CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs";

export function scrapeVersions( $ ) {
	return $( ".version-selector option" )
		.get().map( el => el.attribs.value )
		.filter( el => !~el.indexOf( "-" ) )
		.reverse();
}

export function getVersions( uri ) {
	return request( {
		uri,
		transform( body ) {
			return cheerio.load( body );
		}
	} ).then( $ => {
		return scrapeVersions( $ );
	} );
}

export function getFile( name, version, path, url, spinner ) {
	return new Promise( ( resolve, reject ) => {
		if ( fileExists( path ) ) {
			const body = fs.readFileSync( path, "utf8" );
			spinner.text = `${ name } v${ version }`;
			resolve( { name, version, path, url, body } );
		} else {
			request( { url, encoding: null } ).then( body => {
				fs.writeFile( path, body, e => {
					spinner.text = `${ name } v${ version }`;
					resolve( { name, version, path, url, body } );
				} );
			} ).catch( error => {
				spinner.text = `${ name } v${ version }`;
				resolve( { name, version, path, url, body: "" } );
			} );
		}
	} );
}

export function getStatistics( name, versions, spinner ) {
	return new Promise( ( resolve, reject ) => {
		spinner.text = `Getting statistics for ${ name }...`;

		const promises = versions.reduce( ( memo, version ) => {
			memo.push(
				getFile(
					`${ name }.js`,
					version,
					`vendor/${ name }-${ version }.js`,
					semver.lt( version, "16.0.0" ) ?
						`${ CDN_BASE }/${ name }/${ version }/${ name }.js` :
						`${ CDN_BASE }/${ name }/${ version }/cjs/${ name }.development.js`,
					spinner
				) );
			memo.push(
				getFile(
					`${ name }.min.js`,
					version,
					`vendor/${ name }-${ version }.min.js`,
					semver.lt( version, "16.0.0" ) ?
						`${ CDN_BASE }/${ name }/${ version }/${ name }.min.js` :
						`${ CDN_BASE }/${ name }/${ version }/cjs/${ name }.production.min.js`,
					spinner
				) );
			return memo;
		}, [] );
		resolve( when.reduce( promises, ( memo, value ) => {
			memo.push( {
				name: value.name,
				version: value.version,
				path: value.path,
				url: value.url,
				size: value.body.length,
				sizeGzipped: value.body.length ? gzipSize.sync( value.body ) : 0
			} );
			return memo;
		}, [] ) );
	} );
}

export function fileExists( path ) {
	try {
		return fs.statSync( path ).isFile();
	} catch ( error ) {
		return false;
	}
}
