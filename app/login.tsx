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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
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
    // require both fields to be exactly '1234' for this demo
    if (email !== '1234' || password !== '1234') {
      Alert.alert('Invalid credentials', 'Enter email and password as 1234 to sign in (demo)');
      return;
    }

    setLoading(true);
    try {
      // only allow demo login when credentials are correct
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
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
          <View style={styles.header}>
            {/* Logo removed as requested */}

            <Text style={[styles.title, { color: colors.text }]}>DeepSpectrum Analytics</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Private Limited</Text>
          </View>

          <View style={styles.form}>
            {/* underline style inputs - modern, slim */}
            <View style={[styles.underlineField, { borderBottomColor: colors.border }]}>
              <Mail size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.inputUnderline, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={[styles.underlineField, { borderBottomColor: colors.border }]}>
              <Lock size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.inputUnderline, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <GradientButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            {/* biometric always visible for clarity; shows state */}
            <TouchableOpacity onPress={handleBiometricAuth} style={styles.biometricRow} activeOpacity={0.8}>
              <Fingerprint size={20} color={biometricAvailable ? colors.primary : colors.textSecondary} />
              <Text style={[styles.biometricLabel, { color: biometricAvailable ? colors.primary : colors.textSecondary }]}> {biometricAvailable ? 'Use Biometric Authentication' : 'Biometric not set up'}</Text>
            </TouchableOpacity>

            {/* social sign-in options */}
            <View style={styles.socialSection}>
              <Text style={[styles.orText, { color: colors.textSecondary }]}>Or continue with</Text>
              <View style={styles.socialRow}>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#fff' }]} onPress={() => Alert.alert('Google sign in', 'Not wired yet')}>
                  <Text style={styles.socialText}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#0A66C2' }]} onPress={() => Alert.alert('LinkedIn sign in', 'Not wired yet')}>
                  <Text style={[styles.socialText, { color: '#fff' }]}>in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#111' }]} onPress={() => Alert.alert('GitHub sign in', 'Not wired yet')}>
                  <Text style={[styles.socialText, { color: '#fff' }]}>GH</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>AI-Enabled Multispectral Tricorder</Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>for Qualitative Material Analysis</Text>
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
    width: 100,
    height: 100,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImage: {
    width: 80,
    height: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
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
  underlineField: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  inputUnderline: {
    marginLeft: 12,
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
  },
  biometricRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  biometricLabel: { marginLeft: 10, fontSize: 15, fontWeight: '600' },
  socialSection: { marginTop: 18, alignItems: 'center' },
  orText: { marginBottom: 8 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', width: '80%' },
  socialBtn: { width: 60, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  socialText: { fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 18 },
  footerText: { fontSize: 13, textAlign: 'center', color: '#888' },
});

