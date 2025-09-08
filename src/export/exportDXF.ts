import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

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

export const exportDXF = (boxParams: BoxParams, driver: DriverParams, results: any) => {
  const { type, volume, portDiameter, portLength, slotWidth, slotHeight } = boxParams;
  const { Vb, Lv } = results;
  
  // Calculate internal dimensions (simplified)
  const internalVolume = Vb * 1000; // Convert to liters
  const internalDim = Math.cbrt(internalVolume) * 10; // Approx side length in cm
  
  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
  
  // Box outline
  dxf += `0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0.0\n11\n${internalDim}\n21\n0\n31\n0.0\n`;
  dxf += `0\nLINE\n8\n0\n10\n${internalDim}\n20\n0\n30\n0.0\n11\n${internalDim}\n21\n${internalDim}\n31\n0.0\n`;
  dxf += `0\nLINE\n8\n0\n10\n${internalDim}\n20\n${internalDim}\n30\n0.0\n11\n0\n21\n${internalDim}\n31\n0.0\n`;
  dxf += `0\nLINE\n8\n0\n10\n0\n20\n${internalDim}\n30\n0.0\n11\n0\n21\n0\n31\n0.0\n`;
  
  // Add driver cutout
  const driverSize = parseFloat(driver.Sd) > 800 ? 38 : // ~15"
                    parseFloat(driver.Sd) > 500 ? 30 : // ~12"
                    25; // ~10"
  const driverX = internalDim / 2;
  const driverY = internalDim / 2;
  dxf += `0\nCIRCLE\n8\n0\n10\n${driverX}\n20\n${driverY}\n30\n0.0\n40\n${driverSize/2}\n`;
  
  // Add port if applicable
  if ((type === "ported" || type.includes("bandpass")) && portDiameter) {
    const portRadius = parseFloat(portDiameter) / 2;
    const portX = internalDim - portRadius - 5;
    const portY = internalDim / 2;
    dxf += `0\nCIRCLE\n8\n0\n10\n${portX}\n20\n${portY}\n30\n0.0\n40\n${portRadius}\n`;
    
    // Add port length dimension
    dxf += `0\nLINE\n8\n0\n10\n${portX + portRadius + 5}\n20\n${portY}\n30\n0.0\n11\n${portX + portRadius + 15}\n21\n${portY}\n31\n0.0\n`;
  }
  
  dxf += `0\nENDSEC\n0\nEOF`;

  return dxf;
};

export const saveDXF = async (dxfContent: string, filename: string) => {
  const path = `${FileSystem.documentDirectory}${filename}`;
  try {
    await FileSystem.writeAsStringAsync(path, dxfContent);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'application/dxf',
        dialogTitle: 'Share DXF File',
        UTI: 'com.autodesk.dxf'
      });
    } else {
      Alert.alert('Export Complete', 'DXF file saved locally');
    }
  } catch (error) {
    console.error('Error saving DXF:', error);
    Alert.alert('Export Error', 'Failed to save DXF file');
  }
};