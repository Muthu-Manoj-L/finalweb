import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Fingerprint } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [dotsVisible, setDotsVisible] = useState(true);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      const compat = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compat && enrolled);
    })();
  }, []);

  const handleBiometricAuth = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Biometric authentication is not available on web');
      return;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access DeepSpectrum',
      });
      if (result.success) {
        // For demo mode: sign in with demo credentials when biometric succeeds
        try {
          setLoading(true);
          // demo-only credentials
          await signIn('1234', '1234');
          router.replace('/(tabs)');
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async () => {
    // Demo-only gate: both fields must be '1234'
    if (email !== '1234' || password !== '1234') {
      Alert.alert('Invalid credentials', "Enter email and password as 1234 to sign in (demo)");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0a192f", "#122240"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerWrap}>
            <View style={styles.waveContainer} pointerEvents="none">
              <Svg viewBox="0 0 500 150" preserveAspectRatio="none" style={styles.wave}>
                <Path d="M0,100 C150,200 350,0 500,100 L500,0 L0,0 Z" fill="#122240" />
              </Svg>
              <Svg viewBox="0 0 500 150" preserveAspectRatio="none" style={[styles.wave, { position: 'absolute', top: 10 }] }>
                <Path d="M0,80 C150,180 300,30 500,80 L500,0 L0,0 Z" stroke="rgba(255,105,180,0.28)" strokeWidth={2} fill="none" />
              </Svg>
            </View>

            <Text style={styles.brand}>DeepSpectrum</Text>
            <Text style={styles.brandSub}>Analytics Private Limited</Text>
            <View style={styles.underlineGradient} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.signInTitle}>Sign in</Text>
            <View style={styles.signInUnderline} />

            <View style={styles.card}>
              <View style={styles.inputRow}>
                <Mail size={20} color="#ff69b4" />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#cbd5e1"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputRow}>
                <Lock size={20} color="#ff69b4" />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#cbd5e1"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                  <Text style={{ color: '#cbd5e1' }}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rowBetween}>
                <View style={styles.rememberRow}>
                  <TouchableOpacity style={styles.checkbox} />
                  <Text style={styles.rememberText}>Remember me</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.forgot}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.signInButton} onPress={handleLogin} activeOpacity={0.9}>
                <LinearGradient colors={["#ff69b4", "#da70d6"]} style={styles.signInButtonInner}>
                  <Text style={styles.signInButtonText}>Sign in</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={styles.noAccountText}>Do not have an account? <Text style={styles.signUpText}>Sign up</Text></Text>
              </View>

              {/* Fingerprint access option (visible on mobile when available) */}
              {biometricAvailable && (
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                  <TouchableOpacity onPress={handleBiometricAuth} accessibilityLabel="Fingerprint sign in" style={styles.fingerprintButton} activeOpacity={0.85}>
                    <View style={styles.fingerprintCircle}>
                      <Fingerprint size={28} color="#ff69b4" />
                    </View>
                    <Text style={styles.fingerprintText}>Fingerprint Access</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Looping bouncing dots */}
              <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                <View style={styles.dotsRow}>
                  <View style={[styles.dot, { animationDelay: '0ms' }]} />
                  <View style={[styles.dot, { animationDelay: '200ms', marginLeft: 6 }]} />
                  <View style={[styles.dot, { animationDelay: '400ms', marginLeft: 6 }]} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.decorative} pointerEvents="none">
            <View style={styles.pinkBlur} />
            <View style={styles.violetBlur} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a192f' },
  scrollContent: { flexGrow: 1, padding: 18, justifyContent: 'center' },
  headerWrap: { alignItems: 'center', marginBottom: 18 },
  waveContainer: { width: '100%', height: 120, overflow: 'hidden' },
  wave: { width: '100%', height: '100%' },
  brand: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 10, backgroundClip: 'text' as any },
  brandSub: { color: '#cbd5e1', marginTop: 4 },
  underlineGradient: { width: 96, height: 4, borderRadius: 999, marginTop: 10, backgroundColor: '#ff69b4' },
  formContainer: { flex: 1, paddingHorizontal: 6, maxWidth: 520, width: '100%', alignSelf: 'center' },
  signInTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  signInUnderline: { width: 64, height: 3, borderRadius: 999, backgroundColor: '#ff69b4', alignSelf: 'center', marginTop: 8, marginBottom: 14 },
  card: { backgroundColor: 'rgba(18,34,64,0.28)', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,105,180,0.12)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingVertical: 10, marginBottom: 12 },
  input: { marginLeft: 12, flex: 1, color: '#fff', paddingVertical: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,105,180,0.4)', marginRight: 8 },
  rememberText: { color: '#cbd5e1' },
  forgot: { color: '#cbd5e1' },
  signInButton: { marginTop: 14, borderRadius: 999, overflow: 'hidden' },
  signInButtonInner: { paddingVertical: 14, alignItems: 'center' },
  signInButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  noAccountText: { color: '#cbd5e1' },
  signUpText: { color: '#ff69b4', fontWeight: '700' },
  decorative: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  pinkBlur: { position: 'absolute', top: '20%', left: -40, width: 160, height: 160, backgroundColor: '#ff69b4', borderRadius: 100, opacity: 0.18, transform: [{ scale: 1 }] },
  violetBlur: { position: 'absolute', bottom: '30%', right: -40, width: 160, height: 160, backgroundColor: '#da70d6', borderRadius: 100, opacity: 0.18 },
  fingerprintButton: { alignItems: 'center' },
  fingerprintCircle: { width: 64, height: 64, borderRadius: 999, backgroundColor: '#122240', borderWidth: 1, borderColor: 'rgba(255,105,180,0.2)', alignItems: 'center', justifyContent: 'center' },
  fingerprintText: { color: '#cbd5e1', marginTop: 8 },
  dotsRow: { flexDirection: 'row', alignItems: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#ff69b4', transform: [{ translateY: 0 }] },
});

