// utils/exportDXF.ts
import { BoxParams, EnclosureResult } from './math';
import DXFWriter from 'dxf-writer';

/**
 * Very simple DXF export stub.
 * Generates a rectangle for each panel based on box volume.
 * Later we can expand this into a full cut list with joinery/bracing.
 */
export function exportDXF(box: BoxParams, result: EnclosureResult): string {
  const dxf = new DXFWriter();

  // Example: assume a cube with internal volume Vb liters
  // Convert liters to cubic inches (1 L = 61.024 in³)
  const cubicInches = box.Vb * 61.024;
  const sideInches = Math.cbrt(cubicInches); // cube root for equal sides

  // Outer dimensions (add wall thickness if provided)
  const t = box.wallThickness ?? 0.75;
  const outer = sideInches + 2 * t;

  // Draw six panels as rectangles
  const panels = [
    { name: 'Front', w: outer, h: outer },
    { name: 'Back', w: outer, h: outer },
    { name: 'Top', w: outer, h: outer },
    { name: 'Bottom', w: outer, h: outer },
    { name: 'Left', w: outer, h: outer },
    { name: 'Right', w: outer, h: outer },
  ];

  panels.forEach((p, i) => {
    const offsetX = (i % 3) * (outer + 10); // space out panels
    const offsetY = Math.floor(i / 3) * (outer + 10);

    dxf.addLayer(p.name, DXFWriter.ACI.BLUE, 'CONTINUOUS');
    dxf.setActiveLayer(p.name);

    dxf.drawRect(offsetX, offsetY, p.w, p.h);
    dxf.addText(p.name, 10, offsetX + p.w / 2, offsetY - 15, 0);
  });

  return dxf.stringify();
}

