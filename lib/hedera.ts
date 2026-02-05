// lib/hedera.ts
// Hedera account creation utility for React Native

import {
  AccountCreateTransaction,
  AccountId,
  Client,
  Hbar,
  HbarUnit,
  PrivateKey,
  TokenAssociateTransaction,
  TokenId,
} from "@hashgraph/sdk";

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const HEDERA_TESTNET_OPERATOR_ID = Constants.expoConfig?.extra?.hederaOperatorId;
const HEDERA_TESTNET_OPERATOR_KEY = Constants.expoConfig?.extra?.hederaOperatorKey;

// Network configuration
const HEDERA_NETWORK = Constants.expoConfig?.extra?.hederaNetwork || 'testnet';
const USDC_TOKEN_ID = HEDERA_NETWORK === 'mainnet' 
  ? '0.0.456858'  // Circle mainnet USDC
  : '0.0.429274'; // Testnet USDC

const HEDERA_ACCOUNT_ID_KEY = 'hedera_account_id';
const HEDERA_PRIVATE_KEY_KEY = 'hedera_private_key';

export interface HederaAccountResult {
  success: boolean;
  accountId?: string;
  privateKey?: string;
  publicKey?: string;
  error?: string;
}

export interface UsdcAssociationResult {
  success: boolean;
  alreadyAssociated?: boolean;
  error?: string;
}

export interface UsdcAssociationStatus {
  isAssociated: boolean;
  isChecking: boolean;
  error?: string;
}

export interface AccountBalances {
  hbar: number; // In HBAR (not tinybars)
  usdc: number; // In USDC
  lastUpdated: Date;
}

/**
 * Creates a new Hedera testnet account
 * This runs on the client device, avoiding Supabase Edge Function size limits
 */
export async function createHederaAccount(): Promise<HederaAccountResult> {
  try {
    if (!HEDERA_TESTNET_OPERATOR_ID || !HEDERA_TESTNET_OPERATOR_KEY) {
      throw new Error("Hedera operator credentials not configured");
    }

    // Initialize Hedera client based on network config
    const client = HEDERA_NETWORK === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();
    
    // Handle both hex (0x...) and raw key formats
    let operatorKeyString = HEDERA_TESTNET_OPERATOR_KEY;
    if (operatorKeyString.startsWith('0x')) {
      operatorKeyString = operatorKeyString.slice(2);
    }
    
    const operatorKey = PrivateKey.fromStringECDSA(operatorKeyString);
    client.setOperator(HEDERA_TESTNET_OPERATOR_ID, operatorKey);

    // Generate a new ED25519 key pair for the user
    const newPrivateKey = PrivateKey.generateED25519();

    // Create the new account (minimal balance = 0 for now)
    const transaction = await new AccountCreateTransaction()
      .setKey(newPrivateKey.publicKey)
      .setInitialBalance(Hbar.from(0.5, HbarUnit.Hbar)) // Give 0.5 HBAR
      .execute(client);

    // Get the receipt to extract the new account ID
    const receipt = await transaction.getReceipt(client);
    const newAccountId = receipt.accountId!.toString();

    // Clean up client
    client.close();

    // Use Raw format instead of DER - much smaller, fits in SecureStore
    return {
      success: true,
      accountId: newAccountId,
      privateKey: newPrivateKey.toStringRaw(),  // Raw format ~64 chars vs DER ~200+ chars
      publicKey: newPrivateKey.publicKey.toStringRaw(),
    };
  } catch (error: any) {
    console.error("Hedera account creation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create Hedera account",
    };
  }
}

/**
 * Checks if the user's account is associated with USDC token
 * Uses public Mirror Node API (free, no auth needed)
 */
export async function isUsdcAssociated(accountId?: string): Promise<boolean> {
  try {
    const accountIdStr = accountId || await SecureStore.getItemAsync(HEDERA_ACCOUNT_ID_KEY);
    if (!accountIdStr) throw new Error("No Hedera account found");

    // Mirror Node URL based on network
    const mirrorBaseUrl = HEDERA_NETWORK === 'mainnet'
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
    
    const mirrorUrl = `${mirrorBaseUrl}/api/v1/accounts/${accountIdStr}/tokens?token.id=${USDC_TOKEN_ID}`;

    const response = await fetch(mirrorUrl);
    if (!response.ok) {
      console.warn("Mirror Node query failed:", response.status);
      return false;
    }

    const data = await response.json();
    // If tokens array has entries for this token ID, it's associated
    return data.tokens && data.tokens.length > 0;
  } catch (error) {
    console.error("USDC association check error:", error);
    return false; // Assume not associated on error
  }
}

/**
 * Associates the USDC token with the user's Hedera account if not already done
 * Runs automatically after creation or on demand
 */
