/**
 * @title Kwenta API
 * @author Kethic (@kethcode, kethic@kethic.com)
 * @version v0.3
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

const kwentaTokenContractAddress = 
  "0x920Cf626a271321C151D027030D5d08aF699456b";
const stakingRewardsContractAddress =
  "0x6e56A5D49F775BA08041e28030bc7826b13489e0";
const rewardEscrowContractAddress =
  "0x1066A8eB3d90Af0Ad3F89839b974658577e75BE2";
const tradingRewardsContractAddress =
  "0xf486A72E8c8143ACd9F65A104A16990fDb38be14";

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

let timestamps = [0, 0, 0, 0, 0];

const timestamp_index = {
  totalSupply: 0,
  stakedSupply: 1,
  stakedBalance: 2,
  rewardEscrowedBalance: 3,
  tradingRewardsBalance: 4,
};

let CACHE_REFRESH_DELAY = 3600;

/// ----------------------------------------------------------------------------
/// Functions
/// ----------------------------------------------------------------------------

/**
 * @notice checks if the currently cahced contract data is stale.
 *
 * @param index which variables timestamp are we checking
 */
const okToRefresh = (index) => {
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
    totalSupply = await kwentaTokenContract.totalSupply();
  }
};

/**
 * @notice updates stakedSupply cache variable if it has expired
 */
const updateStakedSupply = async () => {
  if (okToRefresh(timestamp_index.stakedSupply)) {
    stakedSupply = await stakingRewardsContract.totalSupply();
  }
};

/**
 * @notice updates stakedBalance cache variable if it has expired
 */
const updateStakedBalance = async () => {
  if (okToRefresh(timestamp_index.stakedBalance)) {
    stakedBalance = await kwentaTokenContract.balanceOf(
      stakingRewardsContractAddress
    );
  }
};

/**
 * @notice updates rewardEscrowedBalance cache variable if it has expired
 */
const updateRewardEscrowBalance = async () => {
  if (okToRefresh(timestamp_index.rewardEscrowedBalance)) {
    rewardEscrowedBalance = await kwentaTokenContract.balanceOf(
      rewardEscrowContractAddress
    );
  }
};

/**
 * @notice updates tradingRewardsBalance cache variable if it has expired
 */
const updateTradingRewardsBalance = async () => {
  if (okToRefresh(timestamp_index.tradingRewardsBalance)) {
    tradingRewardsBalance = await kwentaTokenContract.balanceOf(
      tradingRewardsContractAddress
    );
  }
};

/// ----------------------------------------------------------------------------
/// Table of Contents / Website
/// ----------------------------------------------------------------------------

let api_table = `<p>Kwenta API v0:<br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-total'>https://kwenta-api.herokuapp.com/v0/supply-total</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-circulating'>https://kwenta-api.herokuapp.com/v0/supply-circulating</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-locked'>https://kwenta-api.herokuapp.com/v0/supply-locked</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked'>https://kwenta-api.herokuapp.com/v0/supply-staked</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked-circulating'>https://kwenta-api.herokuapp.com/v0/supply-staked-circulating</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked-locked'>https://kwenta-api.herokuapp.com/v0/supply-staked-locked</a></p>`;

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
 * @notice calculate and return $Kwenta liquid token count
 *
 * @dev	escrowed tokens are considered locked.  trading reward contract
 * 		holds escrowed tokens that have yet to be claimed, but they are
 * 		still locked tokens.
 *
 * @dev calculation: totalSupply - (escrow claimed + escrow unclaimed)
 */
app.get("/v0/supply-circulating", async (req, res) => {
  await updateTotalSupply();
  await updateRewardEscrowBalance();
  await updateTradingRewardsBalance();

  let circulatingSupply = totalSupply.sub(
    rewardEscrowedBalance.add(tradingRewardsBalance)
  );
  res.status(200).send(ethers.utils.formatEther(circulatingSupply));
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

/// ----------------------------------------------------------------------------
/// Application
/// ----------------------------------------------------------------------------

app.listen(port, () => console.log(`Kwenta API started`));
