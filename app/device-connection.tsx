import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Wifi, WifiOff, Signal, Battery, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { GradientButton } from '@/components/GradientButton';
import { GradientCard } from '@/components/GradientCard';
import { supabase } from '@/lib/supabase';

interface Device {
  id: string;
  device_name: string;
  serial_number: string;
  wifi_ssid: string;
  battery_level: number;
  signal_strength: number;
  status: string;
}

export default function DeviceConnectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setDevices(data);
    }
  };

  const scanForDevices = async () => {
    setScanning(true);
    setTimeout(async () => {
      await loadDevices();
      setScanning(false);
    }, 2000);
  };

  const connectToDevice = async (device: Device) => {
    setConnecting(device.id);

    setTimeout(async () => {
      const { error } = await supabase
        .from('devices')
        .update({
          status: 'online',
          last_connected: new Date().toISOString(),
        })
        .eq('id', device.id);

      setConnecting(null);

      if (!error) {
        Alert.alert('Success', `Connected to ${device.device_name}`, [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to connect to device');
      }
    }, 1500);
  };

  const getSignalIcon = (strength: number) => {
    if (strength > 70) return <Signal size={20} color={colors.success} />;
    if (strength > 40) return <Signal size={20} color={colors.warning} />;
    return <Signal size={20} color={colors.error} />;
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return colors.success;
    if (level > 20) return colors.warning;
    return colors.error;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Connect Device</Text>
        <Text style={styles.headerSubtitle}>
          Scan and connect to your ESP32 spectrometer
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scanSection}>
          <GradientButton
            title={scanning ? 'Scanning...' : 'Scan for Devices'}
            onPress={scanForDevices}
            loading={scanning}
            size="large"
          />
        </View>

        {scanning && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.scanningIndicator}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.scanningText, { color: colors.textSecondary }]}>
              Looking for devices...
            </Text>
          </Animated.View>
        )}

        <View style={styles.devicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available Devices
            </Text>
            <TouchableOpacity onPress={loadDevices}>
              <RefreshCw size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {devices.length === 0 ? (
            <GradientCard style={styles.emptyCard}>
              <WifiOff size={48} color={colors.textSecondary} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No devices found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Scan to discover ESP32 spectrometers
              </Text>
            </GradientCard>
          ) : (
            devices.map((device) => (
              <Animated.View key={device.id} entering={FadeIn}>
                <TouchableOpacity
                  onPress={() => connectToDevice(device)}
                  disabled={connecting !== null}
                  activeOpacity={0.8}
                >
                  <GradientCard style={styles.deviceCard}>
                    <View style={styles.deviceHeader}>
                      <LinearGradient
                        colors={[
                          colors.primaryGradientStart + '20',
                          colors.primaryGradientEnd + '20',
                        ]}
                        style={styles.deviceIcon}
                      >
                        <Wifi size={24} color={colors.primary} />
                      </LinearGradient>

                      <View style={styles.deviceInfo}>
                        <Text style={[styles.deviceName, { color: colors.text }]}>
                          {device.device_name}
                        </Text>
                        <Text style={[styles.deviceSerial, { color: colors.textSecondary }]}>
                          {device.wifi_ssid || device.serial_number}
                        </Text>
                      </View>

                      {device.status === 'online' ? (
                        <CheckCircle size={24} color={colors.success} />
                      ) : connecting === device.id ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <XCircle size={24} color={colors.textSecondary} />
                      )}
                    </View>

                    <View style={styles.deviceStats}>
                      <View style={styles.stat}>
                        {getSignalIcon(device.signal_strength)}
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                          {device.signal_strength}%
                        </Text>
                      </View>

                      <View style={styles.stat}>
                        <Battery size={20} color={getBatteryColor(device.battery_level)} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                          {device.battery_level}%
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              device.status === 'online'
                                ? colors.success + '20'
                                : colors.textSecondary + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                device.status === 'online'
                                  ? colors.success
                                  : colors.textSecondary,
                            },
                          ]}
                        >
                          {device.status}
                        </Text>
                      </View>
                    </View>
                  </GradientCard>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  scanSection: {
    marginBottom: 24,
  },
  scanningIndicator: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scanningText: {
    marginTop: 12,
    fontSize: 16,
  },
  devicesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  deviceCard: {
    marginBottom: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceSerial: {
    fontSize: 13,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
