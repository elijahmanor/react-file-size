import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import proxyquire from "proxyquire";
import dirtyChai from "dirty-chai";
import { isPromise } from "./helpers";
import { merge } from "lodash";

const should = chai.should();
chai.use( sinonChai );
chai.use( dirtyChai );

const defaults = {
	fs: {
		readFileSync: sinon.stub().returns( "readFileSync" ),
		writeFile: sinon.stub().callsArg( 2 ),
		statSync: sinon.stub().returnsThis(),
		isFile: sinon.stub().returns( true )
	},
	cheerio: {
		load: sinon.stub().returns( "" )
	},
	"gzip-size": {
		sync: sinon.stub().returns( 10 )
	},
	$: sinon.stub().returns( {
		get: sinon.stub().returns( [
			{ attribs: { value: "1.0.0" } },
			{ attribs: { value: "2.0.0" } },
			{ attribs: { value: "3.0.0" } }
		] ),
		map: sinon.stub().returnsThis()
	} ),
	"request-promise": sinon.stub().returns( Promise.resolve() )
};

function getStubs( options ) {
	return merge( {}, defaults, options );
}

describe( "Utils", () => {
	describe( "scrapeVersions", () => {
		let stubs, scrapeVersions;

		beforeEach( () => {
			stubs = getStubs();
			scrapeVersions = proxyquire( "../src/utils.js", stubs ).scrapeVersions;
		} );

		it( "should grab all of the version options", () => {
			scrapeVersions( stubs.$ );
			stubs.$.should.have.been.calledWith( ".version-selector option" );
		} );
	} );

	describe( "getVersions", () => {
		let stubs, getVersions;

		beforeEach( () => {
			stubs = getStubs( {
				"request-promise": sinon.stub().returns( Promise.resolve( defaults.$ ) )
			} );
			getVersions = proxyquire( "../src/utils.js", stubs ).getVersions;
		} );

		it( "should make a request to the supplied url", () => {
			getVersions( "http://elijahmanor.com" );
			const firstCall = stubs[ "request-promise" ].getCall( 0 );
			firstCall.args[ 0 ].uri.should.equal( "http://elijahmanor.com" );
		} );

		it( "should parse the body content with cheerio", () => {
			stubs = getStubs( {
				"request-promise": sinon.stub()
					.yieldsTo( "transform", "body" )
					.returns( Promise.resolve( defaults.$ ) )
			} );
			getVersions = proxyquire( "../src/utils.js", stubs ).getVersions;
			return getVersions( "http://elijahmanor.com" ).then( () => {
				stubs.cheerio.load.should.have.been.calledWith( "body" );
			} );
		} );

		it( "should return a list of versions", () => {
			return getVersions( "http://elijahmanor.com" ).then( versions => {
				versions.should.eql( [ "3.0.0", "2.0.0", "1.0.0" ] );
			} );
		} );
	} );

	describe( "fileExists", () => {
		let stubs, fileExists;

		beforeEach( () => {
			stubs = getStubs();
			fileExists = proxyquire( "../src/utils.js", stubs ).fileExists;
		} );

		it( "should check the file system for its stats", () => {
			fileExists( "/tmp/fileName.txt" );
			stubs.fs.statSync.should.have.been.calledWith( "/tmp/fileName.txt" );
		} );

		it( "should check to see if the path is a file", () => {
			fileExists( "/tmp/fileName.txt" );
			stubs.fs.isFile.should.have.been.called();
		} );

		it( "should return false if throws an error", () => {
			stubs = getStubs( {
				fs: {
					statSync: sinon.stub().throws()
				}
			} );
			fileExists = proxyquire( "../src/utils.js", stubs ).fileExists;
			const exists = fileExists( "/tmp/fileName.txt" );
			exists.should.equal( false );
		} );
	} );

	describe( "getFile", () => {
		let stubs, getFile;

		beforeEach( () => {
			stubs = getStubs();
			getFile = proxyquire( "../src/utils.js", stubs ).getFile;
		} );

		it( "should return a promise", () => {
			const promise = getFile( "name", "version", "path", "url", {} );
			isPromise( promise ).should.be.true();
		} );

		it( "should read the file if it already exists", () => {
			return getFile( "name", "version", "path", "url", {} ).then( file => {
				stubs.fs.readFileSync.should.be.calledWith( "path" );
			} );
		} );

		it( "should request the file if it doesn't exists", () => {
			stubs = getStubs( {
				fs: {
					statSync: sinon.stub().throws()
				}
			} );
			getFile = proxyquire( "../src/utils.js", stubs ).getFile;
			return getFile( "name", "version", "path", "url", {} ).then( file => {
				stubs[ "request-promise" ].should.have.been.called();
			} );
		} );

		it( "should return an empty body if request failed", () => {
			stubs = getStubs( {
				fs: {
					statSync: sinon.stub().throws()
				},
				"request-promise": sinon.stub().returns( Promise.reject() )
			} );
			getFile = proxyquire( "../src/utils.js", stubs ).getFile;
			return getFile( "name", "version", "path", "url", {} ).then( file => {
				should.not.exist( file.body );
			} );
		} );
	} );

	describe( "getStatistics", () => {
		let stubs, getStatistics;

		beforeEach( () => {
			stubs = getStubs();
			getStatistics = proxyquire( "../src/utils.js", stubs ).getStatistics;
		} );

		it( "should return a promise", () => {
			const promise = getStatistics( "name", "versions", {} );
			isPromise( promise ).should.be.true();
		} );

		it( "should get normal and minified files", () => {
			const versions = [ "1.0.0" ];
			return getStatistics( "name", versions, {} ).then( stats => {
				stats[ 0 ].name.should.equal( "name.js" );
				stats[ 1 ].name.should.equal( "name.min.js" );
			} );
		} );

		it( "should get gZip of 0 if file is empty", () => {
			stubs = getStubs( {
				fs: {
					readFileSync: sinon.stub().returns( "" )
				},
				"gzip-size": {
					sync: sinon.stub().returns( 0 )
				}
			} );
			getStatistics = proxyquire( "../src/utils.js", stubs ).getStatistics;
			const versions = [ "1.0.0" ];
			return getStatistics( "name", versions, {} ).then( stats => {
				stats[ 0 ].sizeGzipped.should.equal( 0 );
			} );
		} );

		it( "should get normal and minified files for each version provided", () => {
			const versions = [ "2.0.0", "3.0.0" ];
			return getStatistics( "name", versions, {} ).then( stats => {
				stats.length.should.equal( 4 );
				stats[ 0 ].path.should.equal( "vendor/name-2.0.0.js" );
				stats[ 1 ].path.should.equal( "vendor/name-2.0.0.min.js" );
				stats[ 2 ].path.should.equal( "vendor/name-3.0.0.js" );
				stats[ 3 ].path.should.equal( "vendor/name-3.0.0.min.js" );
			} );
		} );
	} );
} );
