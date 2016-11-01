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
			stubs.shelljs.exec.should.have.been.calledWith( "mkdir vendor" );
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
			isPromise( promise ).should.be.true();
		} );

		it( "should call getVersions with a cdnjs url to react", () => {
			getAllReactVersions();
			stubs[ "./utils" ].getVersions.should.have.been.calledWith( "https://cdnjs.com/libraries/react" );
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
			isPromise( promise ).should.be.true();
		} );

		it( "should call getStatistics for react and react-dom", () => {
			getAllStats();
			stubs[ "./utils" ].getStatistics.should.have.been.calledWith( "react" );
			stubs[ "./utils" ].getStatistics.should.have.been.calledWith( "react-dom" );
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
			stats.should.eql( [
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
				{ name: "react.js", version: "1.0.0"  },
				{ name: "react.js", version: "2.0.0" },
			];
			const reactDomStats = [
			];
			const stats = mapStats( versions, reactStats, reactDomStats );
			stats.should.eql( [
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
			stubs.fs.writeFileSync.should.have.been.calledWith( "~/tmp/hello.txt", `{
  "hello": "world"
}`, "utf8" );
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
			stubs.ora().start.should.have.been.called();
		} );

		it( "should have succeed ora status after getAllStatus", () => {
			bootstrap();
			stubs.ora().succeed.should.have.been.called();
		} );

		it( "should fail when getAllStats is rejected", () => {
			stubs = getStubs( {
				"./utils": {
					getStatistics: sinon.stub().returns( Promise.reject( { message: "error" } ) )
				}
			} );
			bootstrap = proxyquire( "../src/index.js", stubs ).bootstrap;
			bootstrap().then( () => {
				stubs.ora().fail.should.have.been.called();
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
				stubs.ora().fail.should.have.been.called();
			} );
		} );
	} );
} );
