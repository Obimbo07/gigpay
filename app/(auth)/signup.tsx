import { PhoneInputWrapper } from '@/components/phone-input-wrapper';
import { useAuth } from '@/contexts/auth-context';
import { AuthMethod } from '@/types';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const phoneInputRef = React.useRef<any>(null);

  const handleSignUp = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (method === 'email' && !email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (method === 'phone' && !phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Get country code from phone input
    const dialCode = phoneInputRef.current?.getCallingCode();
    const finalCountryCode = dialCode ? `+${dialCode}` : countryCode;

    const { error } = await signUp({
      method,
      email: method === 'email' ? email : undefined,
      phone: method === 'phone' ? phone : undefined,
      password,
      fullName: fullName.trim(),
      countryCode: method === 'phone' ? finalCountryCode : undefined,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      if (method === 'email') {
        Alert.alert(
          'Check Your Email',
          'We sent you a verification link. Please check your inbox and click the link to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        // Phone signup auto-confirms, go to tabs
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Method Toggle */}
          <View style={styles.methodToggle}>
            <TouchableOpacity
              style={[styles.methodButton, method === 'email' && styles.methodButtonActive]}
              onPress={() => setMethod('email')}
            >
              <Text style={[styles.methodText, method === 'email' && styles.methodTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, method === 'phone' && styles.methodButtonActive]}
              onPress={() => setMethod('phone')}
            >
              <Text style={[styles.methodText, method === 'phone' && styles.methodTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
          />

          {/* Email or Phone Input */}
          {method === 'email' ? (
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          ) : (
            <View style={styles.phoneInputContainer}>
              <PhoneInputWrapper
                ref={phoneInputRef}
                value={phone}
                defaultCode="KE"
                onChangeText={setPhone}
                onChangeFormattedText={(text) => {
                  setFormattedPhone(text);
                  const code = phoneInputRef.current?.getCallingCode();
                  if (code) {
                    setCountryCode(`+${code}`);
                  }
                }}
                containerStyle={styles.phoneContainer}
                textContainerStyle={styles.phoneTextContainer}
                textInputStyle={styles.phoneInput}
                codeTextStyle={styles.phoneCode}
              />
            </View>
          )}

          {/* Password Fields */}
          <TextInput
            style={styles.input}
            placeholder="Password (min. 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
          />

          {/* Info Text */}
          {method === 'email' && (
            <Text style={styles.infoText}>
              You'll receive a verification email after signing up.
            </Text>
          )}
          {method === 'phone' && (
            <Text style={styles.infoText}>
              Phone accounts are automatically verified. You can log in immediately.
            </Text>
          )}

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  methodButtonActive: {
    backgroundColor: '#007AFF',
  },
  methodText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  phoneInputContainer: {
    marginBottom: 16,
  },
  phoneContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  phoneTextContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  phoneInput: {
    fontSize: 16,
  },
  phoneCode: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
