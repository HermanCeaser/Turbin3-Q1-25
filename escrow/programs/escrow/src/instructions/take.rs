use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        transfer_checked, close_account, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked
    },
};

use crate::state::Offer;

use super::transfer_tokens;

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    
    pub mint_a: InterfaceAccount<'info, Mint>,
    
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed, 
        payer=taker,
        associated_token::mint=mint_a, 
        associated_token::authority=taker,
        associated_token::token_program = token_program 
    )]
    pub taker_mint_a_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_b, 
        associated_token::authority = taker,
        associated_token::token_program = token_program 
    )]
    pub taker_mint_b_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        init_if_needed,
        payer = taker, 
        associated_token::mint=mint_b, 
        associated_token::authority=maker,
        associated_token::token_program = token_program 
    )]
    pub maker_mint_b_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        mut,
        close = maker,
        has_one = maker,
        has_one = mint_a,
        has_one = mint_b,
        seeds = [b"escrow", maker.key().as_ref(), offer.seed.to_le_bytes().as_ref()],
        bump
    )]
    pub offer: Account<'info, Offer>,
    
    #[account(
        mut,
        associated_token::mint = mint_a, 
        associated_token::authority = offer,
        associated_token::token_program = token_program 
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Take<'info> {
    pub fn send_wanted_tokens_to_maker(&mut self) -> Result<()> {
        transfer_tokens(
            &self.taker_mint_b_ata, 
            &self.maker_mint_b_ata, 
            &self.offer.receive_amount, 
            &self.mint_b,
            &self.taker,  
            &self.token_program
        )
    }

    pub fn withdraw_and_close_vault(&mut self) -> Result<()> {
        let seeds = &[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.offer.seed.to_le_bytes()[..],
            &[self.offer.bump]
        ];

        let signer_seeds = [&seeds[..]];

        let accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.taker_mint_a_ata.to_account_info(),
            mint: self.mint_a.to_account_info(),
            authority: self.offer.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), accounts, &signer_seeds );

        transfer_checked(cpi_context, self.vault.amount, self.mint_a.decimals)?;

        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.taker.to_account_info(),
            authority: self.offer.to_account_info(),
        };

        let close_cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), close_accounts, &signer_seeds);

        close_account( close_cpi_context)
    }
    
}