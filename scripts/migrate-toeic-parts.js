import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataPath = path.join(__dirname, '../src/data/passages.json');
const backupPath = path.join(__dirname, '../src/data/passages.backup.before-part-migration.json');

function migrateTOEICParts() {
  console.log('Starting TOEIC part migration...');
  
  // Read the current data
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Create backup
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  console.log(`Backup created at: ${backupPath}`);
  
  let singleTextCount = 0;
  let singleChartCount = 0;
  let doubleCount = 0;
  let totalCount = 0;
  
  // Migrate each passage
  data.passages.forEach(passage => {
    totalCount++;
    
    // Determine TOEIC part based on isMultiDocument field
    if (passage.isMultiDocument === true) {
      passage.toeicPart = 'part7_double';
      doubleCount++;
    } else {
      // If isMultiDocument is false or undefined, treat as single passage
      // Further categorize by chart presence
      if (passage.hasChart === true || passage.chart) {
        passage.toeicPart = 'part7_single_chart';
        singleChartCount++;
      } else {
        passage.toeicPart = 'part7_single_text';
        singleTextCount++;
      }
    }
    
    // Ensure isMultiDocument is properly set
    if (passage.isMultiDocument === undefined) {
      passage.isMultiDocument = false;
    }
  });
  
  // Write the updated data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  console.log('Migration completed successfully!');
  console.log(`Total passages processed: ${totalCount}`);
  console.log(`Part 7 Single Text passages: ${singleTextCount}`);
  console.log(`Part 7 Single Chart passages: ${singleChartCount}`);
  console.log(`Part 7 Double passages: ${doubleCount}`);
  console.log(`Updated file: ${dataPath}`);
  
  // Data integrity check
  const verifyData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const missingParts = verifyData.passages.filter(p => !p.toeicPart);
  
  if (missingParts.length > 0) {
    console.error(`ERROR: ${missingParts.length} passages missing toeicPart field`);
    process.exit(1);
  } else {
    console.log('✓ Data integrity check passed - all passages have toeicPart field');
  }
}

migrateTOEICParts();

export { migrateTOEICParts };