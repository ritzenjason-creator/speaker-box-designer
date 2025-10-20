// utils/exportDXF.ts
import { BoxParams, EnclosureResult } from './math';
import DXFWriter from 'dxf-writer';

/**
 * Export DXF cut sheet for a rectangular box.
 * Uses Vb (liters) and wall thickness to calculate outer dimensions.
 * Assumes a simple rectangular prism (W × H × D).
 */
export function exportDXF(box: BoxParams, result: EnclosureResult): string {
  const dxf = new DXFWriter();

  // Convert liters to cubic inches (1 L = 61.024 in³)
  const cubicInches = box.Vb * 61.024;

  // For now, assume a 1:1.5:2 ratio (H:W:D) to distribute volume
  // Later we can let the user set exact W/H/D
  const ratio = { h: 1, w: 1.5, d: 2 };
  const ratioSum = ratio.h * ratio.w * ratio.d;

  // Solve for scale factor so that h*w*d = cubicInches
  const scale = Math.cbrt(cubicInches / ratioSum);

  const innerH = ratio.h * scale;
  const innerW = ratio.w * scale;
  const innerD = ratio.d * scale;

  const t = box.wallThickness ?? 0.75; // wall thickness in inches

  // Outer dimensions
  const H = innerH + 2 * t;
  const W = innerW + 2 * t;
  const D = innerD + 2 * t;

  // Panels (width × height)
  const panels = [
    { name: 'Front', w: W, h: H },
    { name: 'Back', w: W, h: H },
    { name: 'Top', w: W, h: D },
    { name: 'Bottom', w: W, h: D },
    { name: 'Left', w: D, h: H },
    { name: 'Right', w: D, h: H },
  ];

  panels.forEach((p, i) => {
    const offsetX = (i % 3) * (Math.max(W, D) + 20); // spacing
    const offsetY = Math.floor(i / 3) * (Math.max(H, D) + 20);

    dxf.addLayer(p.name, DXFWriter.ACI.CYAN, 'CONTINUOUS');
    dxf.setActiveLayer(p.name);

    dxf.drawRect(offsetX, offsetY, p.w, p.h);
    dxf.addText(`${p.name} (${p.w.toFixed(1)} × ${p.h.toFixed(1)} in)`, 10, offsetX + p.w / 2, offsetY - 15, 0);
  });

  return dxf.stringify();
}
