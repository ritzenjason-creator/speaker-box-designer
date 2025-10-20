// app/export.tsx
import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useStore } from './store';
import { exportDXF } from '../utils/exportDXF';

export default function ExportScreen() {
  const box = useStore(s => s.box);
  const result = useStore(s => s.result);

  const handleExport = async () => {
    if (!box || !result) {
      Alert.alert('No design to export', 'Please run a calculation first.');
      return;
    }

    try {
      // Generate DXF string from your util
      const dxfContent = exportDXF(box, result);

      // Save to a temporary file
      const fileUri = FileSystem.cacheDirectory + 'cutlist.dxf';
      await FileSystem.writeAsStringAsync(fileUri, dxfContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing not available', 'The DXF file was saved but cannot be shared on this device.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Export failed', 'Something went wrong while exporting.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export Cut Sheet</Text>
      <Text style={styles.subtitle}>
        Generate a DXF file for your box panels and share it to CAD or email.
      </Text>

      <Button title="Export DXF" onPress={handleExport} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#0e0f11' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 30, textAlign: 'center' },
});
