import { getVersions, getStatistics } from "./utils";
import shell from "shelljs";
import ora from "ora";
import _ from "lodash";
import fs from "fs";

export function createFolder( folder ) {
	shell.exec( `mkdir ${ folder }`, { silent: true } );
}

export function getAllReactVersions() {
	return getVersions( "https://cdnjs.com/libraries/react" );
}

export function getAllStats( versions, spinner ) {
	return Promise.all( [
		getStatistics( "react", versions, spinner ),
		getStatistics( "react-dom", versions, spinner )
	] );
}

export function mapStats( versions, reactStats, reactDomStats ) {
	return versions.map( version => { // eslint-disable-line complexity
		const react = _.find( reactStats, { version, name: "react.js" } );
		const reactMinified = _.find( reactStats, { version, name: "react.min.js" } );
		const reactDom = _.find( reactDomStats, { version, name: "react-dom.js" } );
		const reactDomMinified = _.find( reactDomStats, { version, name: "react-dom.min.js" } );
		return {
			version,
			react: react.size ? react.size : 0,
			reactGz: react.sizeGzipped ? react.sizeGzipped : 0,
			reactMin: reactMinified ? reactMinified.size : 0,
			reactMinGz: reactMinified ? reactMinified.sizeGzipped : 0,
			reactDom: reactDom ? reactDom.size : 0,
			reactDomGz: reactDom ? reactDom.sizeGzipped : 0,
			reactDomMin: reactDomMinified ? reactDomMinified.size : 0,
			reactDomMinGz: reactDomMinified ? reactDomMinified.sizeGzipped : 0
		};
	} );
}

export function writeFile( path, data ) {
	fs.writeFileSync( path, JSON.stringify( data, null, 2 ), "utf8" );
}

export function bootstrap() {
	createFolder( "vendor" );

	const spinner = ora( "Getting list of available react versions from cdnjs.com..." ).start();
	return getAllReactVersions().then( versions => {
		spinner.text = "Getting statistics for react and react-dom...";
		getAllStats( versions, spinner ).then( ( [ reactStats, reactDomStats ] ) => {
			spinner.text = "Finished getting statistics for react and react-dom";
			const data = mapStats( versions, reactStats, reactDomStats );
			spinner.text = "Writing data.json with updated statistics for react and react-dom";
			writeFile( "data.json", { combined: data } );
			spinner.succeed();
		} ).catch( error => {
			spinner.text = `Houston, we have a problem: ${ error.message }`;
			spinner.fail();
		} );
	} ).catch( error => {
		spinner.text = `Houston, we have a problem: ${ error.message }`;
		spinner.fail();
	} );
}

bootstrap();
