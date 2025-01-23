pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("Dt5P1PTv8eSDHd5paAW4WKTEg3N8BhSvSomkSrmuSwHj");

#[program]
pub mod escrow {
    use super::*;

    pub fn make_offer(ctx: Context<Make>, seed: u64,  receive_amount: u64) -> Result<()> {
        ctx.accounts.init_escrow_state(seed, receive_amount, ctx.bumps)?;
        ctx.accounts.deposit(receive_amount)?;
        Ok(())
    }

    pub fn take_offer(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.send_wanted_tokens_to_maker()?;
        ctx.accounts.withdraw_and_close_vault()
    }
}
