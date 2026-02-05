// supabase/functions/fund-new-account/index.ts

import {
    AccountId,
    Client,
    Hbar,
    PrivateKey,
    TransferTransaction,
} from "npm:@hashgraph/sdk@2.47.0";

console.info("fund-new-account function initialized");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const operatorId = Deno.env.get("HEDERA_TESTNET_OPERATOR_ID");
    const operatorKeyStr = Deno.env.get("HEDERA_TESTNET_OPERATOR_KEY");

    if (!operatorId || !operatorKeyStr) {
      console.error("Missing Hedera env vars");
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfiguration" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Auth check (Supabase JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return new Response(JSON.stringify({ error: "Missing accountId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const recipientId = AccountId.fromString(accountId);

    // Setup client
    const client = Client.forTestnet(); // Use .forMainnet() in prod
    const operatorKey = PrivateKey.fromStringED25519(operatorKeyStr);
    client.setOperator(operatorId, operatorKey);

    // Build transfer: send 0.5 HBAR
    const transferTx = await new TransferTransaction()
      .addHbarTransfer(recipientId, new Hbar(0.5))
      .execute(client);

    // Get receipt
    const receipt = await transferTx.getReceipt(client);
    client.close();

    if (receipt.status.toString() !== "SUCCESS") {
      throw new Error(`Funding failed: ${receipt.status}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Funded ${accountId} with 0.5 HBAR`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error(err);
    const message =
      err && typeof err === "object" && "message" in err
        ? (err as any).message
        : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});