import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Fingerprint } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const accentPrimary = colors.primary; // replaces pink
  const accentGradientStart = colors.primaryGradientStart || colors.primary;
  const accentGradientEnd = colors.primaryGradientEnd || colors.primary;

  const hexToRgba = (hex: string, alpha = 1) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [dotsVisible, setDotsVisible] = useState(true);
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      const compat = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compat && enrolled);
    })();
  }, []);

  // start dot animations
  useEffect(() => {
    const createLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -8, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.delay(200),
        ])
      );
    };

    const a1 = createLoop(dot1, 0);
    const a2 = createLoop(dot2, 120);
    const a3 = createLoop(dot3, 240);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

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

  // Web: helper to check for platform authenticator availability
  const webPlatformAvailable = async () => {
    try {
      // @ts-ignore
      if (window && (window as any).PublicKeyCredential && (window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        // @ts-ignore
        return await (window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
    } catch (_) {
      return false;
    }
    return false;
  };

  // Web: Demo register a platform credential (client-side only demo)
  const handleWebRegister = async () => {
    // Only run in browser
    // Create a client-side credential to trigger platform biometric prompt (demo only)
    try {
      // @ts-ignore
      const pub = (window as any).PublicKeyCredential;
      if (!pub) {
        Alert.alert('Not supported', 'WebAuthn is not available in this browser');
        return;
      }

      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'DeepSpectrum' },
          user: { id: userId, name: 'demo', displayName: 'Demo User' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
          attestation: 'none',
        },
      } as any);

      if (cred) {
        const rawId = (cred as PublicKeyCredential).rawId;
        const b64 = Buffer.from(new Uint8Array(rawId)).toString('base64');
        localStorage.setItem('ds_demo_cred', b64);
        Alert.alert('Registered', 'Demo platform credential registered. You can now authenticate with fingerprint.');
      }
    } catch (e: any) {
      Alert.alert('WebAuthn Error', e?.message || String(e));
    }
  };

  // Web: Demo authenticate using stored credential
  const handleWebAuthenticate = async () => {
    try {
      const stored = localStorage.getItem('ds_demo_cred');
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      let allow: any[] = [];
      if (stored) {
        const raw = Uint8Array.from(Buffer.from(stored, 'base64'));
        allow = [{ id: raw.buffer, type: 'public-key', transports: ['internal'] }];
      }

      const assertion = await navigator.credentials.get({ publicKey: { challenge, allowCredentials: allow, userVerification: 'required', timeout: 60000 } } as any);
      if (assertion) {
        // demo: treat success as biometric sign-in
        setLoading(true);
        try {
          await signIn('1234', '1234');
          router.replace('/(tabs)');
        } finally {
          setLoading(false);
        }
      }
    } catch (e: any) {
      Alert.alert('WebAuthn Error', e?.message || String(e));
    }
  };

  // OAuth sign-in helpers (google, github, linkedin)
  const handleOAuth = async (provider: 'google' | 'github' | 'linkedin') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) {
        Alert.alert('OAuth Error', error.message);
      }
      // On web supabase will redirect to provider; on mobile it may open external browser.
    } catch (e: any) {
      Alert.alert('OAuth Error', e?.message || String(e));
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
            <View style={[styles.underlineGradient, { backgroundColor: accentPrimary }]} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.signInTitle}>Sign in</Text>
            <View style={styles.signInUnderline} />

            <View style={[styles.card, { borderColor: hexToRgba(accentPrimary, 0.12) }]}>
              <View style={styles.inputRow}>
                <Mail size={20} color={accentPrimary} />
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
                <Lock size={20} color={accentPrimary} />
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
                <LinearGradient colors={[accentGradientStart, accentGradientEnd]} style={styles.signInButtonInner}>
                  <Text style={styles.signInButtonText}>Sign in</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={styles.noAccountText}>Do not have an account? <Text style={[styles.signUpText, { color: accentPrimary }]}>Sign up</Text></Text>
              </View>

              {/* Fingerprint access option (visible on mobile when available) */}
              {biometricAvailable && (
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                  <TouchableOpacity onPress={handleBiometricAuth} accessibilityLabel="Fingerprint sign in" style={styles.fingerprintButton} activeOpacity={0.85}>
                    <View style={[styles.fingerprintCircle, { borderColor: hexToRgba(accentPrimary, 0.2) }]}>
                      <Fingerprint size={28} color={accentPrimary} />
                    </View>
                    <Text style={[styles.fingerprintText, { color: colors.textSecondary }]}>Fingerprint Access</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Looping bouncing dots */}
              <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                <View style={styles.dotsRow}>
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }], marginLeft: 6 }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }], marginLeft: 6 }]} />
                </View>
              </View>

              {/* Social OAuth buttons (Google, LinkedIn, GitHub) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <TouchableOpacity onPress={() => handleOAuth('google')} style={styles.socialBtn} accessibilityLabel="Sign in with Google">
                  <Text style={styles.socialIcon}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOAuth('linkedin')} style={styles.socialBtn} accessibilityLabel="Sign in with LinkedIn">
                  <Text style={styles.socialIcon}>in</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOAuth('github')} style={styles.socialBtn} accessibilityLabel="Sign in with GitHub">
                  <Text style={styles.socialIcon}>GH</Text>
                </TouchableOpacity>
              </View>

              {/* Web platform authenticator (WebAuthn) helpers: show register/use buttons on web */}
              {Platform.OS === 'web' && (
                <View style={{ marginTop: 12, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={async () => { if (await webPlatformAvailable()) await handleWebRegister(); else Alert.alert('Not supported', 'Platform authenticator not available'); }} style={[styles.webAuthBtn, { marginRight: 8 }]}>
                      <Text style={styles.webAuthText}>Register Fingerprint (Web)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => { if (await webPlatformAvailable()) await handleWebAuthenticate(); else Alert.alert('Not supported', 'Platform authenticator not available'); }} style={styles.webAuthBtn}>
                      <Text style={styles.webAuthText}>Use Fingerprint (Web)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  socialBtn: { flex: 1, marginHorizontal: 6, backgroundColor: '#122240', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  socialIcon: { color: '#fff', fontWeight: '700' },
  webAuthBtn: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#122240', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,105,180,0.12)' },
  webAuthText: { color: '#cbd5e1', fontSize: 12 },
});

