// app/design.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
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

  // Live preview: calculate liters from dimensions
  const litersFromDims = useMemo(() => {
    if (width && height && depth) {
      const W = parseFloat(width);
      const H = parseFloat(height);
      const D = parseFloat(depth);
      if (!isNaN(W) && !isNaN(H) && !isNaN(D)) {
        const cubicInches = W * H * D;
        return cubicInches / 61.024; // in³ → L
      }
    }
    return null;
  }, [width, height, depth]);

  const validateInputs = () => {
    const VbLiters = parseFloat(vb);
    const FbHz = parseFloat(fb);
    const W = width ? parseFloat(width) : undefined;
    const H = height ? parseFloat(height) : undefined;
    const D = depth ? parseFloat(depth) : undefined;

    if (isNaN(VbLiters) || VbLiters <= 0) {
      Alert.alert('Invalid Volume', 'Please enter a positive number for box volume (liters).');
      return null;
    }
    if (isNaN(FbHz) || FbHz <= 0) {
      Alert.alert('Invalid Tuning', 'Please enter a positive number for tuning frequency (Hz).');
      return null;
    }

    if (litersFromDims) {
      const diff = Math.abs(litersFromDims - VbLiters);
      if (diff > VbLiters * 0.15) {
        Alert.alert(
          'Volume Mismatch',
          `Dimensions equal ~${litersFromDims.toFixed(1)} L, but Vb = ${VbLiters} L. Adjust one or the other.`
        );
        return null;
      }
    }

    return { Vb: VbLiters, Fb: FbHz, width: W, height: H, depth: D };
  };

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
      <TextInput style={styles.input} keyboardType="numeric" value={vb} onChangeText={setVb} />

      <Text style={styles.label}>Tuning Frequency (Hz)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={fb} onChangeText={setFb} />

      {/* Optional Dimensions */}
      <Text style={styles.label}>Width (inches, optional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={width} onChangeText={setWidth} />

      <Text style={styles.label}>Height (inches, optional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />

      <Text style={styles.label}>Depth (inches, optional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={depth} onChangeText={setDepth} />

      {/* Live Preview */}
      {litersFromDims !== null && (
        <Text style={styles.preview}>
          Dimensions = {litersFromDims.toFixed(1)} L
          {Math.abs(litersFromDims - parseFloat(vb)) > parseFloat(vb) * 0.15
            ? ' ⚠️ (mismatch with Vb)'
            : ' ✅'}
        </Text>
      )}

      <Button
        title="Run Calculation"
        onPress={() => {
          const validated = validateInputs();
          if (validated) {
            setBox(validated);
            runCalculation();
          }
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
  input: { backgroundColor: '#222', color: '#fff', padding: 10, borderRadius: 6 },
  preview: { marginTop: 10, color: '#aaa', fontStyle: 'italic' },
  resultBox: { marginTop: 20, padding: 10, backgroundColor: '#111', borderRadius: 6 },
});
