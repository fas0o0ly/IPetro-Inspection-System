// backend/src/utils/imageProcessor.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Burn annotations onto image
 * @param {string} imagePath - Path to original image
 * @param {Array} annotations - Array of annotation shapes
 * @returns {Promise<string>} - Path to annotated image
 */
const burnAnnotations = async (imagePath, annotations) => {
  try {
    // Read original image
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Create SVG overlay from annotations
    const svg = generateSVGFromAnnotations(annotations, metadata.width, metadata.height);

    // Composite SVG onto image and overwrite
    await image
      .composite([{
        input: Buffer.from(svg),
        top: 0,
        left: 0
      }])
      .toFile(imagePath + '.tmp');

    // Replace original with annotated version
    fs.renameSync(imagePath + '.tmp', imagePath);

    return imagePath;

  } catch (err) {
    console.error('Error burning annotations:', err);
    throw err;
  }
};

/**
 * Generate SVG markup from annotation data
 */
const generateSVGFromAnnotations = (annotations, width, height) => {
  let svgShapes = '';

  annotations.forEach(shape => {
    const color = shape.color || '#ff0000';
    const strokeWidth = shape.strokeWidth || 3;

    switch (shape.type) {
      case 'arrow':
        svgShapes += generateArrowSVG(shape, color, strokeWidth);
        break;
      
      case 'rectangle':
        //Calculate correct x, y, width, height
        const rectX = Math.min(shape.x1, shape.x2);
        const rectY = Math.min(shape.y1, shape.y2);
        const rectWidth = Math.abs(shape.x2 - shape.x1);
        const rectHeight = Math.abs(shape.y2 - shape.y1);
        
        svgShapes += `<rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" 
                      stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
        break;
      
      case 'circle':
        svgShapes += `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.radius}" 
                      stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
        break;
      
      case 'line':
        svgShapes += `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" 
                      stroke="${color}" stroke-width="${strokeWidth}"/>`;
        break;
      
      case 'text':
        // ✅ FIXED: Check if text exists before rendering
        if (shape.text && shape.text.trim()) {
          svgShapes += `<text x="${shape.x}" y="${shape.y}" fill="${color}" 
                        font-size="${shape.fontSize || 20}" font-weight="bold">${escapeXml(shape.text)}</text>`;
        }
        break;
      
      case 'freehand':
        if (shape.points && shape.points.length > 0) {
          const pathData = shape.points.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
          ).join(' ');
          svgShapes += `<path d="${pathData}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
        }
        break;
    }
  });

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgShapes}
    </svg>
  `;
};

/**
 * Generate arrow SVG (line + arrowhead)
 */
const generateArrowSVG = (shape, color, strokeWidth) => {
  const { x1, y1, x2, y2 } = shape;
  
  // Calculate arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowSize = 15;
  
  const arrowPoint1X = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = y2 - arrowSize * Math.sin(angle + Math.PI / 6);

  return `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}"/>
    <polygon points="${x2},${y2} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}" 
             fill="${color}"/>
  `;
};

/**
 * Escape XML special characters
 * ✅ FIXED: Handle undefined/null values
 */
const escapeXml = (text) => {
  if (!text) return ''; // ✅ Return empty string if text is undefined/null
  
  return String(text) // ✅ Convert to string first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

module.exports = {
  burnAnnotations
};