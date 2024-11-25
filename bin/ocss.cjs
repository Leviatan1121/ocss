#!/usr/bin/env node
const currentDir = process.cwd();

// Parsear argumentos
const args = process.argv.slice(2);
let delay = 5; // Default 5 segundos

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--delay' || args[i] === '-d') {
        const seconds = parseFloat(args[i + 1]);
        if (!isNaN(seconds) && seconds > 0) {
            delay = seconds;
        }
        break;
    }
}

try {
    const ocss = require('../dist/ocss.cjs');
    ocss(currentDir, delay * 1000); // Convertir a milisegundos
} catch (error) {
    console.error('Error al ejecutar OCSS:', error);
    process.exit(1);
} 