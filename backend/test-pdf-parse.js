const pdfParse = require('pdf-parse');
const fs = require('fs');

console.log('pdf-parse type:', typeof pdfParse);
console.log('pdf-parse:', pdfParse);

// Test with your actual PDF
const pdfPath = 'C:\\Users\\fisal\\Desktop\\IPetro-backend\\backend\\uploads\\reports\\Visual Inspection Report_V-001}.pdf';

fs.readFile(pdfPath, async (err, dataBuffer) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  try {
    console.log('Buffer size:', dataBuffer.length);
    const data = await pdfParse(dataBuffer);
    console.log('✅ Success!');
    console.log('Pages:', data.numpages);
    console.log('Text length:', data.text.length);
    console.log('First 300 chars:', data.text.substring(0, 300));
  } catch (err) {
    console.error('❌ Error:', err);
  }
});