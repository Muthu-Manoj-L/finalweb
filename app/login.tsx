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
import { FontAwesome } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Svg, { Path } from 'react-native-svg';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  // animated values for the three dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // On web we can offer a WebAuthn-based demo if the browser supports it.
        const webAvailable = typeof window !== 'undefined' && (window.PublicKeyCredential !== undefined);
        setBiometricAvailable(!!webAvailable);
        return;
      }

      const compat = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compat && enrolled);
    })();

    // start animated dots loop
    const startLoop = (anim: Animated.Value, delay = 0) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -8, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.delay(150),
        ])
      ).start();
    };

    startLoop(dot1, 0);
    startLoop(dot2, 150);
    startLoop(dot3, 300);
  }, []);

  const handleBiometricAuth = async () => {
    if (Platform.OS === 'web') {
      // On web we route to WebAuthn demo authenticate which uses navigator.credentials
      return handleWebAuthenticate();
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

  const handleSocialLogin = async (provider: 'google' | 'github' | 'linkedin') => {
    // In this frontend demo we stub social logins to a demo session.
    // If you wire up supabase or another provider, replace this with the real flow.
    Alert.alert('Social login (demo)', `Signing in with ${provider} (demo)`);
    setLoading(true);
    try {
      await signIn('1234', '1234');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  // --- WebAuthn demo helpers (client-only, stores credential in localStorage) ---
  // helper: base64url <-> ArrayBuffer
  const bufferToBase64Url = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const base64UrlToBuffer = (base64url: string) => {
    const pad = (4 - (base64url.length % 4)) % 4;
    const base64 = (base64url + '='.repeat(pad)).replace(/-/g, '+').replace(/_/g, '/');
    const str = atob(base64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes.buffer;
  };

  const handleWebRegister = async () => {
    if (typeof window === 'undefined' || !(window as any).PublicKeyCredential) {
      Alert.alert('Not supported', 'WebAuthn is not supported in this browser');
      return;
    }

    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userId = window.crypto.getRandomValues(new Uint8Array(16));

      const publicKey: any = {
        challenge: challenge.buffer,
        rp: { name: 'Demo Spectro', id: window.location.hostname },
        user: { id: userId.buffer, name: 'demo@local', displayName: 'Demo User' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: { userVerification: 'preferred' },
        timeout: 60000,
      };

      const cred: any = await (navigator as any).credentials.create({ publicKey });
      if (cred) {
        // store credential id as base64url so we can use it during get()
        const id = bufferToBase64Url(cred.rawId || cred.id);
        window.localStorage.setItem('webauthn-demo-cred', JSON.stringify({ id }));
        Alert.alert('Registered', 'Demo authenticator registered on this device/browser');
      }
    } catch (err) {
      Alert.alert('Register failed', String(err));
    }
  };

  const handleWebAuthenticate = async () => {
    if (typeof window === 'undefined' || !(window as any).PublicKeyCredential) {
      Alert.alert('Not supported', 'WebAuthn is not supported in this browser');
      return;
    }

    try {
      const stored = window.localStorage.getItem('webauthn-demo-cred');
      const allowCredentials = stored
        ? [{ id: base64UrlToBuffer(JSON.parse(stored).id), type: 'public-key' }]
        : undefined;

      const publicKey: any = {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)).buffer,
        timeout: 60000,
        allowCredentials,
        userVerification: 'preferred',
      };

      const assertion: any = await (navigator as any).credentials.get({ publicKey });
      if (assertion) {
        // demo success: sign in with demo credentials
        setLoading(true);
        await signIn('1234', '1234');
        setLoading(false);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Auth failed', 'No credential asserted');
      }
    } catch (err) {
      Alert.alert('Auth failed', String(err));
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
    <LinearGradient colors={[colors.primaryGradientStart, colors.primaryGradientEnd]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerWrap}>
            <View style={styles.waveContainer} pointerEvents="none">
              <Svg viewBox="0 0 500 150" preserveAspectRatio="none" style={styles.wave}>
                <Path d="M0,100 C150,200 350,0 500,100 L500,0 L0,0 Z" fill={colors.primaryGradientEnd} />
              </Svg>
              <Svg viewBox="0 0 500 150" preserveAspectRatio="none" style={[styles.wave, { position: 'absolute', top: 10 }] }>
                <Path d="M0,80 C150,180 300,30 500,80 L500,0 L0,0 Z" stroke={`${colors.primary}28`} strokeWidth={2} fill="none" />
              </Svg>
            </View>

            <Text style={styles.brand}>DeepSpectrum</Text>
            <Text style={styles.brandSub}>Analytics Private Limited</Text>
            <View style={[styles.underlineGradient, { backgroundColor: colors.primary }]} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.signInTitle}>Sign in</Text>
            <View style={styles.signInUnderline} />

            <View style={styles.card}>
              <View style={styles.inputRow}>
                  <Mail size={20} color={colors.primary} />
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
                  <Lock size={20} color={colors.primary} />
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
                <LinearGradient colors={[colors.primaryGradientStart, colors.primaryGradientEnd]} style={styles.signInButtonInner}>
                  <Text style={styles.signInButtonText}>Sign in</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={styles.noAccountText}>Do not have an account? <Text style={[styles.signUpText, { color: colors.primary }]}>Sign up</Text></Text>
              </View>

              {/* Fingerprint access option (visible on mobile when available) */}
              {biometricAvailable && (
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                  {Platform.OS === 'web' ? (
                    <>
                      <TouchableOpacity onPress={handleWebAuthenticate} accessibilityLabel="Use fingerprint (web)" style={styles.fingerprintButton} activeOpacity={0.85}>
                        <View style={styles.fingerprintCircle}>
                          <Fingerprint size={28} color={colors.primary} />
                        </View>
                        <Text style={styles.fingerprintText}>Use platform authenticator</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleWebRegister} accessibilityLabel="Register authenticator (web)" style={[styles.fingerprintButton, { marginTop: 8 }]} activeOpacity={0.85}>
                        <Text style={[styles.fingerprintText, { color: '#cbd5e1' }]}>Register demo authenticator</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity onPress={handleBiometricAuth} accessibilityLabel="Fingerprint sign in" style={styles.fingerprintButton} activeOpacity={0.85}>
                      <View style={styles.fingerprintCircle}>
                        <Fingerprint size={28} color={colors.primary} />
                      </View>
                      <Text style={styles.fingerprintText}>Fingerprint Access</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Looping bouncing dots */}
              <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                <View style={styles.dotsRow}>
                  <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }], backgroundColor: colors.primary }]} />
                  <Animated.View style={[styles.dot, { marginLeft: 6, transform: [{ translateY: dot2 }], backgroundColor: colors.primary }]} />
                  <Animated.View style={[styles.dot, { marginLeft: 6, transform: [{ translateY: dot3 }], backgroundColor: colors.primary }]} />
                </View>
              </View>
              
              {/* Social login buttons (demo) */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 14 }}>
                <TouchableOpacity onPress={() => handleSocialLogin('google')} style={[styles.socialButton, { backgroundColor: '#db4437' }]} accessibilityLabel="Sign in with Google">
                  <FontAwesome name="google" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSocialLogin('linkedin')} style={[styles.socialButton, { backgroundColor: '#0a66c2', marginLeft: 12 }]} accessibilityLabel="Sign in with LinkedIn">
                  <FontAwesome name="linkedin" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSocialLogin('github')} style={[styles.socialButton, { backgroundColor: '#333', marginLeft: 12 }]} accessibilityLabel="Sign in with GitHub">
                  <FontAwesome name="github" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.decorative} pointerEvents="none">
            <View style={[styles.pinkBlur, { backgroundColor: colors.primaryGradientStart }]} />
            <View style={[styles.violetBlur, { backgroundColor: colors.primaryGradientEnd }]} />
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
  underlineGradient: { width: 96, height: 4, borderRadius: 999, marginTop: 10 },
  formContainer: { flex: 1, paddingHorizontal: 6, maxWidth: 520, width: '100%', alignSelf: 'center' },
  signInTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  signInUnderline: { width: 64, height: 3, borderRadius: 999, alignSelf: 'center', marginTop: 8, marginBottom: 14 },
  card: { backgroundColor: 'rgba(18,34,64,0.28)', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
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
  signUpText: { color: '#fff', fontWeight: '700' },
  decorative: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  pinkBlur: { position: 'absolute', top: '20%', left: -40, width: 160, height: 160, borderRadius: 100, opacity: 0.18, transform: [{ scale: 1 }] },
  violetBlur: { position: 'absolute', bottom: '30%', right: -40, width: 160, height: 160, borderRadius: 100, opacity: 0.18 },
  fingerprintButton: { alignItems: 'center' },
  fingerprintCircle: { width: 64, height: 64, borderRadius: 999, backgroundColor: '#122240', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  fingerprintText: { color: '#cbd5e1', marginTop: 8 },
  dotsRow: { flexDirection: 'row', alignItems: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#ff69b4', transform: [{ translateY: 0 }] },
  socialButton: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

