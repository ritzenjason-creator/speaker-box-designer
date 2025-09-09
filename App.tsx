import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, StyleSheet, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryAxis, VictoryLegend } from 'victory-native';
import { presets } from './src/presets';
import { calculateEnclosure, type DriverParams, type BoxParams, type EnclosureResult } from './src/math/tsMath';
import { exportDXF, saveDXF } from './src/export/exportDXF';

type Mode = 'Sealed' | 'Ported' | 'Bandpass 4th' | 'Bandpass 6th';

export default function App() {
  const [mode, setMode] = useState<Mode>('Ported');
  const [driver, setDriver] = useState<DriverParams>(presets[0]);
  const [box, setBox] = useState<BoxParams>({
    Vb: 50,
    Fb: 32,
    slotPort: true,
    portWidth: 3,
    portHeight: 12,
    wallThickness: 0.75
  });

  const result: EnclosureResult = useMemo(() => calculateEnclosure(mode, driver, box), [mode, driver, box]);

  const onExportDXF = async () => {
    try {
      const dxf = exportDXF({ mode, driver, box, result });
      const savedPath = await saveDXF(dxf, `cut_sheet_${driver.name.replace(/\s+/g, '_')}.dxf`);
      Alert.alert('DXF Exported', `Saved to: ${savedPath}`);
   
