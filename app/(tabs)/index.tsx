import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wifi,
  Battery,
  Signal,
  Gauge,
  Microscope,
  Database,
  Activity,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { GradientCard } from '@/components/GradientCard';
import { IconCard } from '@/components/IconCard';
import { CircularProgress } from '@/components/CircularProgress';
import { CalibrationModal } from '@/components/CalibrationModal';
import { MeasurementModal } from '@/components/MeasurementModal';
import { WidgetModal } from '@/components/WidgetModal';
import { DevicePickerModal } from '@/components/DevicePickerModal';
import * as ExpoCamera from 'expo-camera';
import { supabase } from '@/lib/supabase';
import { FRONTEND_ONLY } from '@/contexts/AuthContext';

interface DeviceStatus {
  id: string;
  device_name: string;
  status: string;
  battery_level: number;
  signal_strength: number;
  last_connected: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, profile } = useAuth();

  const [calibrationVisible, setCalibrationVisible] = useState(false);
  const [measurementVisible, setMeasurementVisible] = useState(false);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);

  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [measurementCount, setMeasurementCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user || FRONTEND_ONLY) return;

    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'online')
      .maybeSingle();

    if (devices) {
      setDevice(devices);
    }

    const { data: measurements, count } = await supabase
      .from('measurements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setMeasurementCount(count || 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: 'Calibrate',
      subtitle: 'Calibrate spectrometer',
      icon: Gauge,
      onPress: () => setCalibrationVisible(true),
    },
    {
      title: 'Measure',
      subtitle: 'Start new measurement',
      icon: Microscope,
      onPress: () => setMeasurementVisible(true),
    },
    {
      title: 'Recorded Data',
      subtitle: 'View past measurements',
      icon: Database,
      onPress: () => { setActiveWidget('Recorded Data'); setWidgetVisible(true); },
    },
    {
      title: 'Real-Time',
      subtitle: 'Live spectral view',
      icon: Activity,
      onPress: () => {
        // If the currently selected device is a proximity sensor, open the proximity real-time widget
        if (device && device.id?.startsWith('proximity')) {
          setActiveWidget('Real-Time Proximity');
        } else {
          setActiveWidget('Real-Time Spectral');
        }
        setWidgetVisible(true);
      },
    },
  ];

  const availableDevices = [
    { id: 'proximity:local', device_name: 'Phone proximity sensor', status: 'online', battery_level: 100, signal_strength: 100, last_connected: new Date().toISOString() },
    // you can append real remote devices from supabase/devices table here
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.settingsButton, { backgroundColor: colors.primary }]}
          >
            <SettingsIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {device ? (
          <GradientCard gradient gradientColors={[colors.primaryGradientStart, colors.primaryGradientEnd]} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIconContainer}>
                <Wifi size={28} color="#FFFFFF" />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.device_name}</Text>
                <Text style={styles.deviceStatus}>Connected</Text>
              </View>
            </View>

            <View style={styles.deviceStats}>
              <View style={styles.statItem}>
                <CircularProgress
                  progress={device.battery_level}
                  size={80}
                  strokeWidth={8}
                  showPercentage={true}
                />
                <Text style={styles.statLabel}>Battery</Text>
              </View>

              <View style={styles.statItem}>
                <CircularProgress
                  progress={device.signal_strength}
                  size={80}
                  strokeWidth={8}
                  showPercentage={true}
                />
                <Text style={styles.statLabel}>Signal</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.countCircle}>
                  <Text style={styles.countNumber}>{measurementCount}</Text>
                </View>
                <Text style={styles.statLabel}>Measurements</Text>
              </View>
            </View>
          </GradientCard>
        ) : (
          <GradientCard style={styles.noDeviceCard}>
            <Wifi size={40} color={colors.primary} />
            <Text style={[styles.noDeviceText, { color: colors.text }]}>No Device Connected</Text>
            <Text style={[styles.noDeviceSubtext, { color: colors.textSecondary }]}>Select a device from the list below</Text>

            {availableDevices.map((d) => (
              <TouchableOpacity key={d.id} style={{ marginTop: 10 }} onPress={() => setPickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Wifi size={20} color={colors.primary} />
                    <Text style={{ color: colors.text, marginLeft: 8 }}>{d.device_name}</Text>
                  </View>
                  <Text style={{ color: colors.textSecondary }}>{d.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </GradientCard>
        )}

        <DevicePickerModal visible={pickerVisible} onClose={() => setPickerVisible(false)} onSelect={(d) => {
          // On selection, immediately set the device and open the camera widget for camera devices.
          const ds: DeviceStatus = { id: d.id, device_name: d.device_name, status: 'online', battery_level: 100, signal_strength: 100, last_connected: new Date().toISOString() };
          setDevice(ds);
          if (d.id && d.id.startsWith('camera')) {
            setActiveWidget('Real-Time Camera');
            setWidgetVisible(true);
          }
        }} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>

          {quickActions.map((action, index) => (
            <IconCard
              key={index}
              title={action.title}
              subtitle={action.subtitle}
              icon={action.icon}
              onPress={action.onPress}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Activity
          </Text>
          <GradientCard>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No recent activity
            </Text>
          </GradientCard>
        </View>
      </ScrollView>

      <CalibrationModal visible={calibrationVisible} onClose={() => setCalibrationVisible(false)} />
      <MeasurementModal visible={measurementVisible} onClose={() => setMeasurementVisible(false)} />
      <WidgetModal visible={widgetVisible} widget={activeWidget} onClose={() => { setWidgetVisible(false); setActiveWidget(null); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  deviceCard: {
    marginBottom: 24,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  deviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  countCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noDeviceCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  noDeviceText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noDeviceSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  chevron: {
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});
