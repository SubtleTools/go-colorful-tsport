#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findTestFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.test.ts') && !item.includes('automated-cases') && !item.includes('automated-comparison')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

const testFiles = findTestFiles('test');
const args = ['test', ...testFiles];

console.log(`Running tests on ${testFiles.length} files...`);

const result = spawnSync('bun', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(result.status || 0);