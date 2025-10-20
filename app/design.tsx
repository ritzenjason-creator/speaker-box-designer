// app/design.tsx
import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useStore } from './store';
import { presets } from '../utils/presets';

export default function DesignScreen() {
  const setDriver = useStore(s => s.setDriver);
  const setBox = useStore(s => s.setBox);
  const runCalculation = useStore(s => s.runCalculation);
  const driver = useStore(s => s.driver);
  const result = useStore(s => s.result);

  // Local state for box inputs
  const [vb, setVb] = useState('40');   // liters
  const [fb, setFb] = useState('32');   // Hz
  const [width, setWidth] = useState('');   // inches
  const [height, setHeight] = useState(''); // inches
  const [depth, setDepth] = useState('');   // inches

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Design Your Enclosure</Text>

      {/* Driver Picker */}
      <Text style={styles.label}>Select Driver</Text>
      <Picker
        selectedValue={driver?.name}
        onValueChange={(val) => {
          const d = presets.find(p => p.name === val);
          if (d) setDriver(d);
        }}
        style={styles.picker}
      >
        {presets.map((p) => (
          <Picker.Item key={p.name} label={p.name} value={p.name} />
        ))}
      </Picker>

      {/* Box Inputs */}
      <Text style={styles.label}>Box Volume (liters)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={vb}
        onChangeText={setVb}
      />

      <Text style={styles.label}>Tuning Frequency (Hz)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={fb}
        onChangeText={setFb}
      />

      {/* Optional Dimensions */}
      <Text style={styles.label}>Width (inches, optional)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={width}
        onChangeText={setWidth}
      />

      <Text style={styles.label}>Height (inches, optional)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />

      <Text style={styles.label}>Depth (inches, optional)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={depth}
        onChangeText={setDepth}
      />

      <Button
        title="Run Calculation"
        onPress={() => {
          setBox({
            Vb: parseFloat(vb),
            Fb: parseFloat(fb),
            width: width ? parseFloat(width) : undefined,
            height: height ? parseFloat(height) : undefined,
            depth: depth ? parseFloat(depth) : undefined,
          });
          runCalculation();
        }}
      />

      {result && (
        <View style={styles.resultBox}>
          <Text>Calculated Fb: {result.Fb ?? 'N/A'} Hz</Text>
          <Text>Warnings:</Text>
          {result.warnings.map((w, i) => (
            <Text key={i} style={{ color: 'orange' }}>⚠️ {w}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0e0f11' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
  label: { marginTop: 15, marginBottom: 5, color: '#ccc' },
  picker: { backgroundColor: '#222', color: '#fff' },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
  },
  resultBox: { marginTop: 20, padding: 10, backgroundColor: '#111', borderRadius: 6 },
});
