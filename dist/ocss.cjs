const fs = require('fs');
const path = require('path');

const filesData = {};
const tempFilesData = {};

async function detectFiles(dir) {
    const files = [];

    // Lee todos los elementos en el directorio
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Si es un directorio, llamada recursiva
            const subFiles = await detectFiles(fullPath);
            files.push(...subFiles);
        } else if (item.endsWith('.o.css')) {
            // Si es un archivo .d.css, añadirlo a la lista
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


function ocss(workingDir, delay = 5000) {
    const checkDelay = delay / 2; // Dividimos el delay entre 2 para mantener el tiempo total
    console.log('OCSS is running in:', workingDir);
    console.log('Watching interval:', (delay/1000) + ' seconds');
    console.log('Change css files to .o.css extension');
    
    setInterval(async () => {
        const files = await detectFiles(workingDir);
        const newData = await Promise.all(files.map(async file => {
            const content = await fs.promises.readFile(file, 'utf8');
            return { file, content };
        }));
        
        // Verificar y procesar los archivos
        newData.forEach(({ file, content }) => {
            if (!filesData[file] || filesData[file] !== content) {
                if (!tempFilesData[file]) {
                    // Primera detección de cambio
                    tempFilesData[file] = content;
                } else if (tempFilesData[file] === content) {
                    // El contenido se mantiene estable, procesar el archivo
                    filesData[file] = content;
                    const cssContent = processOCss(content);
                    fs.writeFileSync(file.replace('.o.css', '.css'), cssContent);
                    delete tempFilesData[file]; // Limpiar el temporal
                } else {
                    // El contenido cambió, actualizar temporal
                    tempFilesData[file] = content;
                }
            }
        });
    }, checkDelay);
}

module.exports = ocss;