export async function autoAssociateUsdc(
  accountId?: string,
  privateKey?: string
): Promise<UsdcAssociationResult> {
  try {
    // Get credentials from params or SecureStore
    const privateKeyStr = privateKey || await SecureStore.getItemAsync(HEDERA_PRIVATE_KEY_KEY);
    const accountIdStr = accountId || await SecureStore.getItemAsync(HEDERA_ACCOUNT_ID_KEY);

    if (!privateKeyStr || !accountIdStr) {
      throw new Error("No Hedera wallet found. Create one first.");
    }

    // First check if already associated
    const isAssociated = await isUsdcAssociated(accountIdStr);
    if (isAssociated) {
      console.log("USDC already associated");
      return { success: true, alreadyAssociated: true };
    }

    // Restore keys
    const userPrivateKey = PrivateKey.fromStringED25519(privateKeyStr);
    const userAccountId = AccountId.fromString(accountIdStr);

    // Initialize client with user's credentials
    const client = HEDERA_NETWORK === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();
    
    client.setOperator(userAccountId, userPrivateKey);

    // Build and execute association
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(userAccountId)
      .setTokenIds([TokenId.fromString(USDC_TOKEN_ID)])
      .freezeWith(client);

    // Sign with user's key
    const signedTx = await associateTx.sign(userPrivateKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    client.close();

    if (receipt.status.toString() !== "SUCCESS") {
      throw new Error(`Association failed: ${receipt.status}`);
    }

    console.log("USDC token associated successfully");
    return { success: true, alreadyAssociated: false };
  } catch (error: any) {
    console.error("Auto USDC association error:", error);
    
    // Check for specific error types
    let userFriendlyError = error.message;
    
    if (error.message?.includes("INSUFFICIENT")) {
      userFriendlyError = "Insufficient HBAR balance. Please fund your account with test HBAR from the Hedera faucet.";
    } else if (error.message?.includes("INVALID_ACCOUNT")) {
      userFriendlyError = "Invalid Hedera account. Please recreate your wallet.";
    }
    
    return {
      success: false,
      error: userFriendlyError,
    };
  }
}

/**
 * Get the appropriate faucet URL based on network
 */
export function getFaucetUrl(): string {
  return HEDERA_NETWORK === 'mainnet'
    ? 'https://hedera.com' // Mainnet requires purchasing HBAR
    : 'https://portal.hedera.com/faucet'; // Testnet faucet
}

/**
 * Generate a key pair without creating an account on-chain
 * Useful for generating keys first, then funding via faucet
 */
export function generateHederaKeyPair() {
  const privateKey = PrivateKey.generateED25519();
  return {
    privateKey: privateKey.toStringRaw(),
    publicKey: privateKey.publicKey.toStringRaw(),
  };
}

/**
 * Restore a private key from raw string format
 */
export function restorePrivateKey(rawKey: string): PrivateKey {
  return PrivateKey.fromStringED25519(rawKey);
}

/**
 * Check USDC association status and update database
 */
export async function checkUsdcAssociationStatus(
  accountId: string,
  userId: string,
  supabaseClient: any
): Promise<UsdcAssociationStatus> {
  try {
    const isAssociated = await isUsdcAssociated(accountId);
    
    // Update database status
    if (isAssociated) {
      await supabaseClient
        .from('profiles')
        .update({ usdc_associated: true })
        .eq('id', userId);
    }
    
    return {
      isAssociated,
      isChecking: false,
    };
  } catch (error: any) {
    console.error('Error checking USDC status:', error);
    return {
      isAssociated: false,
      isChecking: false,
      error: error.message,
    };
  }
}

/**
 * Ensure USDC is associated, attempting association if needed
 */
export async function ensureUsdcAssociated(
  accountId: string,
  privateKey: string,
  userId: string,
  supabaseClient: any
): Promise<UsdcAssociationResult & { needsFunding?: boolean }> {
  try {
    // First check if already associated
    const isAssociated = await isUsdcAssociated(accountId);
    
    if (isAssociated) {
      // Update DB status
      await supabaseClient
        .from('profiles')
        .update({ usdc_associated: true })
        .eq('id', userId);
      
      return { success: true, alreadyAssociated: true };
    }
    
    // Attempt association
    const result = await autoAssociateUsdc(accountId, privateKey);
    
    // Update DB status on success
    if (result.success) {
      await supabaseClient
        .from('profiles')
        .update({ usdc_associated: true })
        .eq('id', userId);
    }
    
    // Check if error is due to insufficient funds
    const needsFunding = result.error?.includes('INSUFFICIENT');
    
    return {
      ...result,
      needsFunding,
    };
  } catch (error: any) {
    console.error('Error ensuring USDC association:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetch account balances from Hedera Mirror Node API
 * Uses free public API - no authentication required
 */
export async function fetchAccountBalances(accountId: string): Promise<AccountBalances> {
  try {
    // Mirror Node URL based on network
    const mirrorBaseUrl = HEDERA_NETWORK === 'mainnet'
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
    
    const accountUrl = `${mirrorBaseUrl}/api/v1/accounts/${accountId}`;
    
    const response = await fetch(accountUrl);
    if (!response.ok) {
      throw new Error(`Mirror Node query failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // HBAR balance is in tinybars (1 HBAR = 100,000,000 tinybars)
    const hbarBalance = data.balance?.balance 
      ? parseFloat(data.balance.balance) / 100_000_000 
      : 0;
    
    // Find USDC token balance
    let usdcBalance = 0;
    if (data.balance?.tokens) {
      const usdcToken = data.balance.tokens.find(
        (token: any) => token.token_id === USDC_TOKEN_ID
      );
      if (usdcToken) {
        // USDC has 6 decimals
        usdcBalance = parseFloat(usdcToken.balance) / 1_000_000;
      }
    }
    
    return {
      hbar: hbarBalance,
      usdc: usdcBalance,
      lastUpdated: new Date(),
    };
  } catch (error: any) {
    console.error('Error fetching account balances:', error);
    return {
      hbar: 0,
      usdc: 0,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Get account info including balances and token associations
 */
export async function getAccountInfo(accountId: string) {
  try {
    const mirrorBaseUrl = HEDERA_NETWORK === 'mainnet'
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
    
    const accountUrl = `${mirrorBaseUrl}/api/v1/accounts/${accountId}`;
    
    const response = await fetch(accountUrl);
    if (!response.ok) {
      throw new Error(`Mirror Node query failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching account info:', error);
    return null;
  }
}
