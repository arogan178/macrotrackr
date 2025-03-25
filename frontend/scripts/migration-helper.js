// Migration helper script
// This script can be run with Bun to help identify files that need to be updated with new component imports
// Usage: bun run scripts/migration-helper.js

const fs = require('fs');
const path = require('path');

// Define old component names and their new replacements
const componentMappings = {
  'AddEntry.tsx': 'FormAddEntry.tsx',
  'AuthForm.tsx': 'FormAuth.tsx',
  'CalorieSearch.tsx': 'ComponentCalorieSearch.tsx',
  'DailySummary.tsx': 'CardDailySummary.tsx',
  'EditModal.tsx': 'ModalEdit.tsx',
  'EntryHistory.tsx': 'ListEntryHistory.tsx',
  'Navbar.tsx': 'NavbarMain.tsx',
};

// Define directories to search (relative to project root)
const searchDirectories = ['src/pages', 'src/components'];

// Define the root directory
const rootDir = path.join(__dirname, '..');

// Function to search for import statements in files
function searchForImports(dir, componentName) {
  const results = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results.push(...searchForImports(filePath, componentName));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Read the file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if it imports the component
      const importRegex = new RegExp(`import\\s+(?:{[^}]*}|[\\w\\s]+)\\s+from\\s+['"].*?\\/${componentName.replace('.tsx', '')}['"]`, 'g');
      
      if (importRegex.test(content)) {
        results.push({
          file: filePath.replace(rootDir, ''),
          componentName
        });
      }
    }
  }
  
  return results;
}

// Main execution
console.log('🔍 Searching for components that need to be updated...\n');

let allResults = [];

for (const [oldComponent, newComponent] of Object.entries(componentMappings)) {
  console.log(`Checking for imports of ${oldComponent}...`);
  
  for (const dir of searchDirectories) {
    const fullDir = path.join(rootDir, dir);
    if (fs.existsSync(fullDir)) {
      const results = searchForImports(fullDir, oldComponent);
      allResults = [...allResults, ...results];
    }
  }
}

if (allResults.length > 0) {
  console.log('\n📝 Files that need updating:');
  
  // Group results by file
  const fileMap = {};
  for (const result of allResults) {
    if (!fileMap[result.file]) {
      fileMap[result.file] = [];
    }
    fileMap[result.file].push(result.componentName);
  }
  
  // Display results grouped by file
  for (const [file, components] of Object.entries(fileMap)) {
    console.log(`\n${file}:`);
    for (const component of components) {
      console.log(`  - Replace "${component}" with "${componentMappings[component]}"`);
    }
  }
  
  console.log('\n🚀 Update these imports to use the new component names for better consistency.');
} else {
  console.log('\n✅ All components appear to be using the new naming conventions!');
}