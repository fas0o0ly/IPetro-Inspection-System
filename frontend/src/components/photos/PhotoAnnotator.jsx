// src/components/photos/PhotoAnnotator.jsx

import { useState, useRef, useEffect } from 'react';
import { X, Undo, Redo, ZoomIn, ZoomOut, Save, Trash2 } from 'lucide-react';
import { photoService } from '../../services/photoService';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PhotoAnnotator = ({ isOpen, onClose, photo, onSuccess }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('arrow');
  const [color, setColor] = useState('#ff0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (photo && isOpen) {
      loadImage();
    }
  }, [photo, isOpen]);

  const loadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Use photoService to get properly encoded URL
    const imageUrl = photoService.getPhotoUrl(photo.name);
    
    console.log('Initializing canvas...');
    console.log('Photo data:', {
      photo_id: photo.photo_id,
      inspection_id: photo.inspection_id,
      file_url: photo.file_url,
      name: photo.name
    });
    console.log('Image URL:', imageUrl);
    
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('✓ Image loaded successfully');
      console.log('Canvas created');
      console.log('Loading image from:', imageUrl);
      
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
    };
    
    img.onerror = (error) => {
      console.error('✗ Failed to load image');
      console.error('Attempted URL:', imageUrl);
      console.error('Error:', error);
      toast.error('Failed to load image. Please check the console for details.');
    };
    
    img.src = imageUrl;
  };

  const handleMouseDown = (e) => {
    if (!imageLoaded) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setIsDrawing(true);
    
    const newShape = {
      type: tool,
      color,
      strokeWidth: 3,
      x1: x,
      y1: y,
      x2: x,
      y2: y
    };

    if (tool === 'freehand') {
      newShape.points = [{ x, y }];
    }

    setCurrentShape(newShape);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentShape) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (tool === 'freehand') {
      setCurrentShape(prev => ({
        ...prev,
        points: [...prev.points, { x, y }]
      }));
    } else {
      setCurrentShape(prev => ({
        ...prev,
        x2: x,
        y2: y,
        width: x - prev.x1,
        height: y - prev.y1,
        cx: prev.x1,
        cy: prev.y1,
        radius: Math.sqrt(Math.pow(x - prev.x1, 2) + Math.pow(y - prev.y1, 2))
      }));
    }

    redrawCanvas();
  };

  const handleMouseUp = () => {
    if (currentShape) {
      setAnnotations(prev => [...prev, currentShape]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Reload base image
    const img = new Image();
    const imageUrl = photoService.getPhotoUrl(photo.name);
    img.src = imageUrl;
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Draw all saved annotations
      annotations.forEach(shape => drawShape(ctx, shape));
      
      // Draw current shape being drawn
      if (currentShape) {
        drawShape(ctx, currentShape);
      }
    };
  };

  const drawShape = (ctx, shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth || 3;

    switch (shape.type) {
      case 'arrow':
        drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2);
        break;
      case 'rectangle':
        ctx.strokeRect(shape.x1, shape.y1, shape.width, shape.height);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(shape.cx, shape.cy, shape.radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
        break;
      case 'freehand':
        if (shape.points && shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          shape.points.forEach(point => ctx.lineTo(point.x, point.y));
          ctx.stroke();
        }
        break;
    }
  };

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 15;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle - Math.PI / 6),
      y2 - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle + Math.PI / 6),
      y2 - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const handleSave = async () => {
    if (annotations.length === 0) {
      toast.error('No annotations to save');
      return;
    }

    try {
      setSaving(true);
      await photoService.saveAnnotations(photo.photo_id, annotations);
      toast.success('Annotations saved successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save annotations:', error);
      toast.error('Failed to save annotations');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    setAnnotations([]);
    redrawCanvas();
  };

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
    setTimeout(redrawCanvas, 0);
  };

  if (!isOpen || !photo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">Annotate Photo</h2>
            <p className="text-sm text-white/80">{photo.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200 flex items-center gap-2 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-1 border border-neutral-300 rounded-lg p-1">
            <button
              onClick={() => setTool('arrow')}
              className={`p-2 rounded ${tool === 'arrow' ? 'bg-red-100 text-red-600' : 'hover:bg-neutral-100'}`}
              title="Arrow"
            >
              ↗
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-2 rounded ${tool === 'rectangle' ? 'bg-red-100 text-red-600' : 'hover:bg-neutral-100'}`}
              title="Rectangle"
            >
              ▭
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded ${tool === 'circle' ? 'bg-red-100 text-red-600' : 'hover:bg-neutral-100'}`}
              title="Circle"
            >
              ○
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-2 rounded ${tool === 'line' ? 'bg-red-100 text-red-600' : 'hover:bg-neutral-100'}`}
              title="Line"
            >
              ─
            </button>
            <button
              onClick={() => setTool('freehand')}
              className={`p-2 rounded ${tool === 'freehand' ? 'bg-red-100 text-red-600' : 'hover:bg-neutral-100'}`}
              title="Freehand"
            >
              ✎
            </button>
            
          </div>

          <div className="w-px h-8 bg-neutral-300" />

          {/* Actions */}
          <button
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="p-2 hover:bg-neutral-100 rounded-lg disabled:opacity-50"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-neutral-300" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          <div className="w-px h-8 bg-neutral-300" />

          {/* Clear */}
          <button
            onClick={handleClearAll}
            disabled={annotations.length === 0}
            className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 rounded-lg disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-neutral-100">
          <div className="flex items-center justify-center min-h-full">
            {!imageLoaded && (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading image...</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-neutral-300 bg-white cursor-crosshair"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                display: imageLoaded ? 'block' : 'none'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
          <p className="text-sm text-neutral-600">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || annotations.length === 0}
              className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Annotations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoAnnotator;