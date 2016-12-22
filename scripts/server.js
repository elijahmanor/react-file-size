import { exec } from "shelljs";

const {
	npm_package_version: version,
	npm_package_config_port: port
} = process.env;

exec( `http-server public/${ version } -p ${ port }`, { async: true } );
exec( `opn http://localhost:${ port }` );
