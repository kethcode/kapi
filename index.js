/**
 * @title Kwenta API
 * @author Kethic (@kethcode, kethic@kethic.com)
 * @version v0.5
 * @notice  The Kwenta API is a REST interface for standard web apps to
 * 			retrieve data about Kwenta products and tokens.  The current
 * 			version focuses on $Kwenta token data.
 */

/// ----------------------------------------------------------------------------
/// Library Imports
/// ----------------------------------------------------------------------------

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const ethers = require("ethers");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

/// ----------------------------------------------------------------------------
/// Web3 Constants
/// ----------------------------------------------------------------------------

const provider = new ethers.providers.WebSocketProvider(
  process.env.RPC_KEY_WSS
);

const kwentaTokenContractAddress = "0x920Cf626a271321C151D027030D5d08aF699456b";
const stakingRewardsContractAddress =
  "0x6e56A5D49F775BA08041e28030bc7826b13489e0";
const rewardEscrowContractAddress =
  "0x1066A8eB3d90Af0Ad3F89839b974658577e75BE2";
const tradingRewardsContractAddress =
  "0xf486A72E8c8143ACd9F65A104A16990fDb38be14";
const treasuryContractAddress = "0x82d2242257115351899894eF384f779b5ba8c695";

const kwentaTokenAbiPath = path.resolve(__dirname, "./abi/kwentaToken.json");

const kwentaTokenAbi = JSON.parse(
  fs.readFileSync(kwentaTokenAbiPath, { flag: "r+" })
);

const kwentaTokenContract = new ethers.Contract(
  kwentaTokenContractAddress,
  kwentaTokenAbi["abi"],
  provider
);

const stakingRewardsAbiPath = path.resolve(
  __dirname,
  "./abi/stakingRewards.json"
);

const stakingRewardsAbi = JSON.parse(
  fs.readFileSync(stakingRewardsAbiPath, { flag: "r+" })
);

const stakingRewardsContract = new ethers.Contract(
  stakingRewardsContractAddress,
  stakingRewardsAbi["abi"],
  provider
);

/// ----------------------------------------------------------------------------
/// Web2 Constants
/// ----------------------------------------------------------------------------

const app = express();
const port = process.env.PORT || 4200; // heroku adds PORT to env, and uses that

/// ----------------------------------------------------------------------------
/// Configure
/// ----------------------------------------------------------------------------

app.use(helmet());
app.use(cors());

/// ----------------------------------------------------------------------------
/// Variables
/// ----------------------------------------------------------------------------

/**
 * @notice  The API caches data retrieved from contracts to reduce RPC calls
 * 			and improve performance.  When a value is retrieved, a timestamp
 * 			is saved.  When that data is requested again, we first check if
 * 			the data is stale, and if it is, we retrieve it again. Otherwise
 * 			we return the cahced value.
 */

let totalSupply = 0;
let stakedSupply = 0;
let stakedBalance = 0;
let rewardEscrowedBalance = 0;
let tradingRewardsBalance = 0;
let treasuryBalance = 0;

let timestamps = [0, 0, 0, 0, 0, 0];

const timestamp_index = {
  totalSupply: 0,
  stakedSupply: 1,
  stakedBalance: 2,
  rewardEscrowedBalance: 3,
  tradingRewardsBalance: 4,
  treasuryBalance: 5,
};

let CACHE_REFRESH_DELAY = 3600;
let CC_ALLOCATION = ethers.BigNumber.from(47000).mul(
  ethers.BigNumber.from(10).pow(18)
);

/// ----------------------------------------------------------------------------
/// Functions
/// ----------------------------------------------------------------------------

/**
 * @notice checks if the currently cahced contract data is stale.
 *
 * @param index which variables timestamp are we checking
 */
const okToRefresh = (index) => {
  //console.log("refreshing index %d", index);

  // what time is it now
  let now = Math.floor(Date.now() / 1000);

  // has the cached data timed out?
  if (now >= timestamps[index] + CACHE_REFRESH_DELAY) {
    // yes, so tell the caller to update it, and mark the update time
    timestamps[index] = now;
    return true;
  } else {
    // no, so tell the caller to use cached data
    return false;
  }
};

/**
 * @notice updates totalSupply cache variable if it has expired
 */
const updateTotalSupply = async () => {
  if (okToRefresh(timestamp_index.totalSupply)) {
    try {
      totalSupply = await kwentaTokenContract.totalSupply();
    } catch (e) {
      console.log("kwentaTokenContract.totalSupply() failed. Retrying.");
      console.err("kwentaTokenContract.totalSupply() failed: ", e);
      totalSupply = await kwentaTokenContract.totalSupply();
    }
  }
  //   console.log("totalSupply: ", ethers.utils.formatEther(totalSupply));
};

/**
 * @notice updates stakedSupply cache variable if it has expired
 */
