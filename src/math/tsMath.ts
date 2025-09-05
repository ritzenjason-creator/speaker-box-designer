// src/math/tsMath.ts
interface DriverParams {
  Vas: string;
  Qts: string;
  Fs: string;
  Qes: string;
  Sd: string;
  Xmax: string;
  Re: string;
  Le: string;
  Bl: string;
  sensitivity: string;
}

interface BoxParams {
  type: string;
  volume: string;
  tuning: string;
  portDiameter: string;
  portLength: string;
  numPorts: string;
  slotWidth: string;
  slotHeight: string;
  ratio: string;
}

interface GraphDataPoint {
  freq: number;
  spl: number;
}

interface VelocityDataPoint {
  freq: number;
  velocity: number;
}

export const calculateEnclosure = (driver: DriverParams, box: BoxParams) => {
  const Vas = parseFloat(driver.Vas) || 0;
  const Qts = parseFloat(driver.Qts) || 0;
  const Fs = parseFloat(driver.Fs) || 0;
  const Qes = parseFloat(driver.Qes) || 0;
  const Sd = parseFloat(driver.Sd) / 10000; // Convert cm² to m²
  const Xmax = parseFloat(driver.Xmax) / 1000; // Convert mm to m
  const sensitivity = parseFloat(driver.sensitivity) || 90; // dB @ 1W/1m
  
  const Vb = parseFloat(box.volume) || 0;
  const Fb = parseFloat(box.tuning) || 0;
  const portDiameter = parseFloat(box.portDiameter) || 0;
  const numPorts = parseFloat(box.numPorts) || 1;
  
  const warnings = [];

  // Validate required parameters
  if (!Vas || !Qts || !Fs) {
    throw new Error("Vas, Qts, and Fs are required parameters");
  }

  let calculatedVb = Vb;
  let calculatedFb = Fb;
  let Lv = parseFloat(box.portLength) || 0;
  
  if (box.type === "ported") {
    // If no volume provided, calculate optimal for QB3 alignment
    if (!Vb) {
      calculatedVb = 15 * Math.pow(Qts, 2.87) * Vas;
    }
    
    // If no tuning provided, calculate optimal
    if (!Fb) {
      calculatedFb = 0.42 * Fs * Math.pow(Qts, -0.9);
    }
    
    // Port length calculation (cm) if not provided
    if (portDiameter > 0 && !Lv) {
      const portArea = Math.PI * Math.pow(portDiameter / 2, 2) * numPorts;
      Lv = (23562.5 * portArea) / (Math.pow(calculatedFb, 2) * calculatedVb) - (0.823 * Math.sqrt(portArea));
      
      // Validate port length
      if (Lv < 0) {
        warnings.push("Calculated port length is negative. Check your parameters.");
        Lv = 0;
      }
    }
  } else if (box.type === "sealed") {
    // If no volume provided, calculate optimal for Qtc = 0.707
    if (!Vb) {
      const Qtc = 0.707;
      calculatedVb = Vas / (Math.pow(Qtc/Qts, 2) - 1);
    }
    calculatedFb = Fs * Math.sqrt(Vas/calculatedVb + 1);
  } else if (box.type === "bandpass4") {
    // 4th order bandpass calculations
    if (!Vb) {
      calculatedVb = Vas * 2; // Default ratio
    }
    if (!Fb) {
      calculatedFb = Fs * 1.2; // Default tuning
    }
  } else if (box.type === "bandpass6") {
    // 6th order bandpass calculations
    if (!Vb) {
      calculatedVb = Vas * 3; // Default ratio
    }
    if (!Fb) {
      calculatedFb = Fs * 1.5; // Default tuning
    }
  }

  // Calculate SPL and port velocity curves
  const splCurve = calculateSPL(driver, { ...box, volume: calculatedVb.toString(), tuning: calculatedFb.toString() }, box.type);
  const velocityCurve = (box.type === "ported" || box.type.includes("bandpass")) ? 
    calculatePortVelocity(driver, { ...box, volume: calculatedVb.toString(), tuning: calculatedFb.toString() }, calculatedFb) : 
    Array.from({ length: 191 }, (_, i) => ({ freq: i + 10, velocity: 0 }));

  // Check for warnings
  velocityCurve.forEach((point) => {
    if (point.velocity > 17) {
      warnings.push(`High port velocity at ${point.freq} Hz: ${point.velocity.toFixed(2)} m/s`);
    }
  });

  if (box.type === "ported" && Lv > calculatedVb * 0.8) {
    warnings.push("Port length is very long relative to box size. Consider multiple ports or a different design.");
  }

  return { 
    Vb: calculatedVb, 
    Fb: calculatedFb, 
    Lv, 
    splCurve, 
    velocityCurve, 
    warnings 
  };
};

