#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning React Native/Expo project...');

// Directories to clean
const dirsToClean = [
  'node_modules',
  '.expo',
  '.metro',
  'dist',
  'build',
  '.next',
  'coverage'
];

// Files to clean
const filesToClean = [
  'package-lock.json',
  'yarn.lock',
  '.watchmanconfig'
];

// Clean directories
dirsToClean.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️  Removing ${dir}...`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  Could not remove ${dir}: ${error.message}`);
    }
  }
});

// Clean files
filesToClean.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`🗑️  Removing ${file}...`);
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.log(`⚠️  Could not remove ${file}: ${error.message}`);
    }
  }
});

console.log('✅ Cleanup completed!');
console.log('📦 Run "npm install" to reinstall dependencies');
console.log('🚀 Run "npx expo start --clear" to start the project');

