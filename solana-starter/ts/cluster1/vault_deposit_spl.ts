import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
  BN,
} from "@coral-xyz/anchor";
import { WbaVault, IDL } from "./programs/wba_vault";
import wallet from "../wba-wallet.json";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Commitment
const commitment: Commitment = "finalized";

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Create our program
const program = new Program<WbaVault>(IDL, "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address, provider);

// Create a random keypair
const vaultState = new PublicKey("3mMAKP936LTcb2Li2gMzxW1VjDFkqNMEK3Cq52D7smUZ");

// Create the PDA for our enrollment account
const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.toBuffer()],
  program.programId
);


// Create the vault key
const [vault] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), vaultAuth.toBuffer()],
  program.programId
);

const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("DJA94NNoawtXP628h33JuFgCvw4TZdzVfZRKNiHPgsQ8");

// Execute our enrollment transaction
(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const ownerAta = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey

    );
    // console.log("Owner ATA: ", ownerAta);
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const vaultAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair, // Payer
      mint, // Token mint
      vaultAuth, // Owner (the PDA)
      true, // Allow owner off curve (PDAs are off curve)
      "finalized",
    );
    // console.log("Vault ATA: ", vaultAta);

    const amount = new BN(10 * Number(token_decimals));

    const signature = await program.methods
      .depositSpl(amount)
      .accounts({
        owner: keypair.publicKey, // User's public key
        ownerAta: ownerAta.address, // User's ATA
        vaultState: vaultState, // Vault state account
        vaultAuth: vaultAuth, // Vault authority PDA
        vaultAta: vaultAta.address, // Vault's ATA
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID, // SPL Token Program ID
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    console.log(`Deposit success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
