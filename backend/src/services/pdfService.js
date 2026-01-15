// backend/src/services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const db = require('../config/db');
const path = require('path');
const { 
  formatReportDate, 
  groupObservationsBySection,
  generateRecommendations,
  getNDTSummary,
  parseFindings  
} = require('../utils/reportHelper');

class PDFService {

async getFindingsSummaryForReport(inspectionId) {
  try {
    const result = await db.query(
      'SELECT * FROM findings_summary WHERE inspection_id = $1',
      [inspectionId]
    );
    
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Error fetching findings summary:', err);
    return null;
  }
}

async generateInspectionReport(reportData) {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        inspection,
        vessel,
        observations,
        photos,
        inspector,
        reviewer
      } = reportData;

      // Create uploads directory if not exists
      const uploadsDir = path.join(__dirname, '../../uploads/reports');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate filename
      const filename = `Visual Inspection Report_${vessel.tag_no}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ✅ FILTER: Get only photos that are linked to observations
      const linkedPhotoIds = new Set();
      observations.forEach(obs => {
        if (obs.photo_ids && Array.isArray(obs.photo_ids)) {
          obs.photo_ids.forEach(photoId => linkedPhotoIds.add(photoId));
        }
      });

      const linkedPhotos = photos.filter(photo => linkedPhotoIds.has(photo.photo_id));

      console.log(`Total photos: ${photos.length}, Linked photos: ${linkedPhotos.length}`);

      // Generate report pages
      await this.generateFindingsPage(doc, reportData);
      
      // Generate photos pages ONLY if there are linked photos
      if (linkedPhotos && linkedPhotos.length > 0) {
        // Pass filtered photos with inspector data
        await this.generatePhotosPages(doc, { 
          ...reportData, 
          photos: linkedPhotos,
          inspector,
          reviewer 
        });
      }

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      stream.on('finish', () => {
        resolve({
          filename,
          filepath,
          url: `/uploads/reports/${filename}`
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
}

drawLine(doc, y = null) {
  const currentY = y || doc.y;
  doc.moveTo(40, currentY)
     .lineTo(555, currentY)
     .stroke();
}

async generateFindingsPage(doc, reportData) {
  const { inspection, vessel, observations, inspector, reviewer } = reportData;
  const findingsSummary = await this.getFindingsSummaryForReport(inspection.inspection_id);
  const doshRegistration = inspection.dosh_registration;

  const leftMargin = 40;
  const rightMargin = 555;
  const pageWidth = rightMargin - leftMargin;

  console.log('📊 Report data check:');
  console.log('  Inspector:', inspector);
  console.log('  Reviewer:', reviewer);
  console.log('  Inspection reviewer_id:', inspection.reviewer_id);
  
  // Top border
  this.drawLine(doc, 40);

  // Header table
  doc.rect(40, 40, 100, 60).stroke();
  doc.rect(140, 40, 260, 60).stroke();
  doc.rect(400, 40, 155, 60).stroke();

  // Title
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('MAJOR TURNAROUND 2025', 145, 50, { width: 250, align: 'center' });
  doc.fontSize(11);
  doc.text('PRESSURE VESSEL INSPECTION REPORT', 145, 68, { width: 250, align: 'center' });

  // Report info
  doc.fontSize(8).font('Helvetica');
  doc.text('Report no.:', 405, 45);
  doc.font('Helvetica-Bold');
  doc.text(inspection.report_number || 'PLANT/01/VR-001/TA2025', 405, 55);
  doc.font('Helvetica');
  doc.text('Report date:', 405, 68);
  doc.text(formatReportDate(inspection.created_at || new Date()), 405, 78);

  // Equipment details
  const detailsY = 105;
  doc.text('Equipment tag no: ' + vessel.tag_no, leftMargin, detailsY);
  doc.text('Plant/Unit/Area: Plant '+ vessel.plant_unit, 400, detailsY);
  doc.text('Equipment description: ' + (vessel.description || ''), leftMargin, detailsY + 12);
  doc.text('DOSH registration no.: ' + (doshRegistration  || null), 400, detailsY + 12);



  // FINDINGS, NDTs & RECOMMENDATIONS Header with grey background
  const findingsHeaderY = detailsY + 35;
  const headerHeight = 18;
  
  // Draw grey background rectangle
  doc.rect(leftMargin, findingsHeaderY, pageWidth, headerHeight)
     .fillAndStroke('#D3D3D3', '#000000');
  
  // Reset fill color to black for text
  doc.fillColor('#000000');
  
  // Center-aligned header text
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('FINDINGS, NDTs & RECOMMENDATIONS', leftMargin, findingsHeaderY + 5, {
    width: pageWidth,
    align: 'center'
  });
  
  // Line below header
  const afterHeaderY = findingsHeaderY + headerHeight;
  this.drawLine(doc, afterHeaderY);

  // Description text
  const conditionY = afterHeaderY + 8;
  doc.fontSize(7).font('Helvetica');
  const conditionText = 'Condition: With respect to the internal surface, describe and state location of any scales, oils or other deposits. Give location and extent of any corrosion and state whether active or inactive. State location and extent of any erosion, grooving, bulging, warping, cracking or similar condition. Report on any defective rivets bowed, loose or broken stays. State condition of all tubes, tube end, coils nipples, etc. Report condition of setting, linings, baffles, support, etc. Describe major changes or repairs made since last inspection.';
  
  doc.text(conditionText, leftMargin, conditionY, {
    width: pageWidth,
    align: 'justify',
    lineGap: 1
  });

  const conditionEndY = doc.y + 5;
  this.drawLine(doc, conditionEndY);

  // CONTINUE: FINDINGS section (starting after the condition line)
  let currentY = conditionEndY + 10;
  
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('FINDINGS', leftMargin, currentY);
  
  currentY += 13;
  doc.fontSize(8).font('Helvetica');
  const initialText = findingsSummary?.initial_inspection || 'Not applicable';
  doc.text(`Initial/Pre-Inspection - ${initialText}`, leftMargin, currentY);
  
  currentY += 13;
  doc.font('Helvetica-Bold');
  doc.text('Post/Final Inspection', leftMargin, currentY);
  doc.font('Helvetica');
  currentY += 10;
  
  if (findingsSummary?.post_inspection) {
    doc.text(findingsSummary.post_inspection, leftMargin, currentY, { width: 515, lineGap: 1 });
    currentY = doc.y + 10;
  }
  //doc.font('Helvetica');

  //currentY += 14;

  // Group observations
  //const { external, internal } = groupObservationsBySection(observations);

if (findingsSummary?.external_findings && findingsSummary.external_findings.length > 0) {
  doc.font('Helvetica-Bold').text('External', leftMargin, currentY);
  doc.font('Helvetica');
  currentY += 10;

  findingsSummary.external_findings.forEach((finding, index) => {
    const findingText = `1.${index + 1} ${finding.text}`;
    doc.fontSize(8);
    doc.text(findingText, leftMargin, currentY, { width: 515, lineGap: 1 });
    currentY = doc.y + 5;
  });
  currentY += 5;
}

// ✅ INTERNAL FINDINGS FROM SUMMARY (2.1, 2.2, 2.3...)
if (findingsSummary?.internal_findings && findingsSummary.internal_findings.length > 0) {
  doc.font('Helvetica-Bold').text('Internal', leftMargin, currentY);
  doc.font('Helvetica');
  currentY += 10;

  findingsSummary.internal_findings.forEach((finding, index) => {
    const findingText = `2.${index + 1} ${finding.text}`;
    doc.fontSize(8);
    doc.text(findingText, leftMargin, currentY, { width: 515, lineGap: 1 });
    currentY = doc.y + 5;
  });
  currentY += 5;
}
  // NON-DESTRUCTIVE TESTINGS
   currentY += 8;
  doc.font('Helvetica-Bold').text('NON-DESTRUCTIVE TESTINGS', leftMargin, currentY);
  doc.font('Helvetica');
  currentY += 10;

  const ndtText = findingsSummary?.ndt_testings || getNDTSummary(inspection);
  doc.fontSize(8);
  doc.text(ndtText, leftMargin, currentY, { width: 515 });
  currentY = doc.y + 8;


  // ✅ RECOMMENDATIONS (Filter out "Nil" and remove duplicate numbering)
 currentY += 8;


if (findingsSummary?.recommendations && Array.isArray(findingsSummary.recommendations) && findingsSummary.recommendations.length > 0) {
  doc.font('Helvetica-Bold').text('RECOMMENDATIONS', leftMargin, currentY);
doc.font('Helvetica');
currentY += 10;
  findingsSummary.recommendations.forEach((rec) => {
    // User already includes numbering in their text
    const recText = rec.text || rec;
    doc.fontSize(8);
    doc.text(recText, leftMargin, currentY, { width: 515, lineGap: 2 });
    currentY = doc.y + 5;
  });
} else {
  doc.fontSize(8);
  
}

  // Calculate space needed for signatures (fixed height)
  const signaturesHeight = 150;
  const pageBottomMargin = 50;
  const availableSpace = doc.page.height - pageBottomMargin - signaturesHeight;

  // If current content goes beyond available space, add new page
  if (doc.y > availableSpace) {
    doc.addPage();
  }

  // Position for signatures - always at same spot from bottom
  const signaturesY = doc.page.height - pageBottomMargin - signaturesHeight;
  doc.y = signaturesY;

  this.drawLine(doc, signaturesY);

  // THREE COLUMN BOXES FOR SIGNATURES
  const col1X = leftMargin;
  const col2X = 220;
  const col3X = 400;
  const col1Width = 175;
  const col2Width = 175;
  const col3Width = 155;
  const boxHeight = 40;

  // Draw boxes
  doc.rect(col1X, signaturesY, col1Width, boxHeight).stroke();
  doc.rect(col2X, signaturesY, col2Width, boxHeight).stroke();
  doc.rect(col3X, signaturesY, col3Width, boxHeight).stroke();

  // Labels
  doc.fontSize(8).font('Helvetica');
  doc.text('Inspected by:', col1X + 5, signaturesY + 5);
  doc.text('Reviewed by:', col2X + 5, signaturesY + 5);
  doc.text('Approved by (Client):', col3X + 5, signaturesY + 5);

  // ADD NAMES
  doc.font('Helvetica-Bold');
  doc.text(inspector?.name || '', col1X + 5, signaturesY + 20);
  doc.text(reviewer?.name || '', col2X + 5, signaturesY + 20);
  doc.font('Helvetica');

  // DOSH section
  const doshY = signaturesY + boxHeight + 8;
  doc.text('Recommendation/Comment by DOSH Officer (if applicable):', leftMargin, doshY);

  // DOSH box
  const doshBoxY = doshY + 12;
  const doshBoxHeight = 25;
  doc.rect(leftMargin, doshBoxY, 515, doshBoxHeight).stroke();

  // DOSH fields with vertical dividers
  doc.text('Name:', leftMargin + 5, doshBoxY + 8);
  doc.moveTo(leftMargin + 150, doshBoxY).lineTo(leftMargin + 150, doshBoxY + doshBoxHeight).stroke();

  doc.text('Signature:', leftMargin + 155, doshBoxY + 8);
  doc.moveTo(leftMargin + 350, doshBoxY).lineTo(leftMargin + 350, doshBoxY + doshBoxHeight).stroke();

  doc.text('Date:', leftMargin + 355, doshBoxY + 8);

  // Action taken section
  const actionY = doshBoxY + doshBoxHeight + 8;
  doc.text('Action taken by Plant 1 on recommendation by DOSH (if applicable):', leftMargin, actionY);

  // Action box
  const actionBoxY = actionY + 12;
  const actionBoxHeight = 25;
  doc.rect(leftMargin, actionBoxY, 515, actionBoxHeight).stroke();

  // Action fields with vertical dividers
  doc.text('Name:', leftMargin + 5, actionBoxY + 8);
  doc.moveTo(leftMargin + 150, actionBoxY).lineTo(leftMargin + 150, actionBoxY + actionBoxHeight).stroke();

  doc.text('Signature:', leftMargin + 155, actionBoxY + 8);
  doc.moveTo(leftMargin + 350, actionBoxY).lineTo(leftMargin + 350, actionBoxY + actionBoxHeight).stroke();

  doc.text('Date:', leftMargin + 355, actionBoxY + 8);

  
}


async generatePhotosPages(doc, reportData) {
  const { inspection, vessel, photos, observations, inspector } = reportData;
  const leftMargin = 40;
  const rightMargin = 555;
  const pageWidth = rightMargin - leftMargin;

  // Create observation lookup by photo_ids
  const observationsByPhoto = {};
  observations.forEach(obs => {
    if (obs.photo_ids && Array.isArray(obs.photo_ids)) {
      obs.photo_ids.forEach(photoId => {
        if (!observationsByPhoto[photoId]) {
          observationsByPhoto[photoId] = [];
        }
        observationsByPhoto[photoId].push(obs);
      });
    }
  });

  // Group photos by tag_number
  const photoGroups = {};
  photos.forEach(photo => {
    const group = photo.tag_number || 'ungrouped';
    if (!photoGroups[group]) {
      photoGroups[group] = [];
    }
    photoGroups[group].push(photo);
  });

  // Sort groups by tag_number
  const sortedGroups = Object.keys(photoGroups).sort((a, b) => {
    if (a === 'ungrouped') return 1;
    if (b === 'ungrouped') return -1;
    return parseInt(a) - parseInt(b);
  });

  // Process groups in sets of 3 per page
  const sectionsPerPage = 3;
  let groupIndex = 0;

  while (groupIndex < sortedGroups.length) {
    // Add new page for each set of sections
    doc.addPage();

    // ===== HEADER SECTION =====
    this.drawLine(doc, 40);
    doc.rect(40, 40, 100, 60).stroke();
    doc.rect(140, 40, 260, 60).stroke();
    doc.rect(400, 40, 155, 60).stroke();

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('MAJOR TURNAROUND 2025', 145, 50, { width: 250, align: 'center' });
    doc.fontSize(11);
    doc.text('PRESSURE VESSEL INSPECTION REPORT', 145, 68, { width: 250, align: 'center' });

    doc.fontSize(8).font('Helvetica');
    doc.text('Report no.:', 405, 45);
    doc.font('Helvetica-Bold');
    doc.text(inspection.report_number || 'PLANT/01/VR-001/TA2025', 405, 55);
    doc.font('Helvetica');
    doc.text('Report date:', 405, 68);
    doc.text(formatReportDate(inspection.created_at || new Date()), 405, 78);

    const detailsY = 105;
    doc.text('Equipment tag no: ' + vessel.tag_no, leftMargin, detailsY);
    doc.text('Plant/Unit/Area: Plant 1', 400, detailsY);
    doc.text('Equipment description: ' + (vessel.description || ''), leftMargin, detailsY + 12);
    doc.text('DOSH registration no.: ' + (inspection.dosh_registration || vessel.dosh_registration || 'MK PMT 1002'), 400, detailsY + 12);

    // ✅ PHOTOS REPORT HEADER (Grey background)
    const photosHeaderY = detailsY + 35;
    const headerHeight = 18;
    
    doc.rect(leftMargin, photosHeaderY, pageWidth, headerHeight)
       .fillAndStroke('#D3D3D3', '#000000');
    
    doc.fillColor('#000000');
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('PHOTOS REPORT', leftMargin, photosHeaderY + 5, { 
      width: pageWidth, 
      align: 'center' 
    });
    
    this.drawLine(doc, photosHeaderY + headerHeight);

    // ===== CONTENT AREA - 3 SECTIONS PER PAGE =====
    let currentY = photosHeaderY + headerHeight;
    const footerY = doc.page.height - 70;
    const availableHeight = footerY - currentY - 20;
    const sectionHeight = Math.floor(availableHeight / sectionsPerPage);

    // Process exactly 3 sections on this page (or remaining)
    const sectionsOnThisPage = Math.min(sectionsPerPage, sortedGroups.length - groupIndex);
    
    for (let sectionIndex = 0; sectionIndex < sectionsOnThisPage; sectionIndex++) {
      const groupNum = sortedGroups[groupIndex];
      const groupPhotos = photoGroups[groupNum];
      const maxPhotosPerSection = 4;

      // ===== SECTION BOX =====
      const sectionBoxY = currentY;
      const photoColumnWidth = 250;
      const textColumnX = leftMargin + photoColumnWidth + 10;
      const textColumnWidth = pageWidth - photoColumnWidth - 10;
      const sectionBoxHeight = sectionHeight;

      // Draw main container box
      doc.rect(leftMargin, sectionBoxY, pageWidth, sectionBoxHeight)
         .stroke('#000000');
      
      // Vertical divider between photos and text
      doc.moveTo(textColumnX - 5, sectionBoxY)
         .lineTo(textColumnX - 5, sectionBoxY + sectionBoxHeight)
         .stroke('#000000');

      // ✅ SECTION HEADER - Positioned on top-left border
      const sectionHeaderText = `Photo ${groupNum}`;
      const headerTextWidth = doc.widthOfString(sectionHeaderText, {
        font: 'Helvetica-Bold',
        fontSize: 9
      });
      const sectionHeaderWidth = headerTextWidth + 20;
      const sectionHeaderHeight = 16;
      
      const headerX = leftMargin;
      const headerY = sectionBoxY;
      
      doc.rect(headerX, headerY, sectionHeaderWidth, sectionHeaderHeight)
         .fillAndStroke('#000000', '#000000');
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text(sectionHeaderText, headerX + 10, headerY + 4);
      doc.fillColor('#000000');

      // ===== LEFT SIDE: FLEXIBLE PHOTO LAYOUT =====
      const photosToShow = groupPhotos.slice(0, maxPhotosPerSection);
      const photoCount = photosToShow.length;
      const photosStartY = sectionBoxY + 20;
      const availablePhotoWidth = photoColumnWidth - 20; // 10px padding on each side
      const availablePhotoHeight = sectionBoxHeight - 30; // 20px top + 10px bottom
      const photoSpacing = 8;

      // ✅ FLEXIBLE LAYOUT BASED ON PHOTO COUNT
      let photoLayout = [];

      if (photoCount === 1) {
        // 1 photo: Full size (centered)
        photoLayout = [{
          x: leftMargin + 10,
          y: photosStartY,
          width: availablePhotoWidth,
          height: availablePhotoHeight,
          index: 0
        }];
      } else if (photoCount === 2) {
        // 2 photos: Side by side (equal size)
        const photoWidth = (availablePhotoWidth - photoSpacing) / 2;
        const photoHeight = availablePhotoHeight;
        
        photoLayout = [
          {
            x: leftMargin + 10,
            y: photosStartY,
            width: photoWidth,
            height: photoHeight,
            index: 0
          },
          {
            x: leftMargin + 10 + photoWidth + photoSpacing,
            y: photosStartY,
            width: photoWidth,
            height: photoHeight,
            index: 1
          }
        ];
      } else if (photoCount === 3) {
        // 3 photos: 2 on top, 1 on bottom (centered)
        const topPhotoWidth = (availablePhotoWidth - photoSpacing) / 2;
        const topPhotoHeight = (availablePhotoHeight - photoSpacing) / 2;
        const bottomPhotoWidth = availablePhotoWidth * 0.6; // 60% width for bottom
        const bottomPhotoHeight = topPhotoHeight;
        
        photoLayout = [
          // Top left
          {
            x: leftMargin + 10,
            y: photosStartY,
            width: topPhotoWidth,
            height: topPhotoHeight,
            index: 0
          },
          // Top right
          {
            x: leftMargin + 10 + topPhotoWidth + photoSpacing,
            y: photosStartY,
            width: topPhotoWidth,
            height: topPhotoHeight,
            index: 1
          },
          // Bottom center
          {
            x: leftMargin + 10 + (availablePhotoWidth - bottomPhotoWidth) / 2,
            y: photosStartY + topPhotoHeight + photoSpacing,
            width: bottomPhotoWidth,
            height: bottomPhotoHeight,
            index: 2
          }
        ];
      } else if (photoCount >= 4) {
        // 4 photos: 2x2 grid (equal size)
        const photoWidth = (availablePhotoWidth - photoSpacing) / 2;
        const photoHeight = (availablePhotoHeight - photoSpacing) / 2;
        
        photoLayout = [
          // Top left
          {
            x: leftMargin + 10,
            y: photosStartY,
            width: photoWidth,
            height: photoHeight,
            index: 0
          },
          // Top right
          {
            x: leftMargin + 10 + photoWidth + photoSpacing,
            y: photosStartY,
            width: photoWidth,
            height: photoHeight,
            index: 1
          },
          // Bottom left
          {
            x: leftMargin + 10,
            y: photosStartY + photoHeight + photoSpacing,
            width: photoWidth,
            height: photoHeight,
            index: 2
          },
          // Bottom right
          {
            x: leftMargin + 10 + photoWidth + photoSpacing,
            y: photosStartY + photoHeight + photoSpacing,
            width: photoWidth,
            height: photoHeight,
            index: 3
          }
        ];
      }

      // ✅ RENDER PHOTOS BASED ON CALCULATED LAYOUT
      photoLayout.forEach(layout => {
        const photo = photosToShow[layout.index];
        const photoLabel = `${groupNum}.${layout.index + 1}`;

        // Try to load and display photo
        try {
          const photoPath = path.join(__dirname, '../../uploads/photos', photo.name);
          
          if (fs.existsSync(photoPath)) {
            doc.image(photoPath, layout.x, layout.y, {
              width: layout.width,
              height: layout.height,
              fit: [layout.width, layout.height]
            });
          } else {
            doc.rect(layout.x, layout.y, layout.width, layout.height).stroke();
            doc.fontSize(7).fillColor('#666666');
            doc.text('[Photo not found]', layout.x + layout.width/2 - 30, layout.y + layout.height/2 - 5);
          }
        } catch (err) {
          console.error('Error loading photo:', err);
          doc.rect(layout.x, layout.y, layout.width, layout.height).stroke();
          doc.fontSize(7).fillColor('#666666');
          doc.text('[Error]', layout.x + layout.width/2 - 15, layout.y + layout.height/2 - 5);
        }

        // ✅ Photo label (white box with red border)
        const labelBoxWidth = 30;
        const labelBoxHeight = 14;
        const labelX = layout.x + 5;
        const labelY = layout.y + 5;
        
        doc.rect(labelX, labelY, labelBoxWidth, labelBoxHeight)
           .fillAndStroke('#FFFFFF', '#FF0000');
        
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
        doc.text(photoLabel, labelX, labelY + 3, { 
          width: labelBoxWidth, 
          align: 'center' 
        });
      });

      // ===== RIGHT SIDE: FINDING & RECOMMENDATION =====
      const firstPhoto = photosToShow[0];
      const relatedObs = observationsByPhoto[firstPhoto.photo_id] || [];
      
      let textY = sectionBoxY + 20;
      const textPadding = 5;
      
      // FINDING SECTION
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Finding:', textColumnX + textPadding, textY);
      textY += 14;

      doc.fontSize(8).font('Helvetica');

      if (relatedObs.length > 0) {
        const obs = relatedObs[0];
        const findings = parseFindings(obs);
        
        findings.forEach((finding, index) => {
          let description = finding.description.trim();
          const numberPattern = new RegExp(`^${finding.finding_number}\\s+`, 'i');
          description = description.replace(numberPattern, '');
          
          const findingText = `${finding.finding_number} ${description}`;
          
          doc.text(findingText, textColumnX + textPadding, textY, { 
            width: textColumnWidth - textPadding * 2,
            lineGap: 2
          });
          textY = doc.y + 4;
        });
      } else {
        const caption = firstPhoto.caption || 'No finding recorded';
        doc.text(`${groupNum}.1 ${caption}`, textColumnX + textPadding, textY, { 
          width: textColumnWidth - textPadding * 2,
          lineGap: 2
        });
        textY = doc.y + 4;
      }

      textY += 8;

      // RECOMMENDATION SECTION
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('Recommendation:', textColumnX + textPadding, textY);
      textY += 14;

      doc.fontSize(8).font('Helvetica');

      if (relatedObs.length > 0) {
        const obs = relatedObs[0];
        const findings = parseFindings(obs);
        
        findings.forEach((finding, index) => {
          const recommendation = finding.recommendation || 'Nil';
          let cleanRec = recommendation.trim();
          const numberPattern = new RegExp(`^${finding.finding_number}\\s+`, 'i');
          cleanRec = cleanRec.replace(numberPattern, '');
          
          const recText = `${finding.finding_number} ${cleanRec}`;
          
          doc.text(recText, textColumnX + textPadding, textY, { 
            width: textColumnWidth - textPadding * 2,
            lineGap: 2
          });
          textY = doc.y + 4;
        });
      } else {
        doc.text(`${groupNum}.1 Nil`, textColumnX + textPadding, textY, { 
          width: textColumnWidth - textPadding * 2,
          lineGap: 2
        });
      }

      // Move to next section (no gap)
      currentY = sectionBoxY + sectionBoxHeight;
      groupIndex++;
    }

    // ===== FOOTER SECTION =====
    this.drawLine(doc, footerY);

    const footerBoxHeight = 25;
    
    // Inspector box
    doc.rect(leftMargin, footerY, 300, footerBoxHeight)
       .stroke('#000000');
    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    doc.text('Inspected by: ' + (inspector?.name || ''), 
      leftMargin + 5, footerY + 8);
    
    // Date box
    doc.rect(leftMargin + 305, footerY, 210, footerBoxHeight)
       .stroke('#000000');
    doc.text('Date: ' + formatReportDate(inspection.inspection_date || inspection.created_at || new Date()), 
      leftMargin + 310, footerY + 8);
  }
}

}

module.exports = new PDFService();