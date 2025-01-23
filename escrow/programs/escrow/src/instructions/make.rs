use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint, TokenAccount, TokenInterface
    },
};

use crate::{state::Offer, ANCHOR_DISCRIMINATOR};

use super::transfer_tokens;

#[derive(Accounts)]
#[instruction(seed:u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,

    #[account(mint::token_program=token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        mut, 
        associated_token::mint = mint_a, 
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_mint_a_ata: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        init,
        payer = maker,
        space = ANCHOR_DISCRIMINATOR + Offer::INIT_SPACE,
        seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump
    )]
    pub offer: Account<'info, Offer>,
    
    #[account(
        init, 
        payer=maker,
        associated_token::mint = mint_a, 
        associated_token::authority = offer,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}



impl<'info> Make<'info> {
    pub fn init_escrow_state(
        &mut self,
        seed: u64,
        receive_amount: u64,
        bumps: MakeBumps,
    ) -> Result<()> {
        self.offer.set_inner(Offer {
            receive_amount,
            seed,
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            bump: bumps.offer,
        });
        Ok(())
    }

    pub fn deposit(&mut self, receive_amount: u64) -> Result<()> {
        
        transfer_tokens(
            &self.maker_mint_a_ata,
            &self.vault,
            &receive_amount, 
            &self.mint_a, 
            &self.maker,
            &self.token_program
        )?;
        Ok(())
    }
}
