import React, { useState } from 'react';
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
import { Fingerprint, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Image } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useAuth, FRONTEND_ONLY } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { GradientButton } from '@/components/GradientButton';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    if (Platform.OS === 'web') return;

    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const handleBiometricAuth = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Biometric authentication is not available on web');
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access DeepSpectrum',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Alert.alert('Success', 'Biometric authentication successful');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // In frontend-only mode, signIn is stubbed to auto-login. Otherwise, just navigate.
    setLoading(true);
    try {
      await signIn('dev@local', 'password');
    } catch (e) {
      // ignore errors when skipping
    } finally {
      setLoading(false);
      router.replace('/(tabs)');
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.surface]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerWrapper}>
            <LinearGradient
              colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
              style={styles.headerBackground}
            >
              <View style={[styles.decorativeCircle, { backgroundColor: colors.primary + '22' }]} />
              <View style={styles.headerContent}>
                <View style={[styles.logoPill, { backgroundColor: colors.surface }]}> 
                  <Image source={require('../assets/images/deepspectrum-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                </View>

                <Text style={[styles.helloLarge, { color: colors.surface }]}>Hello</Text>
                <Text style={[styles.tagline, { color: colors.surface }]} numberOfLines={2}>
                  DeepSpectrum Analytics Pvt. Ltd. • AI-enabled multispectral material analysis
                </Text>
              </View>
            </LinearGradient>
          </View>

          {FRONTEND_ONLY && (
            <TouchableOpacity
              onPress={handleSkip}
              style={[styles.demoBanner, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.demoText, { color: colors.primary }]}>Demo mode: continue without account</Text>
            </TouchableOpacity>
          )}

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <GradientButton title="Sign In" onPress={handleLogin} loading={loading} style={styles.loginPrimary} />

            <View style={{ height: 10 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/parameter-selection')}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.orRow}>
              <View style={[styles.orLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.orText, { color: colors.textSecondary }]}>or continue with</Text>
              <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>in</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>GH</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surface }]} onPress={handleBiometricAuth}>
                <Fingerprint size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 12 }} />

            <TouchableOpacity onPress={handleSkip} style={[styles.skipButton, { marginTop: 6 }]}>
              <Text style={[styles.skipText, { color: colors.primary }]}>Continue without account</Text>
            </TouchableOpacity>

            {biometricAvailable && (
              <TouchableOpacity
                onPress={handleBiometricAuth}
                style={styles.biometricButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.primaryGradientStart + '10', colors.primaryGradientEnd + '10']}
                  style={styles.biometricGradient}
                >
                  <Fingerprint size={24} color={colors.primary} />
                  <Text style={[styles.biometricText, { color: colors.primary }]}>Use Biometric Authentication</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              AI-Enabled Multispectral Tricorder
            </Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              for Qualitative Material Analysis
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    marginTop: 8,
  },
  loginPrimary: { marginTop: 8 },
  biometricButton: {
    marginTop: 16,
  },
  biometricGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  demoBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  demoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  logoImage: {
    width: 160,
    height: 56,
    marginBottom: 18,
  },
  headerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerBackground: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.6,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoPill: {
    padding: 8,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  helloLarge: { fontSize: 48, fontWeight: '900', marginTop: 6 },
  tagline: { fontSize: 13, opacity: 0.95, textAlign: 'center', marginTop: 6, maxWidth: 340 },
  hello: { fontSize: 44, fontWeight: '900', letterSpacing: 0.6 },
  companyLine: { fontSize: 16, marginTop: 6 },
  companyLineSmall: { fontSize: 13, marginTop: 4 },
  authActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authBtn: { flex: 1, marginRight: 12 },
  signupBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  signupText: { fontSize: 16, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  orLine: { flex: 1, height: 1, borderRadius: 1 },
  orText: { marginHorizontal: 10 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  socialCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 4 },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
});
