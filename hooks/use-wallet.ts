// hooks/use-wallet.ts
// Hook for managing Hedera wallet state and operations

import { useAuth } from '@/contexts/auth-context';
import { createHederaAccount, HederaAccountResult } from '@/lib/hedera';
import { supabase } from '@/lib/supabase';
import { Transaction, WalletInfo } from '@/types';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

const PRIVATE_KEY_STORAGE_KEY = 'hedera_private_key';

export type UseWalletReturn = {
  wallet: WalletInfo | null;
  transactions: Transaction[];
  isLoading: boolean;
  isCreatingWallet: boolean;
  error: string | null;
  hasWallet: boolean;
  createWallet: () => Promise<HederaAccountResult>;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  getPrivateKey: () => Promise<string | null>;
};

export function useWallet(): UseWalletReturn {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a wallet
  const hasWallet = wallet?.has_wallet ?? false;

  // Fetch wallet info from profile
  const fetchWallet = useCallback(async () => {
    if (!user?.id) {
      setWallet(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Get wallet info from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('hedera_account_id, hedera_public_key, wallet_created_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get balance from user_balances view
      const { data: balanceData } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      setWallet({
        hedera_account_id: profileData?.hedera_account_id || null,
        hedera_public_key: profileData?.hedera_public_key || null,
        wallet_created_at: profileData?.wallet_created_at || null,
        balance: balanceData?.balance || 0,
        has_wallet: !!profileData?.hedera_account_id,
      });
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      // Don't set error for missing balance view (new users)
      if (!err.message?.includes('user_balances')) {
        setError(err.message);
      }
      
      // Still set wallet from profile even if balance fetch fails
      if (profile?.hedera_account_id) {
        setWallet({
          hedera_account_id: profile.hedera_account_id,
          hedera_public_key: profile.hedera_public_key || null,
          wallet_created_at: profile.wallet_created_at || null,
          balance: 0,
          has_wallet: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profile]);

  // Fetch recent transactions
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txError) throw txError;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      // Don't fail if transactions table doesn't exist yet
    }
  }, [user?.id]);

  // Create a new Hedera wallet
  const createWallet = useCallback(async (): Promise<HederaAccountResult> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    if (hasWallet) {
      return { success: false, error: 'Wallet already exists' };
    }

    setIsCreatingWallet(true);
    setError(null);

    try {
      // Create Hedera account client-side
      const result = await createHederaAccount();

      if (!result.success || !result.accountId || !result.publicKey) {
        throw new Error(result.error || 'Failed to create Hedera account');
      }

      // Store private key securely on device
      if (result.privateKey) {
        await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE_KEY, result.privateKey);
      }

      // Save account info to Supabase profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          hedera_account_id: result.accountId,
          hedera_public_key: result.publicKey,
          wallet_created_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh wallet state
      await fetchWallet();

      return result;
    } catch (err: any) {
      console.error('Error creating wallet:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsCreatingWallet(false);
    }
  }, [user?.id, hasWallet, fetchWallet]);

  // Get private key from secure storage
  const getPrivateKey = useCallback(async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE_KEY);
    } catch (err) {
      console.error('Error getting private key:', err);
      return null;
    }
  }, []);

  // Refresh functions
  const refreshWallet = useCallback(async () => {
    setIsLoading(true);
    await fetchWallet();
  }, [fetchWallet]);

  const refreshTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  // Initial fetch
  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  return {
    wallet,
    transactions,
    isLoading,
    isCreatingWallet,
    error,
    hasWallet,
    createWallet,
    refreshWallet,
    refreshTransactions,
    getPrivateKey,
  };
}

// KES conversion rate (mock - should come from API in production)
const USDC_TO_KES_RATE = 149.50;

export function formatUSDCToKES(usdcAmount: number): string {
  const kesAmount = usdcAmount * USDC_TO_KES_RATE;
  return kesAmount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatHederaAccountId(accountId: string | null): string {
  if (!accountId) return 'No wallet';
  return accountId;
}

export function formatTransactionTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
