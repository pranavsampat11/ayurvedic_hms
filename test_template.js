import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

// Step 1: Load the docx template
const content = fs.readFileSync(
  path.resolve('./public/templates/ipd_case_sheet_template_clean.docx'),
  'binary'
);

// Step 2: Load it into pizzip
const zip = new PizZip(content);

// Step 3: Load it into docxtemplater
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

// Step 4: Set your template variables
doc.setData({
  patient_name: 'Rahul Prakash',
});

// Step 5: Render the document
try {
  doc.render();
} catch (error) {
  console.error('❌ Template rendering failed:', error);
  throw error;
}

// Step 6: Generate the output buffer
const buf = doc.getZip().generate({ type: 'nodebuffer' });

// Step 7: Save the output
const outputPath = path.resolve('./output/IPD_Case_Sheet_Output.docx');
fs.writeFileSync(outputPath, buf);

console.log('✅ Word file created at:', outputPath);
