const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\ianache\\Desktop\\DATA\\01-DOCUMENTOS\\02-PROYECTOS';

function searchDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }
      if (stats.isDirectory()) {
        if (file === 'node_modules' || file === '.git' || file === '.next' || file === '.venv') {
          continue;
        }
        searchDir(fullPath);
      } else if (stats.isFile()) {
        // Search file name or content
        if (file.includes('informe-mensual') || file.includes('horas-proyecto')) {
          console.log("Found matching filename:", fullPath);
        }
        // Read file content if it's text
        if (file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.yaml') || file.endsWith('.yml')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('informe-mensual-horas-proyecto') || content.includes('Informe mensual de horas por proyecto')) {
              console.log("Found match inside content of:", fullPath);
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

console.log("Starting search...");
searchDir(rootDir);
console.log("Search finished.");
