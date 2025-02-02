pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4CLw5SQUBt7BJXzeeEoVgAcySQXJgTzt5HcNHsdWrVAh");

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, seed: u64, fee: u8) -> Result<()> {
        ctx.accounts.init(seed, fee, &ctx.bumps)?;
        Ok(())
    }
}
