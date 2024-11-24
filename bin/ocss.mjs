#!/usr/bin/env node
import ocss from '../dist/ocss.mjs';
const currentDir = process.cwd();
try {
    ocss(currentDir);
} catch (error) {
    console.error('Error al ejecutar OCSS:', error);
}