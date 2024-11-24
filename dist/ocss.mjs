import * as fs from 'fs/promises';
import path from 'path';

const filesData = {};

async function detectFiles(dir) {
    const files = [];

    // Lee todos los elementos en el directorio (usando readdir en lugar de readdirSync)
    const items = await fs.readdir(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath); // usando stat en lugar de statSync

        if (stat.isDirectory()) {
            // Si es un directorio, llamada recursiva
            const subFiles = await detectFiles(fullPath);
            files.push(...subFiles);
        } else if (item.endsWith('.o.css')) {
            // Si es un archivo .o.css, añadirlo a la lista
            files.push(fullPath);
        }
    }

    return files;
}

function processOCss(content) {
    const viewRegex = /([^:\n]+):view\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
    const viewTags = {};

    // 1. Extraer información y sustituir las tags
    let newContent = content.replace(viewRegex, (fullMatch, tag, contents) => {
        const basic = contents
            .split(/desktop\s*{|mobile\s*{/)[0]
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        const desktopMatch = contents.match(/desktop\s*{([^}]+)}/);
        const desktop = desktopMatch ?
            desktopMatch[1].split('\n').map(line => line.trim()).filter(Boolean) :
            [];

        const mobileMatch = contents.match(/mobile\s*{([^}]+)}/);
        const mobile = mobileMatch ?
            mobileMatch[1].split('\n').map(line => line.trim()).filter(Boolean) :
            [];

        viewTags[tag] = { basic, desktop, mobile };

        // Solo retornar la regla básica si hay contenido
        return basic.length > 0 ? `${tag} {\n    ${basic.join('\n    ')}\n}` : '';
    });

    // Eliminar líneas vacías múltiples que puedan quedar
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    // 2. Añadir media queries si hay reglas desktop o mobile
    const hasDesktop = Object.values(viewTags).some(tag => tag.desktop.length > 0);
    if (hasDesktop) {
        newContent += '\n@media screen and (orientation: landscape) {\n';
        Object.entries(viewTags).forEach(([tag, data]) => {
            if (data.desktop.length > 0) {
                newContent += `    ${tag} {\n        ${data.desktop.join('\n        ')}\n    }\n`;
            }
        });
        newContent += '}\n';
    }

    const hasMobile = Object.values(viewTags).some(tag => tag.mobile.length > 0);
    if (hasMobile) {
        newContent += '\n@media screen and (orientation: portrait) {\n';
        Object.entries(viewTags).forEach(([tag, data]) => {
            if (data.mobile.length > 0) {
                newContent += `    ${tag} {\n        ${data.mobile.join('\n        ')}\n    }\n`;
            }
        });
        newContent += '}';
    }

    return newContent;
}

export default function ocss(workingDir) {
    console.log('OCSS is running in:', workingDir);
    console.log('Change css files to .o.css extension');
    
    setInterval(async () => {
        const files = await detectFiles(workingDir);
        const newData = await Promise.all(files.map(async file => {
            const content = await fs.readFile(file, 'utf8');
            return { file, content };
        }));
        
        for (const { file, content } of newData) {
            if (!filesData[file] || filesData[file] !== content) {
                filesData[file] = content;
                const cssContent = processOCss(content);
                await fs.writeFile(file.replace('.o.css', '.css'), cssContent);
            }
        }
    }, 1000);
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const currentDir = process.cwd();
    ocss(currentDir);
}