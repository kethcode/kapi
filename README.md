# Kwenta API

kwenta token:    [0x920Cf626a271321C151D027030D5d08aF699456b](https://optimistic.etherscan.io/address/0x920Cf626a271321C151D027030D5d08aF699456b)
supply schedule: [0x3e8b82326Ff5f2f10da8CEa117bD44343ccb9c26](https://optimistic.etherscan.io/address/0x3e8b82326ff5f2f10da8cea117bd44343ccb9c26)     
staking rewards: [0x6e56A5D49F775BA08041e28030bc7826b13489e0](https://optimistic.etherscan.io/address/0x6e56a5d49f775ba08041e28030bc7826b13489e0)
reward escrow:   [0x1066A8eB3d90Af0Ad3F89839b974658577e75BE2](https://optimistic.etherscan.io/address/0x1066a8eb3d90af0ad3f89839b974658577e75be2)
treasurydao:     [0x82d2242257115351899894eF384f779b5ba8c695](https://optimistic.etherscan.io/address/0x82d2242257115351899894ef384f779b5ba8c695)
tradingRewards:  [0xf486A72E8c8143ACd9F65A104A16990fDb38be14](https://optimistic.etherscan.io/address/0xf486a72e8c8143acd9f65a104a16990fdb38be14)

the token contract maintains a totalSupply value for every token issued, regardless of location.                   395825440182425341758415
the staking contract maintains a totalSupply value for every token posessed by this contract, liquid or escrowed.  254670707071152717402594
the escrow contract maintains a totalEscrowedBalance value for every token issued (escrowed) but not yet vested.   133093439959839632907325
the treasurydao contains a balance of tokens.  			 												            82629000000000000000000

so in this example, there are:
  395825 tokens in existance
  133093 tokens locked in escrow?
   82629 tokens in the treasury
  ------
  180103 tokens circulating?


staking rewards contract currently holds 159000 tokens, but reports a totalsupply of 254000 tokens?
reward escrow contract currently holds 133000 tokens, which exactly matches totalEscrowedBalance.  aka, all unvested rewards are held here.
treasury holds 82000 tokens as expected.   this is a multisig.
0xc7088AC8F287539567e458C7D08C2a1470Fd25B7 holds 9000 tokens.  veKwentaRedeemer
0xF510a2Ff7e9DD7e18629137adA4eb56B9c13E885 holds 2800 tokens.  this is a multisig.  it also distributed a ton of op tokens 3 days ago.
0xd65c1120DDF79F827b925C505949E02c5A0D6236 holds 1800 kwenta and 286 weth.  looks like voledrome
0x36e42931A765022790b797963e42c5522d6b585a holds 1700 kwenta and 182 weth.  guessing arrakis
0x8132EE584bCD6f8Eb1bea141DB7a7AC1E72917b9 holds 1700 tokens, and a bunch of vkwenta. anotehr vKwentaRedeemer
0xf486A72E8c8143ACd9F65A104A16990fDb38be14 holds 1000 tokens. our first human?  nah, it's tradingRewards distributor
0x896b94f4f27f12369698C302e2049cAe86936BbB holds 600 liquid tokens. our first human.  looks like aelin raise claimant.
everyone else is 200 tokens or less.

so, check totalSupply
check actual balance in staking reward contractm and reported totalsupply.  do some math to determine how many of these tokens are liquid
check actual balance in reward escrow contract.  none of these are liquid
check balance of treasury.  are these liquid?
veRedeem is liquid
multisig is liquid
velo is liquid
arrakis is liquid
vRedeemis liquid
tradingrewards are not liquid

back to staking reward contract.
stake() transfers liquid tokens into contact and updated totalSupply
unstake() transfers liquid tokens back to user
stakeEscrow updated totalSupply, but does not actuallyr eceive tokens.
so, the difference between actual tokens in contract, and totalSupply, is the number of escrowed tokens staked.
that's..  sad.

anyway, staking rewards contract is irrelevant for calculating circulating supply

circulating supply:
get totalSupply
get totalEscrowedBalance and subtract
get tradingRewards balance and subtract (these will end in up Escrow)
the result is your potential circulating supply.. maybe minus the treasury.













https://optimistic.etherscan.io/token/0x920cf626a271321c151d027030d5d08af699456b?a=0xbfc632f6f7fcd45a0da0615d01e588daf8a47ff0

Dec-22-2022 08:57:40 PM +UTC
1671742660

supply schedule

1 000 000 000 000 000 000

 function mint() override external 
 
 mintableSupply();

        uint amountToDistribute = supplyToMint - minterReward;
        uint amountToTreasury = amountToDistribute * treasuryDiversion / 10000;
        uint amountToTradingRewards = amountToDistribute * tradingRewardsDiversion / 10000;
        uint amountToStakingRewards = amountToDistribute - amountToTreasury - amountToTradingRewards;

        kwenta.mint(treasuryDAO, amountToTreasury);
        kwenta.mint(address(tradingRewards), amountToTradingRewards);
        kwenta.mint(address(stakingRewards), amountToStakingRewards);
        stakingRewards.notifyRewardAmount(amountToStakingRewards);
        kwenta.mint(msg.sender, minterReward);
    