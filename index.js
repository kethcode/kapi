require("dotenv").config();
const fs = require("fs");
const path = require("path");

const ethers = require("ethers");
const provider = new ethers.providers.WebSocketProvider(
  process.env.RPC_KEY_WSS
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

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

// const fs = require("fs");
// const path = require("path");
// const stream = require("stream");

// const provider_env = process.env.ALCHEMY_KEY_RINKEBY;
// const wallet_env = process.env.PRIVATE_KEY_RINKEBY;
// const provider = new ethers.providers.JsonRpcProvider(provider_env);
// const wallet = new ethers.Wallet(wallet_env, provider);

// const path_abi_Composable = "./abi/Composable.json";
// const path_abi_NFT_721E = "./abi/NFT_721E.json";
// const path_data = path.resolve(__dirname, `./data/`);

// const { createCanvas, loadImage } = require("canvas");

const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
const app = express();
const port = 80;

// const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// console.log(`Optimism Composable NFT Image Server`);

// const cluster = require("cluster");
// const os = require("os");
// const { workerData } = require("worker_threads");

let totalSupply = 0;
let stakedSupply = 0;
let circulatingSupply = 0;

let rewardEscrowedBalance = 0;
let tradingRewardsBalance = 0;

// if (cluster.isPrimary) {
//   totalSupply = getTotalSupply();
//   const availableCpus = os.cpus();
//   console.log(`Clustering to ${availableCpus.length} processes`);
//   availableCpus.forEach(() => cluster.fork());

//   //   worker.on('totalSupply')
// } else {
//   const { pid } = process;

/// ------------------------------------------------------------------------
/// App Starts Here
/// ------------------------------------------------------------------------

app.get("/v0/totalSupply", async (req, res) => {
  //console.log(`${pid} getting /v0/totalSupply`);
  console.log(`getting /v0/totalSupply`);

  totalSupply = await getTotalSupply();

  //   console.log(ethers.utils.formatEther(totalSupply));
  res.status(200).send(ethers.utils.formatEther(totalSupply));
});

app.get("/v0/stakedSupply", async (req, res) => {
  //console.log(`${pid} getting /v0/stakedSupply`);
  console.log(`getting /v0/stakedSupply`);

  stakedSupply = await getStakedSupply();

  //   console.log(ethers.utils.formatEther(stakedSupply));
  res.status(200).send(ethers.utils.formatEther(stakedSupply));
});

app.get("/v0/circulatingSupply", async (req, res) => {
  //console.log(`${pid} getting /v0/circulatingSupply`);
  console.log(`getting /v0/circulatingSupply`);

  totalSupply = await getTotalSupply();
  rewardEscrowedBalance = await getRewardEscrowBalance();
  tradingRewardsBalance = await getTradingRewardsBalance();
  circulatingSupply = totalSupply.sub(
    rewardEscrowedBalance.sub(tradingRewardsBalance)
  );

  //   console.log(ethers.utils.formatEther(circulatingSupply));
  res.status(200).send(ethers.utils.formatEther(circulatingSupply));
});

//app.listen(port, () => console.log(`KAPI Worker started at pid ${pid}`));
app.listen(port, () => console.log(`KAPI started`));
// }
