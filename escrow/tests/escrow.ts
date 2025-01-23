import { randomBytes } from "node:crypto";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey, SendTransactionError } from "@solana/web3.js";
import { confirmTransaction, createAccountsMintsAndTokenAccounts, makeKeypairs } from "@solana-developers/helpers";
import { assert } from "chai";


const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

describe("escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as anchor.Wallet).payer
  const connection = provider.connection
  const program = anchor.workspace.Escrow as Program<Escrow>;

  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM,
  };

  let ceaser: anchor.web3.Keypair;
  let bob: anchor.web3.Keypair;
  let mintA: anchor.web3.Keypair;
  let mintB: anchor.web3.Keypair;

  [ceaser, bob, mintA, mintB] = makeKeypairs(4);

  const mintAOfferedAmount = new anchor.BN(1_000_000);

  before("Creates Ceaser and Bob Accounts, 2 token mints and associated token accounts for both tokens for both users",
    async () => {
      const { users, mints, tokenAccounts } = await createAccountsMintsAndTokenAccounts(
        [
          // Ceaser's token balances, 1,000,000,000 of mintA & 0 of mintB
          [1_000_000_000, 0],
          // bobs's token balances, 0 of mintA & 1,000,000,000 of mintB
          [0, 1_000_000_000],
        ],
        1 * LAMPORTS_PER_SOL,
        connection,
        payer
      );

      ceaser = users[0];
      bob = users[1]

      mintA = mints[0];
      mintB = mints[1];

      const ceaserMintA = tokenAccounts[0][0];
      const ceaserMintB = tokenAccounts[0][1];

      const bobMintA = tokenAccounts[1][0];
      const bobMintB = tokenAccounts[1][1];

      // save the accounts for later use
      accounts.maker = ceaser.publicKey;
      accounts.taker = bob.publicKey;
      accounts.mintA = mintA.publicKey;
      accounts.makerAccountMintA = ceaserMintA; // PDA for maker's token mint A
      accounts.takerAccountMintA = bobMintA; // PDA for taker's token mint A
      accounts.mintB = mintB.publicKey;
      accounts.makerAccountMintB = ceaserMintB // PDA for maker's token mint B
      accounts.takerAccountMintB = bobMintB // PDA for taker's token mint B
    });

  it("Puts Ceaser's Tokens into Vault when he makes an Offer!", async () => {

    const offerSeed = new anchor.BN(randomBytes(8));

    // Derive the account addresses we'll use for the offer and vault

    const offer = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), accounts.maker.toBuffer(), offerSeed.toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];

    const vault = getAssociatedTokenAddressSync(
      accounts.mintA,
      offer,
      true,
      TOKEN_PROGRAM
    );

    accounts.offer = offer;
    accounts.vault = vault;

    // console.log("accounts: ", accounts);

    const tx = await program.methods
      .makeOffer(offerSeed, mintAOfferedAmount)
      .accounts({ ...accounts })
      .signers([ceaser])
      .rpc()

    await confirmTransaction(connection, tx);

    // Check our vault contains the tokens offered
    const vaultBalanceResponse = await connection.getTokenAccountBalance(vault);
    const vaultBalance = new anchor.BN(vaultBalanceResponse.value.amount);
    assert(vaultBalance.eq(mintAOfferedAmount));

    // Check our Offer account contains the correct data
    const offerAccount = await program.account.offer.fetch(offer);

    assert(offerAccount.maker.equals(ceaser.publicKey));
    assert(offerAccount.mintA.equals(accounts.mintA));
    assert(offerAccount.mintB.equals(accounts.mintB));
    assert(offerAccount.receiveAmount.eq(mintAOfferedAmount));
  });

  it("sends token from vault to Bob's account and gives Ceaser Bob's tokens when Bob takes an Offer", async () => {
    
    const tx = await program.methods
      .takeOffer()
      .accounts({ ...accounts })
      .signers([bob,])
      .rpc();
    const confirmed = await confirmTransaction(connection, tx);
    console.log("Transaction signature:", confirmed);

    // Check the offered tokens are now in Bob's account
    const bobTokenAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.takerAccountMintA);
    const bobTokenAccountBalanceAfter = new anchor.BN(bobTokenAccountBalanceAfterResponse.value.amount);
    assert(bobTokenAccountBalanceAfter.eq(mintAOfferedAmount));

    // Check the wanted tokens are now in Ceaser's account
    const ceaserTokenAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.makerAccountMintB);
    const ceaserTokenAccountBalanceAfter = new anchor.BN(ceaserTokenAccountBalanceAfterResponse.value.amount);
    assert(ceaserTokenAccountBalanceAfter.eq(mintAOfferedAmount));

  });
});
