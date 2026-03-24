const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'frontend', 'src', 'components');
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We are replacing 'http://localhost:3000/api/...' or "http://localhost:3000/api/..."
    // Strategy: replace the exact substring http://localhost:3000 with ${import.meta.env.VITE_API_URL || 'http://localhost:3000'}
    // BUT we must also make sure that the string containing it is a template literal (`...`)
    // Because replacing inside '...' will just result in literal ${...} strings unless we change the quotes.
    
    // An alternative reliable way without parsing AST is transforming:
    // axios.get('http://localhost:3000/api/admin/leaves')
    // to
    // axios.get((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/admin/leaves')
    
    let modified = false;
    
    // Regex to find 'http://localhost:3000...' or `http://localhost:3000...` or "http://localhost:3000..."
    // We'll replace the text http://localhost:3000
    
    if (content.includes('http://localhost:3000')) {
      // Find all matches with quotes
      content = content.replace(/['"`]http:\/\/localhost:3000([^'"`]*)['"`]/g, (match, pathSuffix) => {
        return `(import.meta.env.VITE_API_URL || 'http://localhost:3000') + '${pathSuffix}'`;
      });
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
