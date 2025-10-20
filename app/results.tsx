// app/results.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryAxis } from 'victory-native';
import { useStore } from './store';

export default function ResultsScreen() {
  const result = useStore(s => s.result);

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          No results yet. Go to the Design screen and run a calculation first.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Results</Text>

      {/* SPL Curve */}
      <Text style={styles.graphTitle}>SPL Curve</Text>
      <VictoryChart theme={VictoryTheme.material}>
        <VictoryAxis label="Frequency (Hz)" />
        <VictoryAxis dependentAxis label="SPL (dB)" />
        <VictoryLine data={result.splCurve} x="x" y="y" style={{ data: { stroke: "#4CAF50" } }} />
      </VictoryChart>

      {/* Port Velocity Curve */}
      <Text style={styles.graphTitle}>Port Velocity</Text>
      <VictoryChart theme={VictoryTheme.material}>
        <VictoryAxis label="Frequency (Hz)" />
        <VictoryAxis dependentAxis label="Velocity (m/s)" />
        <VictoryLine data={result.velocityCurve} x="x" y="y" style={{ data: { stroke: "#FF9800" } }} />
      </VictoryChart>

      {/* Future: Excursion Curve */}
      {/* Once we add excursion to math.ts, drop it in here the same way */}

      {/* Warnings */}
      <Text style={styles.graphTitle}>Warnings</Text>
      {result.warnings.length === 0 ? (
        <Text style={{ color: '#4CAF50' }}>✅ No issues detected</Text>
      ) : (
        result.warnings.map((w, i) => (
          <Text key={i} style={{ color: '#FF9800' }}>⚠️ {w}</Text>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#0e0f11' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
  graphTitle: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10, color: '#ccc' },
  message: { flex: 1, textAlign: 'center', marginTop: 50, color: '#aaa' },
});
