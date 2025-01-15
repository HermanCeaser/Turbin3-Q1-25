import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../wba-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000_000n;

// Mint address
const mint = new PublicKey("DJA94NNoawtXP628h33JuFgCvw4TZdzVfZRKNiHPgsQ8");

(async () => {
    try {
        // Create an ATA
        const ata = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
        console.log(`Your ata is: ${ata.address.toBase58()}`); // T7N1tLVgGVHwZLnaECruXZg6ifvyoHfWx7xKHEJuRAf

        // Mint to ATA
        const mintTx = await mintTo(connection, keypair, mint, ata.address, keypair, token_decimals)
        console.log(`Your mint txid: ${mintTx}`); // PiHqthwFR9JDxVo3SWbBTLYwWj6xs5hf3m2ddhnbLAkn27SBtvcxp9xWZkLoRctFT4nsdxCkHTkvuqXkzVYfyEW;
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()
