import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import { Program, Wallet, AnchorProvider, Address } from "@coral-xyz/anchor";
import { WbaVault, IDL } from "./programs/wba_vault";
import wallet from "../wba-wallet.json";
/// J8qKEmQpadFeBuXAVseH8GNrvsyBhMT8MHSVD3enRgJz

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Commitment
const commitment: Commitment = "confirmed";

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Create our program
const program = new Program<WbaVault>(
  IDL,
  "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address,
  provider,
);

// Create a random keypair
const vaultState = Keypair.generate();
console.log(`Vault public key: ${vaultState.publicKey.toBase58()}`); //3mMAKP936LTcb2Li2gMzxW1VjDFkqNMEK3Cq52D7smUZ

// Create the PDA for our enrollment account
// Seeds are "auth", vaultState
const vaultAuth = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.publicKey.toBuffer()],
  program.programId
);

// Create the vault key
// Seeds are "vault", vaultAuth
const vault = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), vaultAuth[0].toBuffer()],
  program.programId
);

// Execute our enrollment transaction
(async () => {
  try {
    const signature = await program.methods.initialize()
    .accounts({
      vaultState: vaultState.publicKey,
      vault: vault[0],
      vaultAuth: vaultAuth[0],
      systemProgram: SystemProgram.programId,
      owner: keypair.publicKey
    }).signers([keypair, vaultState]).rpc();
    console.log(`Init success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
