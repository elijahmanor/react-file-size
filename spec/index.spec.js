import sinon from "sinon";
import proxyquire from "proxyquire";
import { isPromise } from "./helpers";
import { merge } from "lodash";
import assert from "power-assert";

const defaults = {
	fs: {
		writeFileSync: sinon.stub().returns( "readFileSync" )
	},
	ora: sinon.stub().returns( {
		start: sinon.stub().returnsThis(),
		succeed: sinon.stub().returnsThis(),
		fail: sinon.stub().returnsThis()
	} ),
	shelljs: {
		exec: sinon.stub()
	},
	"./utils": {
		getVersions: sinon.stub().returns( Promise.resolve( [
			"1.0.0",
			"2.0.0"
		] ) ),
		getStatistics: sinon.stub().returns( Promise.resolve( [
			{ name: "react.js", version: "1.0.0", size: 0, sizeGzipped: 0 },
			{ name: "react.min.js", version: "1.0.0", size: 0, sizeGzipped: 0 },
			{ name: "react.js", version: "2.0.0", size: 0, sizeGzipped: 0 },
			{ name: "react.min.js", version: "2.0.0", size: 0, sizeGzipped: 0 },
			{ name: "react-dom.js", version: "1.0.0", size: 0, sizeGzipped: 0 },
			{ name: "react-dom.min.js", version: "1.0.0", size: 0, sizeGzipped: 0 },
			{ name: "react-dom.js", version: "2.0.0", size: 0, sizeGzipped: 0 },
			{ name: "react-dom.min.js", version: "2.0.0", size: 0, sizeGzipped: 0 }
		] ) )
	}
};

function getStubs( options ) {
	return merge( {}, defaults, options );
}

describe( "Index", () => {
	describe( "createFolder", () => {
		let stubs, createFolder;

		beforeEach( () => {
			stubs = getStubs();
			createFolder = proxyquire( "../src/index.js", stubs ).createFolder;
		} );

		it( "should create a vendor folder", () => {
			createFolder( "vendor" );
			assert( stubs.shelljs.exec.calledWith( "mkdir vendor" ) );
		} );
	} );

	describe( "getAllReactVersions", () => {
		let stubs, getAllReactVersions;

		beforeEach( () => {
			stubs = getStubs();
			getAllReactVersions = proxyquire( "../src/index.js", stubs ).getAllReactVersions;
		} );

		it( "should return a promise", () => {
			const promise = getAllReactVersions();
			assert( isPromise( promise ) );
		} );

		it( "should call getVersions with a cdnjs url to react", () => {
			getAllReactVersions();
			const getVersions = stubs[ "./utils" ].getVersions;
			assert( getVersions.calledWith( "https://cdnjs.com/libraries/react" ) );
		} );
	} );

	describe( "getAllStats", () => {
		let stubs, getAllStats;

		beforeEach( () => {
			stubs = getStubs();
			getAllStats = proxyquire( "../src/index.js", stubs ).getAllStats;
		} );

		it( "should return a promise", () => {
			const promise = getAllStats();
			assert( isPromise( promise ) );
		} );

		it( "should call getStatistics for react and react-dom", () => {
			getAllStats();
			const getStatistics = stubs[ "./utils" ].getStatistics;
			assert( getStatistics.calledWith( "react" ) );
			assert( getStatistics.calledWith( "react-dom" ) );
		} );
	} );

	describe( "mapStats", () => {
		let stubs, mapStats;

		beforeEach( () => {
			stubs = getStubs();
			mapStats = proxyquire( "../src/index.js", stubs ).mapStats;
		} );

		it( "should coalesce react version stats", () => {
			const versions = [ "1.0.0", "2.0.0" ];
			const reactStats = [
				{ name: "react.js", version: "1.0.0", size: 123, sizeGzipped: 120 },
				{ name: "react.min.js", version: "1.0.0", size: 12, sizeGzipped: 10 },
				{ name: "react.js", version: "2.0.0", size: 234, sizeGzipped: 230 },
				{ name: "react.min.js", version: "2.0.0", size: 23, sizeGzipped: 20 }
			];
			const reactDomStats = [
				{ name: "react-dom.js", version: "1.0.0", size: 123, sizeGzipped: 120 },
				{ name: "react-dom.min.js", version: "1.0.0", size: 12, sizeGzipped: 10 },
				{ name: "react-dom.js", version: "2.0.0", size: 234, sizeGzipped: 230 },
				{ name: "react-dom.min.js", version: "2.0.0", size: 23, sizeGzipped: 20 }
			];
			const stats = mapStats( versions, reactStats, reactDomStats );
			assert.deepEqual( stats, [
				{
					version: "1.0.0",
					react: 123,
					reactDom: 123,
					reactDomMin: 12,
					reactGz: 120,
					reactMin: 12,
					reactMinGz: 10
				},
				{
					version: "2.0.0",
					react: 234,
					reactDom: 234,
					reactDomMin: 23,
					reactGz: 230,
					reactMin: 23,
					reactMinGz: 20
				} ]
			);
		} );

		it( "should default to zero bytes if size is undefined", () => {
			const versions = [ "1.0.0", "2.0.0" ];
			const reactStats = [
				{ name: "react.js", version: "1.0.0" },
				{ name: "react.js", version: "2.0.0" }
			];
			const reactDomStats = [
			];
			const stats = mapStats( versions, reactStats, reactDomStats );
			assert.deepEqual( stats, [
				{
					version: "1.0.0",
					react: 0,
					reactDom: 0,
					reactDomMin: 0,
					reactGz: 0,
					reactMin: 0,
					reactMinGz: 0
				},
				{
					version: "2.0.0",
					react: 0,
					reactDom: 0,
					reactDomMin: 0,
					reactGz: 0,
					reactMin: 0,
					reactMinGz: 0
				} ]
			);
		} );
	} );

	describe( "writeFile", () => {
		let stubs, writeFile;

		beforeEach( () => {
			stubs = getStubs();
			writeFile = proxyquire( "../src/index.js", stubs ).writeFile;
		} );

		it( "should write out formatted JSON", () => {
			writeFile( "~/tmp/hello.txt", { hello: "world" } );
			const writeFileSync = stubs.fs.writeFileSync;
			assert( writeFileSync.calledWith( "~/tmp/hello.txt", `{
  "hello": "world"
}`, "utf8" ) );
		} );
	} );

	describe( "bootstrap", () => {
		let stubs, bootstrap;

		beforeEach( () => {
			stubs = getStubs();
			bootstrap = proxyquire( "../src/index.js", stubs ).bootstrap;
		} );

		it( "should have started ora status", () => {
			bootstrap();
			assert( stubs.ora().start.called );
		} );

		it( "should have succeed ora status after getAllStatus", () => {
			bootstrap();
			assert( stubs.ora().succeed.called );
		} );

		it( "should fail when getAllStats is rejected", () => {
			stubs = getStubs( {
				"./utils": {
					getStatistics: sinon.stub().returns( Promise.reject( { message: "error" } ) )
				}
			} );
			bootstrap = proxyquire( "../src/index.js", stubs ).bootstrap;
			bootstrap().then( () => {
				assert( stubs.ora().fail.called );
			} );
		} );

		it( "should fail when getAllReactVersions is rejected", () => {
			stubs = getStubs( {
				"./utils": {
					getVersions: sinon.stub().returns( Promise.reject( { message: "error" } ) )
				}
			} );
			bootstrap = proxyquire( "../src/index.js", stubs ).bootstrap;
			bootstrap().then( () => {
				assert( stubs.ora().fail.called );
			} );
		} );
	} );
} );
