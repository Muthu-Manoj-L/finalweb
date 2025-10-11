import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function MeasurementModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const [preset, setPreset] = useState('Default');
  const [integration, setIntegration] = useState('100');
  const [running, setRunning] = useState(false);

  const startMeasurement = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      onClose();
    }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: (colors.background === '#0F172A' ? 'rgba(3,6,15,0.75)' : 'rgba(255,255,255,0.6)') }]}>
        <LinearGradient colors={[colors.surface + 'EE', colors.background + 'EE']} style={[styles.overlay, { padding: 18 }]}> 
          <View style={[styles.popup, { backgroundColor: colors.surface, borderColor: colors.primary + '55' }]}> 
            <View style={[styles.neon, { backgroundColor: colors.primary + 'DD' }]} />
            <Text style={[styles.title, { color: colors.text, marginTop: 8 }]}>Measurement</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Configure measurement parameters</Text>

            <View style={styles.options}>
              <Text style={[styles.label, { color: colors.text }]}>Preset</Text>
              <View style={styles.presetsRow}>
                {['Default', 'High Sensitivity', 'Fast'].map((p) => (
                  <TouchableOpacity key={p} style={[styles.presetBtn, preset === p && { borderColor: colors.primary }]} onPress={() => setPreset(p)}>
                    <Text style={{ color: colors.text }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Integration Time (ms)</Text>
              <TextInput value={integration} onChangeText={setIntegration} keyboardType="numeric" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={startMeasurement} style={[styles.runBtn, { backgroundColor: colors.primary }]}> 
                {running ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff' }}>Start Measurement</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  popup: { width: '90%', padding: 20, borderRadius: 16, borderWidth: 1, shadowColor: '#00f', shadowOpacity: 0.08 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  options: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 8 },
  presetsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  presetBtn: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, height: 44 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelBtn: { padding: 12 },
  runBtn: { padding: 12, borderRadius: 12 },
  neon: { height: 4, borderRadius: 4, marginBottom: 8 },
});
