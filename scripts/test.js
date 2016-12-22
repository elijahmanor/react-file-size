import { exec } from "shelljs";

const isWindows = process.platform === "win32";
const environment = isWindows ?
	"set BABEL_ENV=test&&" :
	"BABEL_ENV=test";

exec( `${ environment } mocha spec/ --require babel-register` );
