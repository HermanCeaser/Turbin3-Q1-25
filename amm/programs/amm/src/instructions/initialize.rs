use anchor_lang::prelude::*;


#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Initialize {
    pub maker: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,


    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_x,
        associated_authority = config
    )]
    pub vault_x: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_y,
        associated_authority = config
    )]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        seeds = [b"config", seed.to_le_bytes().as_ref()],
        bump,
        space = Config::INIT_SPACE
    )]
    pub config: Account<'info, Config>,

    pub token_program: Program<'info, Token>,
    pub associated_token: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