const updateStakedSupply = async () => {
  if (okToRefresh(timestamp_index.stakedSupply)) {
    try {
      stakedSupply = await stakingRewardsContract.totalSupply();
    } catch (e) {
      console.log("stakingRewardsContract.totalSupply() failed. Retrying.");
      console.err("stakingRewardsContract.totalSupply() failed: ", e);
      stakedSupply = await stakingRewardsContract.totalSupply();
    }
  }
  //   console.log("stakedSupply: ", ethers.utils.formatEther(stakedSupply));
};

/**
 * @notice updates stakedBalance cache variable if it has expired
 */
const updateStakedBalance = async () => {
  if (okToRefresh(timestamp_index.stakedBalance)) {
    try {
      stakedBalance = await kwentaTokenContract.balanceOf(
        stakingRewardsContractAddress
      );
    } catch (e) {
      console.log(
        "kwentaTokenContract.balanceOf(stakingRewardsContractAddress) failed. Retrying."
      );
      console.err(
        "kwentaTokenContract.balanceOf(stakingRewardsContractAddress) failed: ",
        e
      );
      stakedBalance = await kwentaTokenContract.balanceOf(
        stakingRewardsContractAddress
      );
    }
  }
  //   console.log("stakedBalance: ", ethers.utils.formatEther(stakedBalance));
};

/**
 * @notice updates rewardEscrowedBalance cache variable if it has expired
 */
const updateRewardEscrowBalance = async () => {
  if (okToRefresh(timestamp_index.rewardEscrowedBalance)) {
    try {
      rewardEscrowedBalance = await kwentaTokenContract.balanceOf(
        rewardEscrowContractAddress
      );
    } catch (e) {
      console.log(
        "kwentaTokenContract.balanceOf(rewardEscrowContractAddress) failed. Retrying."
      );
      console.err(
        "kwentaTokenContract.balanceOf(rewardEscrowContractAddress) failed: ",
        e
      );
      rewardEscrowedBalance = await kwentaTokenContract.balanceOf(
        rewardEscrowContractAddress
      );
    }
  }
  //   console.log(
  //     "rewardEscrowedBalance: ",
  //     ethers.utils.formatEther(rewardEscrowedBalance)
  //   );
};

/**
 * @notice updates tradingRewardsBalance cache variable if it has expired
 */
const updateTradingRewardsBalance = async () => {
  if (okToRefresh(timestamp_index.tradingRewardsBalance)) {
    try {
      tradingRewardsBalance = await kwentaTokenContract.balanceOf(
        tradingRewardsContractAddress
      );
    } catch (e) {
      console.log(
        "kwentaTokenContract.balanceOf(tradingRewardsContractAddress) failed. Retrying."
      );
      console.err(
        "kwentaTokenContract.balanceOf(tradingRewardsContractAddress) failed: ",
        e
      );
      tradingRewardsBalance = await kwentaTokenContract.balanceOf(
        tradingRewardsContractAddress
      );
    }
  }
  //   console.log(
  //     "tradingRewardsBalance: ",
  //     ethers.utils.formatEther(tradingRewardsBalance)
  //   );
};

/**
 * @notice updates treasuryBalance cache variable if it has expired
 */
const updateTreasuryBalance = async () => {
  if (okToRefresh(timestamp_index.treasuryBalance)) {
    try {
      treasuryBalance = await kwentaTokenContract.balanceOf(
        treasuryContractAddress
      );
    } catch (e) {
      console.log(
        "kwentaTokenContract.balanceOf(treasuryContractAddress) failed. Retrying."
      );
      console.err(
        "kwentaTokenContract.balanceOf(treasuryContractAddress) failed: ",
        e
      );
      treasuryBalance = await kwentaTokenContract.balanceOf(
        treasuryContractAddress
      );
    }
  }
  //   console.log("treasuryBalance: ", ethers.utils.formatEther(treasuryBalance));
};

/// ----------------------------------------------------------------------------
/// Table of Contents / Website
/// ----------------------------------------------------------------------------

let api_table = `<p>Kwenta API v0:<br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-total'>https://kwenta-api.herokuapp.com/v0/supply-total</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-circulating'>https://kwenta-api.herokuapp.com/v0/supply-circulating</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-liquid'>https://kwenta-api.herokuapp.com/v0/supply-liquid</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-locked'>https://kwenta-api.herokuapp.com/v0/supply-locked</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked'>https://kwenta-api.herokuapp.com/v0/supply-staked</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked-circulating'>https://kwenta-api.herokuapp.com/v0/supply-staked-circulating</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked-locked'>https://kwenta-api.herokuapp.com/v0/supply-staked-locked</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-refresh-cache'>https://kwenta-api.herokuapp.com/v0/supply-refresh-cache</a>(DEV ONLY, EXPENSIVE)</p>`;

/// ----------------------------------------------------------------------------
/// Routes
/// ----------------------------------------------------------------------------

/**
 * @notice return the table of contents / website content
 */
