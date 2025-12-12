#!/usr/bin/env node

import { Command } from 'commander';
import loadPage from '../src/page-loader.js';

const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')
  .action((url, options) => {
    loadPage(url, options.output)
      .then((filePath) => {
        console.log(filePath);
      })
      .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      });
  });

program.parse(process.argv);
