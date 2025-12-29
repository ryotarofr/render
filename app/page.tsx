'use client';

import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { FoxModel } from './components/FoxModel';

export default function Home() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [alpha, setAlpha] = useState(0);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(1920);
  const [cropHeight, setCropHeight] = useState(1080);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDragging) {
        const dx = mouseX - dragStart.x;
        const dy = mouseY - dragStart.y;
        setCropX((prev) => Math.max(0, Math.min(prev + dx, rect.width - cropWidth)));
        setCropY((prev) => Math.max(0, Math.min(prev + dy, rect.height - cropHeight)));
        setDragStart({ x: mouseX, y: mouseY });
      } else if (isResizing && resizeHandle) {
        const dx = mouseX - dragStart.x;
        const dy = mouseY - dragStart.y;

        if (resizeHandle.includes('e')) {
          setCropWidth((prev) => Math.max(50, Math.min(prev + dx, rect.width - cropX)));
        }
        if (resizeHandle.includes('w')) {
          const newWidth = Math.max(50, cropWidth - dx);
          const newX = cropX + (cropWidth - newWidth);
          setCropX(Math.max(0, newX));
          setCropWidth(newWidth);
        }
        if (resizeHandle.includes('s')) {
          setCropHeight((prev) => Math.max(50, Math.min(prev + dy, rect.height - cropY)));
        }
        if (resizeHandle.includes('n')) {
          const newHeight = Math.max(50, cropHeight - dy);
          const newY = cropY + (cropHeight - newHeight);
          setCropY(Math.max(0, newY));
          setCropHeight(newHeight);
        }

        setDragStart({ x: mouseX, y: mouseY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, cropX, cropY, cropWidth, cropHeight, resizeHandle]);

  const exportToPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with the desired size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Draw the cropped area from the source canvas to the temporary canvas
    ctx.drawImage(
      canvas,
      cropX, cropY, cropWidth, cropHeight, // Source crop area
      0, 0, width, height // Destination area (scaled to output size)
    );

    // Convert to PNG and download
    tempCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `fox-model-${width}x${height}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="flex min-h-screen bg-zinc-900">
      {/* Control Panel */}
      <div className="w-80 bg-zinc-800 p-6 space-y-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white">3D Model Renderer</h1>

        {/* Size Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Export Size</h2>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-300">
              Width: {width}px
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-700 text-white rounded"
              min="1"
              max="4096"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-300">
              Height: {height}px
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-700 text-white rounded"
              min="1"
              max="4096"
            />
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setWidth(1920); setHeight(1080); }}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
            >
              1920×1080
            </button>
            <button
              onClick={() => { setWidth(1280); setHeight(720); }}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
            >
              1280×720
            </button>
            <button
              onClick={() => { setWidth(3840); setHeight(2160); }}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
            >
              3840×2160
            </button>
            <button
              onClick={() => { setWidth(1024); setHeight(1024); }}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
            >
              1024×1024
            </button>
          </div>
        </div>

        {/* Crop Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Crop Area</h2>

          <div className="text-xs text-zinc-400 bg-zinc-700 p-3 rounded">
            <p className="font-semibold mb-1">Visual Crop Tool:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Drag the box to move it</li>
              <li>Drag corners/edges to resize</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-700 p-2 rounded">
              <div className="text-zinc-400">Position</div>
              <div className="text-white font-mono">X: {Math.round(cropX)}px</div>
              <div className="text-white font-mono">Y: {Math.round(cropY)}px</div>
            </div>
            <div className="bg-zinc-700 p-2 rounded">
              <div className="text-zinc-400">Size</div>
              <div className="text-white font-mono">W: {Math.round(cropWidth)}px</div>
              <div className="text-white font-mono">H: {Math.round(cropHeight)}px</div>
            </div>
          </div>

          <button
            onClick={() => {
              if (viewportRef.current) {
                const rect = viewportRef.current.getBoundingClientRect();
                setCropX(0);
                setCropY(0);
                setCropWidth(rect.width);
                setCropHeight(rect.height);
              }
            }}
            className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
          >
            Reset to Full View
          </button>
        </div>

        {/* Alpha Control */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Background</h2>
          <label className="block text-sm text-zinc-300">
            Transparency: {alpha.toFixed(2)}
          </label>
          <input
            type="range"
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="w-full"
            min="0"
            max="1"
            step="0.01"
          />
          <p className="text-xs text-zinc-400">
            0 = Opaque, 1 = Transparent
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={exportToPNG}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded"
        >
          Export as PNG
        </button>

        <div className="text-xs text-zinc-400 space-y-1">
          <p>Controls:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Left click + drag: Rotate</li>
            <li>Right click + drag: Pan</li>
            <li>Scroll: Zoom</li>
          </ul>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 flex items-center justify-center relative">
        <div ref={viewportRef} className="w-full h-full relative">
          <Canvas
            ref={canvasRef}
            camera={{ position: [5, 3, 5], fov: 50 }}
            shadows
            gl={{ preserveDrawingBuffer: true, alpha: true }}
            style={{
              background: `rgba(24, 24, 27, ${1 - alpha})`,
            }}
          >
            <color attach="background" args={[`rgba(24, 24, 27, ${1 - alpha})`]} />
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
            />
            <FoxModel />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
            <Environment preset="sunset" />
          </Canvas>

          {/* Crop Overlay */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
            }}
          >
            {/* Crop Box */}
            <div
              className="absolute border-2 border-blue-500 pointer-events-auto cursor-move"
              style={{
                left: `${cropX}px`,
                top: `${cropY}px`,
                width: `${cropWidth}px`,
                height: `${cropHeight}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (viewportRef.current) {
                  const rect = viewportRef.current.getBoundingClientRect();
                  setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  setIsDragging(true);
                }
              }}
            >
              {/* Resize Handles */}
              {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
                <div
                  key={handle}
                  className="absolute w-3 h-3 bg-blue-500 border border-white"
                  style={{
                    cursor: `${handle}-resize`,
                    ...(handle.includes('n') && { top: '-6px' }),
                    ...(handle.includes('s') && { bottom: '-6px' }),
                    ...(handle.includes('w') && { left: '-6px' }),
                    ...(handle.includes('e') && { right: '-6px' }),
                    ...(!handle.includes('n') && !handle.includes('s') && { top: '50%', transform: 'translateY(-50%)' }),
                    ...(!handle.includes('w') && !handle.includes('e') && { left: '50%', transform: 'translateX(-50%)' }),
                    ...(handle === 'nw' && { top: '-6px', left: '-6px' }),
                    ...(handle === 'ne' && { top: '-6px', right: '-6px' }),
                    ...(handle === 'se' && { bottom: '-6px', right: '-6px' }),
                    ...(handle === 'sw' && { bottom: '-6px', left: '-6px' }),
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (viewportRef.current) {
                      const rect = viewportRef.current.getBoundingClientRect();
                      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      setIsResizing(true);
                      setResizeHandle(handle);
                    }
                  }}
                />
              ))}

              {/* Size Label */}
              <div className="absolute bottom-full left-0 mb-1 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {Math.round(cropWidth)} × {Math.round(cropHeight)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