const calculateSPL = (driver: DriverParams, box: BoxParams, boxType: string): GraphDataPoint[] => {
  const sensitivity = parseFloat(driver.sensitivity) || 90; // dB @ 1W/1m
  const Fs = parseFloat(driver.Fs);
  const Qts = parseFloat(driver.Qts);
  const Vas = parseFloat(driver.Vas);
  const Vb = parseFloat(box.volume);
  const Fb = parseFloat(box.tuning);
  
  const splCurve: GraphDataPoint[] = [];
  
  for (let f = 10; f <= 200; f += 1) {
    let response;
    const fRatio = f / Fs;
    
    if (boxType === "sealed") {
      // Sealed box response (2nd order high-pass)
      const fc = Fs * Math.sqrt(Vas/Vb + 1);
      const ratio = f / fc;
      response = 1 / Math.sqrt(
        Math.pow(1 - Math.pow(ratio, 2), 2) + 
        Math.pow(ratio / (1/Math.sqrt(2)), 2) // Qtc = 0.707
      );
    } else if (boxType === "ported") {
      // Vented box response (4th order bandpass)
      const alpha = Vas / Vb;
      const h = Fb / Fs;
      
      const numerator = Math.pow(fRatio, 4);
      const term1 = Math.pow(fRatio, 2) * (Math.pow(h, 2) - 1 - alpha);
      const term2 = Math.pow(alpha, 2) * Math.pow(fRatio, 2) * Math.pow(h, 2) / Math.pow(Qts, 2);
      
      response = numerator / Math.sqrt(
        Math.pow(Math.pow(fRatio, 4) - term1, 2) + term2
      );
    } else if (boxType === "bandpass4") {
      // 4th order bandpass response
      const ratio = f / Fb;
      response = ratio / Math.sqrt(Math.pow(1 - Math.pow(ratio, 2), 2) + Math.pow(ratio / Qts, 2));
    } else if (boxType === "bandpass6") {
      // 6th order bandpass response (simplified)
      const ratio = f / Fb;
      response = Math.pow(ratio, 2) / Math.sqrt(Math.pow(1 - Math.pow(ratio, 2), 2) + Math.pow(ratio / Qts, 2));
    } else {
      // Free-air response
      response = 1 / Math.sqrt(
        Math.pow(1 - Math.pow(fRatio, 2), 2) + 
        Math.pow(fRatio / Qts, 2)
      );
    }
    
    const spl = sensitivity + 20 * Math.log10(response || 0.001);
    splCurve.push({ freq: f, spl });
  }
  
  return splCurve;
};

const calculatePortVelocity = (driver: DriverParams, box: BoxParams, Fb: number): VelocityDataPoint[] => {
  const Sd = parseFloat(driver.Sd) / 10000; // Convert cm² to m²
  const Xmax = parseFloat(driver.Xmax) / 1000; // Convert mm to m
  const portDiameter = parseFloat(box.portDiameter) || 0;
  const numPorts = parseFloat(box.numPorts) || 1;
  
  let portArea = 0;
  if (portDiameter > 0) {
    portArea = Math.PI * Math.pow(portDiameter/100/2, 2) * numPorts; // m² (convert cm to m)
  } else if (parseFloat(box.slotWidth) > 0 && parseFloat(box.slotHeight) > 0) {
    const slotWidth = parseFloat(box.slotWidth) / 100; // cm to m
    const slotHeight = parseFloat(box.slotHeight) / 100; // cm to m
    portArea = slotWidth * slotHeight;
  }
  
  const velocityCurve: VelocityDataPoint[] = [];
  
  if (portArea <= 0) {
    // No port, return zero velocity
    for (let f = 10; f <= 200; f += 1) {
      velocityCurve.push({ freq: f, velocity: 0 });
    }
    return velocityCurve;
  }
  
  for (let f = 10; f <= 200; f += 1) {
    // Calculate cone displacement at frequency f
    const displacement = calculateConeDisplacement(driver, box, f);
    
    // Calculate port velocity (simplified)
    // V = (2 * π * f * displacement * Sd) / A
    const velocity = (2 * Math.PI * f * displacement * Sd) / portArea;
    velocityCurve.push({ freq: f, velocity: Math.abs(velocity) });
  }
  
  return velocityCurve;
};

const calculateConeDisplacement = (driver: DriverParams, box: BoxParams, frequency: number): number => {
  const Fs = parseFloat(driver.Fs);
  const Qts = parseFloat(driver.Qts);
  const Vas = parseFloat(driver.Vas);
  const Vb = parseFloat(box.volume);
  const boxType = box.type;
  
  const fRatio = frequency / Fs;
  let displacement = 0;
  
  if (boxType === "sealed") {
    const complianceRatio = Vas / Vb;
    displacement = 1 / Math.sqrt(
      Math.pow(1 - Math.pow(fRatio, 2) * (1 + complianceRatio), 2) + 
      Math.pow(fRatio / Qts, 2)
    );
  } else if (boxType === "ported" || boxType.includes("bandpass")) {
    // More complex model for ported/bandpass
    const h = parseFloat(box.tuning) / Fs;
    const alpha = Vas / Vb;
    
    displacement = Math.pow(fRatio, 2) / Math.sqrt(
      Math.pow(Math.pow(fRatio, 2) - Math.pow(h, 2), 2) + 
      Math.pow(fRatio * h / (Qts * alpha), 2)
    );
  } else {
    // Free air
    displacement = 1 / Math.sqrt(
      Math.pow(1 - Math.pow(fRatio, 2), 2) + 
      Math.pow(fRatio / Qts, 2)
    );
  }
  
  // Scale by Xmax
  const Xmax = parseFloat(driver.Xmax) / 1000; // mm to m
  return Math.min(displacement, Xmax * 2); // Limit to 2*Xmax for safety
};
