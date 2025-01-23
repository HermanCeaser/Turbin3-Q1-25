import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Vault as Program<Vault>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const wallet = provider.wallet;

  let vaultState: PublicKey;
  let vault: PublicKey;
  let vaultBump: number;
  let stateBump: number;

  it("Is initialized!", async () => {
    // Add your test here.
    [vaultState, stateBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("state"), wallet.publicKey.toBuffer()],
      program.programId
    );
    [vault, vaultBump] = await PublicKey.findProgramAddressSync(
      [vaultState.toBuffer()],
      program.programId
    );
    const tx = await program.methods
      .initialize()
      .accounts({
        signer: wallet.publicKey,
      }).rpc();
    console.log("Initialized vault. Transaction signature:", tx);

    const vaultStateAccount = await program.account.vaultState.fetch(vaultState);
    
    expect(vaultStateAccount.vaultBump).to.equal(vaultBump);
    expect(vaultStateAccount.stateBump).to.equal(stateBump);
  });
});
