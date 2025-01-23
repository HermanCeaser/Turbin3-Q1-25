use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::Offer;

#[derive(Accounts)]
pub struct Refund<'info> {
    /// Must a signer to authorize the refund
    #[account(mut)]
    maker: Signer<'info>,

    mint_a: InterfaceAccount<'info, Mint>,

    /// The maker's associated token account for Mint A, where tokens will be refunded to
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    /// The offer account holding the state and terms of the offer, including the seed and associated tokens
    /// This account will be closed, and its remaining balance will be refunded to the maker
    #[account(
        mut,
        close = maker, 
        has_one = mint_a,
        has_one = maker,
        seeds = [b"escrow", maker.key().as_ref(), offer.seed.to_le_bytes().as_ref()], 
        bump = offer.bump
    )]
    offer: Account<'info, Offer>,

    /// The vault account where the tokens from the maker were deposited and held during the offer
    /// Tokens will be transferred back to the maker and account closed
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = offer,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    associated_token_program: Program<'info, AssociatedToken>,
    token_program: Interface<'info, TokenInterface>,
    system_program: Program<'info, System>,
}

impl<'info> Refund<'info> {
    pub fn refund_and_close_vault(&mut self) -> Result<()> {
        // Prepare the signer seeds for authorizig operations with the escrow's PDA
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.offer.seed.to_le_bytes()[..],
            &[self.offer.bump],
        ]];

        // Set up the transfer checked call to move tokens from the vault back to the maker's ATA
        let xfer_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.maker_ata_a.to_account_info(),
            authority: self.offer.to_account_info(),
        };

        // Execute the transfer checked operaiton, transfrering any remaining SOL to the maker
        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            xfer_accounts,
            &signer_seeds,
        );
        transfer_checked(ctx, self.vault.amount, self.mint_a.decimals)?;

        // Set up the closing of the vault account, transferring any remaining SOL to the maker
        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.offer.to_account_info(),
        };

        // Execute the account closure using the signer seeds
        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            &signer_seeds,
        );
        close_account(ctx)
    }
}