app.get("/", async (req, res) => {
  res.status(200).send(api_table);
});

/**
 * @notice return $Kwenta totalSupply
 *
 * @dev calculation: raw data from contract
 */
app.get("/v0/supply-total", async (req, res) => {
  await updateTotalSupply();

  res.status(200).send(ethers.utils.formatEther(totalSupply));
});

/**
 * @notice calculate and return $Kwenta circulating token count
 *
 * @dev	escrowed tokens are considered locked.  trading reward contract
 * 		holds escrowed tokens that have yet to be claimed, but they are
 * 		still locked tokens. treasury is not considered public, and
 * 		therefore is not circulating. CC allocation is considered
 * 		founding team vesting, and is therefore also not circulating.
 *
 * @dev calculation: totalSupply - (escrow claimed + escrow unclaimed +
 * 		treasury + CC_ALLOCATIAON)
 */
app.get("/v0/supply-circulating", async (req, res) => {
  await updateTotalSupply();
  await updateRewardEscrowBalance();
  await updateTradingRewardsBalance();
  await updateTreasuryBalance();

  let circulatingSupply = totalSupply.sub(
    rewardEscrowedBalance.add(
      tradingRewardsBalance.add(treasuryBalance.add(CC_ALLOCATION))
    )
  );
  res.status(200).send(ethers.utils.formatEther(circulatingSupply));
});

/**
 * @notice calculate and return $Kwenta liquid token count
 *
 * @dev	escrowed tokens are considered locked.  trading reward contract
 * 		holds escrowed tokens that have yet to be claimed, but they are
 * 		still locked tokens.
 *
 * @dev calculation: totalSupply - (escrow claimed + escrow unclaimed)
 */
app.get("/v0/supply-liquid", async (req, res) => {
  await updateTotalSupply();
  await updateRewardEscrowBalance();
  await updateTradingRewardsBalance();

  let liquidSupply = totalSupply.sub(
    rewardEscrowedBalance.add(tradingRewardsBalance)
  );
  res.status(200).send(ethers.utils.formatEther(liquidSupply));
});

/**
 * @notice calculate and return $Kwenta locked token count
 *
 * @dev	escrowed tokens are considered locked.  trading reward contract
 * 		holds escrowed tokens that have yet to be claimed, but they are
 * 		still locked tokens.
 *
 * @dev calculation: escrow claimed + escrow unclaimed
 */
app.get("/v0/supply-locked", async (req, res) => {
  await updateRewardEscrowBalance();
  await updateTradingRewardsBalance();

  let escrowedBalance = rewardEscrowedBalance.add(tradingRewardsBalance);
  res.status(200).send(ethers.utils.formatEther(escrowedBalance));
});

/**
 * @notice return $Kwenta staked token count
 *
 * @dev staked token count includes liquid and escrowed tokens
 *
 * @dev calculation: raw data from contract
 */
app.get("/v0/supply-staked", async (req, res) => {
  await updateStakedSupply();

  res.status(200).send(ethers.utils.formatEther(stakedSupply));
});

/**
 * @notice return $Kwenta staked liquid token count
 *
 * @dev the actual balance of $Kwenta in the staking contract
 * 		is all liquid tokens that have been staked.  escrowed
 * 		staked tokens are retained in the escrow contract
 *
 * @dev calculation: raw data from contract
 */
app.get("/v0/supply-staked-circulating", async (req, res) => {
  await updateStakedBalance();

  res.status(200).send(ethers.utils.formatEther(stakedBalance));
});

/**
 * @notice return $Kwenta staked locked token count
 *
 * @dev the actual balance of $Kwenta in the staking contract
 * 		is all liquid tokens that have been staked.  escrowed
 * 		staked tokens are retained in the escrow contract
 *
 * @dev calculation: staked total - staked liquid
 */
app.get("/v0/supply-staked-locked", async (req, res) => {
  await updateStakedSupply();
  await updateStakedBalance();

  let stakedLocked = stakedSupply.sub(stakedBalance);
  res.status(200).send(ethers.utils.formatEther(stakedLocked));
});

/**
 * @notice forces a hard refresh on all cached data.  RPC expensive
 *
 * @dev this is not documented because it's expensive and I dont
 * 		want people using it often.  this is a developer resource
 * 		only.  if it gets abused, I will remove it, or lock it
 * 		behind authentication.
 */
app.get("/v0/supply-refresh-cache", async (req, res) => {
  timestamps = [0, 0, 0, 0, 0, 0];

  await updateTotalSupply();
  await updateStakedSupply();
  await updateStakedBalance();
  await updateRewardEscrowBalance();
  await updateTradingRewardsBalance();
  await updateTreasuryBalance();

  res.status(200).send(`Supply Cache Data Refreshed`);
});

/// ----------------------------------------------------------------------------
/// Application
/// ----------------------------------------------------------------------------

app.listen(port, () => console.log(`Kwenta API started`));
