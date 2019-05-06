#!/usr/bin/env node
const yargs = require('yargs');
const path = require('path');
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const webpackConfig = require('../webpack.config');

const express = require('express');
const app = express();

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

yargs
  .usage('$0 <cmd> [args]')
  .command({
    command: '[options]',
    aliases: ['$0'],
    handler: argv => {
      let entry = argv.entry;
      let isSvelteFile = argv.entry && argv.entry.indexOf('.svelte') >= 0;
      let isDevServer = argv.serve;
      let port = argv.port || 3000;

      let svelteAlias = {};

      // if is svelte file
      if (isSvelteFile) {
        svelteAlias = {
          SvelteEntry: path.resolve(process.cwd(), entry)
        };
        entry = path.resolve(__dirname, '../main.js');
      }

      const config = {
        ...webpackConfig,
        entry: [...webpackConfig.entry, entry],
        resolve: {
          ...webpackConfig.resolve,
          alias: {
            ...svelteAlias,
            svelte: path.resolve(__dirname, '../node_modules/svelte')
          }
        }
      };

      if (isDevServer) {
        const compiler = webpack(config);

        app.use(
          middleware(compiler, {
            noInfo: true,
            // publicPath: webpackConfig.output.publicPath,
            stats: {
              all: false
            }
          })
        );
        app.use(require('webpack-hot-middleware')(compiler));

        app.listen(port, () =>
          console.log(`\nSvelte app run on port http://localhost:${port} !\n`)
        );
      } else {
        webpack(config, (err, stats) => {
          if (err || stats.hasErrors()) {
            console.log('Error');
          }

          console.log(
            stats.toString({
              chunks: false,
              colors: true,
              entrypoints: false,
              children: false,
              modules: false
            })
          );
        });
      }
    },
    builder: yargs => {
      yargs.options({
        entry: {
          alias: 'e',
          default: './src/main.js',
          desc: 'Entry file',
          type: 'string'
        },
        port: {
          alias: 'p',
          default: 3000,
          desc: 'dev server port',
          type: 'number'
        },
        serve: {
          alias: 's',
          default: false,
          desc: 'start as dev server',
          type: 'boolean'
        }
      });
    }
  })
  .alias('help', 'h')
  .alias('version', 'v').argv;
