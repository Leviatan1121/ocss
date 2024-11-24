#!/usr/bin/env node
const currentDir = process.cwd();
try {
    const ocss = require('../dist/ocss.cjs');
    ocss(currentDir);
} catch (error) {
    console.error('Error al ejecutar OCSS:', error);
    process.exit(1);
} 