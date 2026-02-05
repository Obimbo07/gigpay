// components/usdc-status-banner.tsx
// Elegant status banner for USDC token association

import { useAuth } from '@/contexts/auth-context';
import {
    checkUsdcAssociationStatus,
    ensureUsdcAssociated,
    getFaucetUrl,
} from '@/lib/hedera';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type BannerState =
  | 'hidden'
  | 'checking'
  | 'ready'
  | 'associating'
  | 'pending-funds'
  | 'error';

export function UsdcStatusBanner() {
  const { user, profile } = useAuth();
  const [state, setState] = useState<BannerState>('hidden');
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [user, profile]);

  const checkStatus = async () => {
    if (!user?.id || !profile?.hedera_account_id) {
      setState('hidden');
      return;
    }

    // Check if user dismissed the prompt
    const { data: profileData } = await supabase
      .from('profiles')
      .select('usdc_associated, usdc_prompt_dismissed')
      .eq('id', user.id)
      .single();

    if (profileData?.usdc_associated) {
      setState('ready');
      return;
    }

    if (profileData?.usdc_prompt_dismissed) {
      setIsDismissed(true);
      setState('hidden');
      return;
    }

    // Check actual association status
    setState('checking');
    const status = await checkUsdcAssociationStatus(
      profile.hedera_account_id,
      user.id,
      supabase
    );

    if (status.isAssociated) {
      setState('ready');
    } else if (status.error) {
      setError(status.error);
      setState('error');
    } else {
      // Not associated, try automatic association
      await attemptAutoAssociation();
    }
  };

  const attemptAutoAssociation = async () => {
    if (!user?.id || !profile?.hedera_account_id) return;

    setState('associating');
    setError(null);

    try {
      const privateKey = await SecureStore.getItemAsync('hedera_private_key');
      if (!privateKey) {
        setError('Private key not found');
        setState('error');
        return;
      }

      const result = await ensureUsdcAssociated(
        profile.hedera_account_id,
        privateKey,
        user.id,
        supabase
      );

      if (result.success) {
        setState('ready');
      } else if (result.needsFunding) {
        setState('pending-funds');
      } else {
        setError(result.error || 'Association failed');
        setState('error');
      }
    } catch (err: any) {
      console.error('Auto association error:', err);
      setError(err.message);
      setState('error');
    }
  };

  const handleRetry = async () => {
    await attemptAutoAssociation();
  };

  const handleGetFunding = async () => {
    const faucetUrl = getFaucetUrl();
    
    Alert.alert(
      'Get Test HBAR',
      `You need test HBAR to enable USDC. After funding, retry association.\n\nYour account: ${profile?.hedera_account_id}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Faucet',
          onPress: () => Linking.openURL(faucetUrl),
        },
      ]
    );
  };

  const handleDismiss = async () => {
    if (!user?.id) return;

    await supabase
      .from('profiles')
      .update({ usdc_prompt_dismissed: true })
      .eq('id', user.id);

    setIsDismissed(true);
    setState('hidden');
  };

  const handleUndismiss = async () => {
    if (!user?.id) return;

    await supabase
      .from('profiles')
      .update({ usdc_prompt_dismissed: false })
      .eq('id', user.id);

    setIsDismissed(false);
    await checkStatus();
  };

  if (state === 'hidden' && !isDismissed) return null;

  // Show small restore button if dismissed
  if (isDismissed) {
    return (
      <TouchableOpacity
        style={styles.restoreBanner}
        onPress={handleUndismiss}
      >
        <Ionicons name="information-circle-outline" size={16} color="#666" />
        <Text style={styles.restoreText}>Enable USDC</Text>
      </TouchableOpacity>
    );
  }

  if (state === 'ready') {
    return (
      <View style={[styles.banner, styles.successBanner]}>
        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
        <Text style={styles.successText}>USDC Ready</Text>
      </View>
    );
  }

  if (state === 'checking') {
    return (
      <View style={[styles.banner, styles.loadingBanner]}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.loadingText}>Checking USDC status...</Text>
      </View>
    );
  }

  if (state === 'associating') {
    return (
      <View style={[styles.banner, styles.loadingBanner]}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.loadingText}>Enabling USDC...</Text>
      </View>
    );
  }

  if (state === 'pending-funds') {
    return (
      <View style={[styles.banner, styles.warningBanner]}>
        <Ionicons name="wallet-outline" size={20} color="#f59e0b" />
        <View style={styles.content}>
          <Text style={styles.warningTitle}>USDC Requires Funding</Text>
          <Text style={styles.warningText}>
            Get test HBAR from faucet, then retry
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleGetFunding}
            >
              <Text style={styles.primaryButtonText}>Get HBAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRetry}
            >
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDismiss}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={[styles.banner, styles.errorBanner]}>
        <Ionicons name="alert-circle" size={20} color="#ef4444" />
        <View style={styles.content}>
          <Text style={styles.errorTitle}>USDC Setup Failed</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRetry}
            >
              <Text style={styles.primaryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDismiss}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    gap: 12,
  },
  successBanner: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  loadingBanner: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  loadingText: {
    fontSize: 14,
    color: '#1e40af',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#7f1d1d',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  restoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  restoreText: {
    fontSize: 12,
    color: '#666',
  },
});
