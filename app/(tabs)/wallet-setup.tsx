// app/(tabs)/wallet-setup.tsx
// Screen for creating/setting up Hedera wallet

import { useWallet } from '@/hooks/use-wallet';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function WalletSetupScreen() {
  const { createWallet, isCreatingWallet, hasWallet, wallet } = useWallet();
  const [step, setStep] = useState<'intro' | 'creating' | 'success' | 'error'>('intro');
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    setStep('creating');
    
    const result = await createWallet();
    
    if (result.success && result.accountId) {
      setCreatedAccountId(result.accountId);
      setStep('success');
    } else {
      setErrorMessage(result.error || 'Failed to create wallet');
      setStep('error');
    }
  };

  const handleGoToDashboard = () => {
    router.replace('/(tabs)/dashboard');
  };

  const handleRetry = () => {
    setStep('intro');
    setErrorMessage(null);
  };

  // If already has wallet, redirect to dashboard
  if (hasWallet && step === 'intro') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={80} color="#00D9FF" />
          </View>
          <Text style={styles.title}>Wallet Already Set Up</Text>
          <Text style={styles.subtitle}>
            Your Hedera wallet is connected
          </Text>
          <Text style={styles.accountId}>{wallet?.hedera_account_id}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoToDashboard}>
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Introduction step
  if (step === 'intro') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet-outline" size={80} color="#00D9FF" />
          </View>
          
          <Text style={styles.title}>Create Your Wallet</Text>
          <Text style={styles.subtitle}>
            Set up your Hedera wallet to start receiving payments and earning yield.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash" size={24} color="#00D9FF" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Instant Transactions</Text>
                <Text style={styles.featureDesc}>Receive payments in seconds</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#00D9FF" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Secure & Private</Text>
                <Text style={styles.featureDesc}>Keys stored safely on your device</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="trending-up" size={24} color="#00D9FF" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Earn Yield</Text>
                <Text style={styles.featureDesc}>Auto-stake USDC for passive income</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="phone-portrait" size={24} color="#00D9FF" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>M-Pesa Withdrawals</Text>
                <Text style={styles.featureDesc}>Cash out directly to M-Pesa</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleCreateWallet}
          >
            <Ionicons name="add-circle" size={24} color="#0A1F2B" />
            <Text style={styles.primaryButtonText}>Create Wallet</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By creating a wallet, you agree to our Terms of Service and Privacy Policy.
            Your private key will be stored securely on this device.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Creating step
  if (step === 'creating') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#00D9FF" />
          <Text style={styles.title}>Creating Your Wallet</Text>
          <Text style={styles.subtitle}>
            Please wait while we set up your Hedera account...
          </Text>
          
          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <ActivityIndicator size="small" color="#00D9FF" />
              <Text style={styles.stepText}>Generating secure key pair</Text>
            </View>
            <View style={[styles.stepItem, styles.stepPending]}>
              <Ionicons name="ellipse-outline" size={16} color="#8B9BA8" />
              <Text style={[styles.stepText, styles.stepTextPending]}>
                Creating Hedera account
              </Text>
            </View>
            <View style={[styles.stepItem, styles.stepPending]}>
              <Ionicons name="ellipse-outline" size={16} color="#8B9BA8" />
              <Text style={[styles.stepText, styles.stepTextPending]}>
                Saving to secure storage
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, styles.successIcon]}>
            <Ionicons name="checkmark-circle" size={80} color="#00FF88" />
          </View>
          
          <Text style={styles.title}>Wallet Created!</Text>
          <Text style={styles.subtitle}>
            Your Hedera wallet is ready to use
          </Text>

          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>Your Account ID</Text>
            <Text style={styles.accountId}>{createdAccountId}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color="#00D9FF" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={20} color="#FFD700" />
            <Text style={styles.securityText}>
              Your private key is stored securely on this device. 
              Never share it with anyone.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleGoToDashboard}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Error step
  if (step === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, styles.errorIcon]}>
            <Ionicons name="alert-circle" size={80} color="#FF4444" />
          </View>
          
          <Text style={styles.title}>Something Went Wrong</Text>
          <Text style={styles.subtitle}>{errorMessage}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={24} color="#0A1F2B" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F2B',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A3544',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  errorIcon: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B9BA8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A3544',
    borderRadius: 12,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#8B9BA8',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D9FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F2B',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#00D9FF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#8B9BA8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  stepList: {
    width: '100%',
    marginTop: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  stepPending: {
    opacity: 0.5,
  },
  stepText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  stepTextPending: {
    color: '#8B9BA8',
  },
  accountCard: {
    backgroundColor: '#1A3544',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  accountLabel: {
    fontSize: 14,
    color: '#8B9BA8',
    marginBottom: 8,
  },
  accountId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D9FF',
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  copyText: {
    fontSize: 14,
    color: '#00D9FF',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#FFD700',
    lineHeight: 20,
  },
});
