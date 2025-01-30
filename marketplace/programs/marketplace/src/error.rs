use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError{
    #[msg("Provided name is too long!")]
    NameTooLong,
}
