require("dotenv").config();
const fs = require("fs");
const path = require("path");

const ethers = require("ethers");
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

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

app.use(helmet());
app.use(cors());

// heroku adds PORT to env, and uses that
const port = process.env.PORT || 4200;

// Cache Variables
let totalSupply = 0;
let totalSupplyTimestamp = 0;

let rewardEscrowedBalance = 0;
let rewardEscrowedBalanceTimestamp = 0;

let tradingRewardsBalance = 0;
let tradingRewardsBalanceTimestamp = 0;

let stakedSupply = 0;
let stakedSupplyTimestamp = 0;

let stakedBalance = 0;
let stakedBalanceTimestamp = 0;

// Getter Functions

const getTotalSupply = async () => {
  let retval = await kwentaTokenContract.totalSupply();
  //   console.log(ethers.utils.formatEther(retval));
  return retval;
};

const getStakedSupply = async () => {
  let retval = await stakingRewardsContract.totalSupply();
  //   console.log(ethers.utils.formatEther(retval));
  return retval;
};

const getStakedBalance = async () => {
  let retval = await kwentaTokenContract.balanceOf(
    stakingRewardsContractAddress
  );
  //   console.log(ethers.utils.formatEther(retval));
  return retval;
};

const getRewardEscrowBalance = async () => {
  let retval = await kwentaTokenContract.balanceOf(rewardEscrowContractAddress);
  //   console.log(ethers.utils.formatEther(retval));
  return retval;
};

const getTradingRewardsBalance = async () => {
  let retval = await kwentaTokenContract.balanceOf(
    tradingRewardsContractAddress
  );
  //   console.log(ethers.utils.formatEther(retval));
  return retval;
};

// API Endpoints

let api_table = `<p>Kwenta API v0:<br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-total'>https://kwenta-api.herokuapp.com/v0/supply-total</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-circulating'>https://kwenta-api.herokuapp.com/v0/supply-circulating</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-locked'>https://kwenta-api.herokuapp.com/v0/supply-locked</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked'>https://kwenta-api.herokuapp.com/v0/supply-staked</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked-circulating'>https://kwenta-api.herokuapp.com/v0/supply-staked-circulating</a><br />
<a href='https://kwenta-api.herokuapp.com/v0/supply-staked-locked'>https://kwenta-api.herokuapp.com/v0/supply-staked-locked</a></p>`;

app.get("/", async (req, res) => {
  console.log(`getting /`);

  res.status(200).send(api_table);
});

app.get("/v0/supply-total", async (req, res) => {
  console.log(`getting /v0/supply-total`);

  totalSupply = await getTotalSupply();

  res.status(200).send(ethers.utils.formatEther(totalSupply));
});

app.get("/v0/supply-circulating", async (req, res) => {
  console.log(`getting /v0/supply-circulating`);

  totalSupply = await getTotalSupply();
  rewardEscrowedBalance = await getRewardEscrowBalance();
  tradingRewardsBalance = await getTradingRewardsBalance();

  let circulatingSupply = totalSupply.sub(
    rewardEscrowedBalance.add(tradingRewardsBalance)
  );
  res.status(200).send(ethers.utils.formatEther(circulatingSupply));
});

app.get("/v0/supply-locked", async (req, res) => {
  console.log(`getting /v0/supply-locked`);

  rewardEscrowedBalance = await getRewardEscrowBalance();
  tradingRewardsBalance = await getTradingRewardsBalance();

  let escrowedBalance = rewardEscrowedBalance.add(tradingRewardsBalance);
  res.status(200).send(ethers.utils.formatEther(escrowedBalance));
});

app.get("/v0/supply-staked", async (req, res) => {
  console.log(`getting /v0/supply-staked`);

  stakedSupply = await getStakedSupply();

  res.status(200).send(ethers.utils.formatEther(stakedSupply));
});

app.get("/v0/supply-staked-circulating", async (req, res) => {
  console.log(`getting /v0/supply-staked-circulating`);

  stakedBalance = await getStakedBalance();

  res.status(200).send(ethers.utils.formatEther(stakedBalance));
});

app.get("/v0/supply-staked-locked", async (req, res) => {
  console.log(`getting /v0/supply-staked-locked`);

  stakedSupply = await getStakedSupply();
  stakedBalance = await getStakedBalance();

  let stakedLocked = stakedSupply.sub(stakedBalance);
  res.status(200).send(ethers.utils.formatEther(stakedLocked));
});

app.listen(port, () => console.log(`Kwenta API started`));
