use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::Config;
use constant_product_curve::ConstantProduct;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub lp_provider: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub mint_x: Account<'info, Mint>,

    #[account(mint::token_program = token_program)]
    pub mint_y: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = config,
        associated_token::token_program = token_program
    )]
    pub vault_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = config,
        associated_token::token_program = token_program
    )]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_x
    )]
    pub lp_provider_mint_x_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_y
    )]
    pub lp_provider_mint_y_ata: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"lp", config.key().as_ref()],
        bump = config.lp_bump,
        mint::decimals = 6,
        mint::authority = config,
    )]
    pub mint_lp: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = lp_provider,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_lp
    )]
    pub lp_provider_mint_lp_ata: Account<'info, Mint>,

    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
