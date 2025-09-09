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
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Unknown error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Speaker Box Designer</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Mode</Text>
          <Picker selectedValue={mode} onValueChange={(v) => setMode(v as Mode)}>
            <Picker.Item label="Sealed" value="Sealed" />
            <Picker.Item label="Ported" value="Ported" />
            <Picker.Item label="Bandpass 4th" value="Bandpass 4th" />
            <Picker.Item label="Bandpass 6th" value="Bandpass 6th" />
          </Picker>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <PresetPicker onPick={(p) => setDriver(p)} />
          <LabeledNumber label="Fs (Hz)" value={driver.Fs} onChange={(v) => setDriver({ ...driver, Fs: v })} />
          <LabeledNumber label="Qts" value={driver.Qts} onChange={(v) => setDriver({ ...driver, Qts: v })} />
          <LabeledNumber label="Vas (L)" value={driver.Vas} onChange={(v) => setDriver({ ...driver, Vas: v })} />
          <LabeledNumber label="Sd (cm²)" value={driver.Sd} onChange={(v) => setDriver({ ...driver, Sd: v })} />
          <LabeledNumber label="Xmax (mm)" value={driver.Xmax} onChange={(v) => setDriver({ ...driver, Xmax: v })} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Box</Text>
          <LabeledNumber label="Vb (L)" value={box.Vb} onChange={(v) => setBox({ ...box, Vb: v })} />
          {mode !== 'Sealed' && (
            <>
              <LabeledNumber label="Fb (Hz)" value={box.Fb ?? 32} onChange={(v) => setBox({ ...box, Fb: v })} />
              <LabeledNumber label="Port width (in)" value={box.portWidth ?? 3} onChange={(v) => setBox({ ...box, portWidth: v })} />
              <LabeledNumber label="Port height (in)" value={box.portHeight ?? 12} onChange={(v) => setBox({ ...box, portHeight: v })} />
            </>
          )}
          <LabeledNumber label="Wall thickness (in)" value={box.wallThickness ?? 0.75} onChange={(v) => setBox({ ...box, wallThickness: v })} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Graphs</Text>
          <VictoryChart theme={VictoryTheme.material} domainPadding={10}>
            <VictoryAxis label="Frequency (Hz)" />
            <VictoryAxis dependentAxis label="SPL (dB)" />
            <VictoryLegend x={40} y={0} orientation="horizontal" gutter={20}
              data={[{ name: 'SPL', symbol: { fill: '#1976d2' } }, { name: 'Port velocity', symbol: { fill: '#d32f2f' } }]}
            />
            <VictoryLine data={result.splCurve} x="x" y="y" style={{ data: { stroke: '#1976d2' } }} />
            <VictoryLine data={result.velocityCurve} x="x" y="y" style={{ data: { stroke: '#d32f2f' } }} />
          </VictoryChart>

          {result.warnings.length > 0 && (
            <View style={styles.warnBox}>
              {result.warnings.map((w, i) => (
                <Text key={i} style={styles.warnText}>• {w}</Text>
              ))}
            </View>
          )}
        </View>

        <Button title="Export DXF" onPress={onExportDXF} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LabeledNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(value ?? '')}
        onChangeText={(t) => onChange(Number(t.replace(/[^0-9.]/g, '')) || 0)}
      />
    </View>
  );
}

function PresetPicker({ onPick }: { onPick: (p: DriverParams) => void }) {
  const [sel, setSel] = useState(presets[0]?.name ?? 'Example 12');
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Preset</Text>
      <Picker
        selectedValue={sel}
        onValueChange={(name) => {
          setSel(name);
          const found = presets.find((p) => p.name === name);
          if (found) onPick(found);
        }}
        style={{ flex: 1 }}
      >
        {presets.map((p) => (
          <Picker.Item label={p.name} value={p.name} key={p.name} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0f11' },
  container: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '600', color: '#fff' },
  section: { backgroundColor: '#17191c', borderRadius: 8, padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e0e0e0', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { width: 140, color: '#c7c7c7' },
  input: { flex: 1, backgroundColor: '#22252a', borderRadius: 6, padding: 8, color: '#fff' },
  warnBox: { backgroundColor: '#2a1e1e', padding: 10, borderRadius: 6, marginTop: 8 },
  warnText: { color: '#ffb4a9' }
});
