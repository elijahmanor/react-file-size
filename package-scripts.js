module.exports = {
  scripts: {
    default: 'node index.js && nps build,server',
    test: {
		default: {
			script: 'nps lint,test.run',
			description: 'Run our mocha unit tests'
		},
		run: 'BABEL_ENV=test mocha spec/ --require babel-register'
	},
    cover: {
      default: 'nyc npm t && nps cover.clean',
      open: 'open coverage/index.html',
	  clean: 'rm -rf .nyc_output'
    },
    lint: {
      default: 'nps lint.js,lint.css,lint.css.fix',
      js: 'eslint --cache --fix ./',
      css: {
        default: 'stylelint \'**/*.scss\' --syntax scss',
        fix: 'stylefmt -R src/'
      }
    },
    watch: {
      default: 'nps --parallel watch.test,watch.lint',
      test: 'npm t -- --watch',
      lint: 'onchange \'src/**/*.js\' \'src/**/*.scss\' -- npm run lint'
    },
    build: {
      default: 'nps build.clean,build.html,build.css,build.js',
      clean: 'rm -rf public/$npm_package_version',
      html: 'pug --obj data.json src/index.pug --out public/$npm_package_version/',
      css: 'node-sass src/index.scss | postcss -c .postcssrc.json | cssmin > public/$npm_package_version/index.min.css',
      js: 'mustache data.json src/index.mustache.js | uglifyjs > public/$npm_package_version/index.min.js'
    },
    server: {
      default: 'nps --parallel server.create,server.launch',
      create: 'http-server public/$npm_package_version -p $npm_package_config_port',
      launch: 'open http://localhost:$npm_package_config_port'
    }
  }
};
