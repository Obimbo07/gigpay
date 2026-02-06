// supabase/functions/associate-usdc-token/index.ts
// Server-side USDC token association using full SDK
// This runs on the server where SDK size doesn't matter

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
    AccountId,
    Client,
    PrivateKey,
    TokenAssociateTransaction,
    TokenId
} from "npm:@hashgraph/sdk@^2.80.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // Get the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.split(" ")[1];

    // Create Supabase client with user's JWT to get their user ID
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { accountId, privateKey, tokenId, network = 'testnet' } = body;

    if (!accountId || !privateKey || !tokenId) {
      return new Response(
        JSON.stringify({ error: "Missing accountId, privateKey, or tokenId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set up Hedera client
    const client = network === 'mainnet' 
      ? Client.forMainnet()
      : Client.forTestnet();
    
    // Note: We don't need an operator for this transaction
    // The user signs with their own private key

    // Parse account ID, token ID, and private key
    const accountIdObj = AccountId.fromString(accountId);
    const tokenIdObj = TokenId.fromString(tokenId);
    const privateKeyObj = PrivateKey.fromStringED25519(privateKey);

    // Create and execute token association transaction
    const associateTx = new TokenAssociateTransaction()
      .setAccountId(accountIdObj)
      .setTokenIds([tokenIdObj])
      .freezeWith(client);

    // Sign with the account's private key
    const signedTx = await associateTx.sign(privateKeyObj);

    // Execute transaction
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status.toString() !== "SUCCESS") {
      throw new Error(`Token association failed: ${receipt.status.toString()}`);
    }

    // Close the Hedera client
    client.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Token associated successfully",
        transactionId: txResponse.transactionId.toString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    
    // Handle specific error cases
    let errorMessage = "Failed to associate token";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      }
    );
  }
});
