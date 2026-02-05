// lib/hedera.ts
// Hedera account creation utility for React Native

import {
    AccountCreateTransaction,
    Client,
    Hbar,
    PrivateKey,
} from "@hashgraph/sdk";

import Constants from 'expo-constants';

const HEDERA_TESTNET_OPERATOR_ID = Constants.expoConfig?.extra?.hederaOperatorId;
const HEDERA_TESTNET_OPERATOR_KEY = Constants.expoConfig?.extra?.hederaOperatorKey;

export interface HederaAccountResult {
  success: boolean;
  accountId?: string;
  privateKey?: string;
  publicKey?: string;
  error?: string;
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

    // Initialize Hedera testnet client with operator
    const client = Client.forTestnet();
    
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
      .setInitialBalance(Hbar.fromTinybars(0))
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
