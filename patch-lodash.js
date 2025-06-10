const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'node_modules/lodash/_root.js',
  'node_modules/lodash/core.js',
  'node_modules/lodash/lodash.js',
  'node_modules/lodash/core.min.js',
  'node_modules/lodash/lodash.min.js'
];

filesToPatch.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    
    // Replace the problematic lines for regular files
    const oldLine = "var freeSelf = typeof self == 'object' && self && self.Object === Object && self;";
    const newLine = "var freeSelf = typeof self == 'object' && self && self.Object === Object && self || (typeof global !== 'undefined' ? global : undefined);";
    
    if (content.includes(oldLine)) {
      content = content.replace(oldLine, newLine);
      hasChanges = true;
    }
    
    // Replace for minified files (different patterns)
    const minifiedPatterns = [
      {
        old: 'typeof self=="object"&&self&&self.Object===Object&&self',
        new: 'typeof self=="object"&&self&&self.Object===Object&&self||(typeof global!=="undefined"?global:undefined)'
      },
      {
        old: '"object"==typeof self&&self&&self.Object===Object&&self',
        new: '"object"==typeof self&&self&&self.Object===Object&&self||(typeof global!=="undefined"?global:undefined)'
      },
      {
        old: 'typeof self&&self&&self.Object===Object&&self',
        new: 'typeof self&&self&&self.Object===Object&&self||(typeof global!=="undefined"?global:undefined)'
      },
      {
        old: 'self&&self&&self.Object===Object&&self',
        new: 'self&&self&&self.Object===Object&&self||(typeof global!=="undefined"?global:undefined)'
      }
    ];
    
    minifiedPatterns.forEach(pattern => {
      if (content.includes(pattern.old)) {
        content = content.replace(new RegExp(pattern.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.new);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Patched ${filePath} for Next.js compatibility`);
    } else {
      console.log(`! ${filePath} already patched or different version`);
    }
  } else {
    console.log(`! ${filePath} not found`);
  }
});