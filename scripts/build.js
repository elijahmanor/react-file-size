import { exec } from "shelljs";

const version = process.env.npm_package_version;

exec( `rm -rf public/${ version }` );
exec( `pug --obj data.json src/index.pug --out public/${ version }/` );
exec( `node-sass src/index.scss | postcss -c .postcssrc.json | cssmin > public/${ version }/index.min.css` );
exec( `mustache data.json src/index.mustache.js | uglifyjs > public/${ version }/index.min.js` );
