import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, Alert, Platform, Picker } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { presets } from './src/presets';
import { calculateEnclosure } from './src/math/tsMath';
import { exportDXF, saveDXF } from './src/export/exportDXF';

// Define types for our data
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

interface Preset {
  name: string;
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

export default function App() {
  const [driverParams, setDriverParams] = useState<DriverParams>({
    Vas: '',
    Qts: '',
    Fs: '',
    Qes: '',
    Sd: '',
    Xmax: '',
    Re: '',
    Le: '',
    Bl: '',
    sensitivity: '90'
  });

  const [boxParams, setBoxParams] = useState<BoxParams>({
    type: 'ported',
    volume: '',
    tuning: '',
    portDiameter: '10',
    portLength: '',
    numPorts: '1',
    slotWidth: '',
    slotHeight: '',
    ratio: '2.0'
  });

  const [results, setResults] = useState<any>(null);
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [velocityData, setVelocityData] = useState<VelocityDataPoint[]>([]);
  
  const handleCalculate = () => {
    try {
      const results = calculateEnclosure(driverParams, boxParams);
      setResults(results);
      setGraphData(results.splCurve);
      setVelocityData(results.velocityCurve);

      if (results.warnings.length > 0) {
        Alert.alert('Warnings', results.warnings.join('\n'));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleExportDXF = () => {
    try {
      if (!results) {
        Alert.alert('Error', 'Please calculate enclosure first');
        return;
      }
      
      const dxf = exportDXF(boxParams, driverParams, results);
      saveDXF(dxf, `enclosure-design-${new Date().getTime()}.dxf`);
    } catch (err: any) {
      Alert.alert('Export Error', err.message);
    }
  };

  const loadPreset = (preset: Preset) => {
    setDriverParams({...preset});
    Alert.alert('Preset Loaded', `${preset.name} parameters loaded`);
  };

  const renderInputField = (label: string, value: string, key: keyof DriverParams | keyof BoxParams, onChange: (text: string) => void, isDriver: boolean = true) => (
    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Text style={{ color: '#aaa', width: 90 }}>{label}:</Text>
      <TextInput
        style={{
          flex: 1,
          backgroundColor: '#222',
          color: '#fff',
          padding: 8,
          borderRadius: 5
        }}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#555"
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111' }}>
      <ScrollView style={{ padding: 10 }}>
        <Text style={{ color: '#fff', fontSize: 22, marginBottom: 10, fontWeight: 'bold' }}>Speaker Box Designer</Text>

        {/* Presets */}
        <View style={{ marginBottom: 15, borderColor: '#333', borderWidth: 1, borderRadius: 5, padding: 10 }}>
          <Text style={{ color: '#aaa', marginBottom: 5, fontWeight: 'bold' }}>Load Driver Preset:</Text>
          {presets.map((p, idx) => (
            <View key={idx} style={{ marginBottom: 5 }}>
              <Button title={p.name} onPress={() => loadPreset(p)} />
            </View>
          ))}
        </View>

        {/* Driver Parameters */}
        <View style={{ borderColor: '#333', borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 15 }}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10, fontWeight: 'bold' }}>Driver Parameters</Text>
          {renderInputField("Vas (L)", driverParams.Vas, "Vas", (val) => setDriverParams({ ...driverParams, Vas: val }))}
          {renderInputField("Qts", driverParams.Qts, "Qts", (val) => setDriverParams({ ...driverParams, Qts: val }))}
          {renderInputField("Fs (Hz)", driverParams.Fs, "Fs", (val) => setDriverParams({ ...driverParams, Fs: val }))}
          {renderInputField("Qes", driverParams.Qes, "Qes", (val) => setDriverParams({ ...driverParams, Qes: val }))}
          {renderInputField("Sd (cm²)", driverParams.Sd, "Sd", (val) => setDriverParams({ ...driverParams, Sd: val }))}
          {renderInputField("Xmax (mm)", driverParams.Xmax, "Xmax", (val) => setDriverParams({ ...driverParams, Xmax: val }))}
          {renderInputField("Re (Ω)", driverParams.Re, "Re", (val) => setDriverParams({ ...driverParams, Re: val }))}
          {renderInputField("Le (mH)", driverParams.Le, "Le", (val) => setDriverParams({ ...driverParams, Le: val }))}
          {renderInputField("Bl (T·m)", driverParams.Bl, "Bl", (val) => setDriverParams({ ...driverParams, Bl: val }))}
          {renderInputField("Sensitivity", driverParams.sensitivity, "sensitivity", (val) => setDriverParams({ ...driverParams, sensitivity: val }))}
        </View>

        {/* Box Parameters */}
        <View style={{ borderColor: '#333', borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 15 }}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10, fontWeight: 'bold' }}>Box Parameters</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#aaa', width: 90 }}>Type:</Text>
            <View style={{ flex: 1, backgroundColor: '#222', borderRadius: 5 }}>
              <Picker
                selectedValue={boxParams.type}
                style={{ color: '#fff', height: 40 }}
                onValueChange={(itemValue) => setBoxParams({ ...boxParams, type: itemValue })}
              >
                <Picker.Item label="Ported" value="ported" />
                <Picker.Item label="Sealed" value="sealed" />
                <Picker.Item label="4th Order Bandpass" value="bandpass4" />
                <Picker.Item label="6th Order Bandpass" value="bandpass6" />
              </Picker>
            </View>
          </View>
          
          {renderInputField("Volume (L)", boxParams.volume, "volume", (val) => setBoxParams({ ...boxParams, volume: val }), false)}
          
          {(boxParams.type === "ported" || boxParams.type.includes("bandpass")) && (
            <>
              {renderInputField("Tuning (Hz)", boxParams.tuning, "tuning", (val) => setBoxParams({ ...boxParams, tuning: val }), false)}
              {renderInputField("Port Diam (cm)", boxParams.portDiameter, "portDiameter", (val) => setBoxParams({ ...boxParams, portDiameter: val }), false)}
              {renderInputField("Port Length (cm)", boxParams.portLength, "portLength", (val) => setBoxParams({ ...boxParams, portLength: val }), false)}
              {renderInputField("Num Ports", boxParams.numPorts, "numPorts", (val) => setBoxParams({ ...boxParams, numPorts: val }), false)}
              {renderInputField("Slot Width (cm)", boxParams.slotWidth, "slotWidth", (val) => setBoxParams({ ...boxParams, slotWidth: val }), false)}
              {renderInputField("Slot Height (cm)", boxParams.slotHeight, "slotHeight", (val) => setBoxParams({ ...boxParams, slotHeight: val }), false)}
            </>
          )}
          
          {boxParams.type.includes("bandpass") && (
            renderInputField("Vratio", boxParams.ratio, "ratio", (val) => setBoxParams({ ...boxParams, ratio: val }), false)
          )}
        </View>

        {/* Results */}
        {results && (
          <View style={{ borderColor: '#333', borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 15 }}>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10, fontWeight: 'bold' }}>Results</Text>
            <Text style={{ color: '#aaa', marginBottom: 5 }}>Box Volume: {results.Vb.toFixed(2)} L</Text>
            {(boxParams.type === "ported" || boxParams.type.includes("bandpass")) && (
              <>
                <Text style={{ color: '#aaa', marginBottom: 5 }}>Tuning Frequency: {results.Fb.toFixed(2)} Hz</Text>
                <Text style={{ color: '#aaa', marginBottom: 5 }}>Port Length: {results.Lv.toFixed(2)} cm</Text>
              </>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 }}>
          <Button title="Calculate" onPress={handleCalculate} />
          <Button title="Export DXF" onPress={handleExportDXF} />
        </View>
        
        {/* SPL Chart */}
        {graphData.length > 0 && (
          <>
            <Text style={{ color: '#fff', fontSize: 16, marginTop: 15, fontWeight: 'bold' }}>SPL Response</Text>
            <VictoryChart 
              theme={VictoryTheme.material} 
              height={250}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis 
                label="Frequency (Hz)" 
                style={{ 
                  axisLabel: { padding: 30, fill: '#fff' },
                  tickLabels: { fontSize: 10, fill: '#fff' } 
                }} 
              />
              <VictoryAxis 
                dependentAxis 
                label="SPL (dB)" 
                style={{ 
                  axisLabel: { padding: 40, fill: '#fff' },
                  tickLabels: { fontSize: 10, fill: '#fff' } 
                }} 
              />
              <VictoryLine
                data={graphData}
                x="freq"
                y="spl"
                style={{ data: { stroke: "#4caf50", strokeWidth: 2 } }}
              />
            </VictoryChart>
          </>
        )}

        {/* Port Velocity Chart */}
        {velocityData.length > 0 && velocityData.some(v => v.velocity > 0) && (
          <>
            <Text style={{ color: '#fff', fontSize: 16, marginTop: 15, fontWeight: 'bold' }}>Port Velocity</Text>
            <VictoryChart 
              theme={VictoryTheme.material} 
              height={250}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis 
                label="Frequency (Hz)" 
                style={{ 
                  axisLabel: { padding: 30, fill: '#fff' },
                  tickLabels: { fontSize: 10, fill: '#fff' } 
                }} 
              />
              <VictoryAxis 
                dependentAxis 
                label="Velocity (m/s)" 
                style={{ 
                  axisLabel: { padding: 40, fill: '#fff' },
                  tickLabels: { fontSize: 10, fill: '#fff' } 
                }} 
              />
              <VictoryLine
                data={velocityData}
                x="freq"
                y="velocity"
                style={{ data: { stroke: "#f54242", strokeWidth: 2 } }}
              />
              <VictoryLine
                data={velocityData.map(v => ({ freq: v.freq, velocity: 17 }))}
                x="freq"
                y="velocity"
                style={{ data: { stroke: "#ff9800", strokeWidth: 1, strokeDasharray: "5,5" } }}
              />
            </VictoryChart>
            <Text style={{ color: '#ff9800', fontSize: 12, textAlign: 'center' }}>--- 17 m/s Warning Threshold</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}