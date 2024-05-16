"use client";

import { useEffect, useState } from "react";
// import { wrapInTryCatch } from "~~/utils/scaffold-eth/common";
import axios from "axios";
import { ethers, formatEther } from "ethers";
import type { NextPage } from "next";
import { Line } from "react-chartjs-2";
import { useAccount } from "wagmi";
import { Address, AddressInput, Balance, EtherInput, IntegerInput } from "~~/components/scaffold-eth";
import {
  useAccountBalance,
  useDeployedContractInfo,
  useScaffoldContractRead,
  useScaffoldContractWrite,
} from "~~/hooks/scaffold-eth";
import { CovalentClient } from "@covalenthq/client-sdk";
import { Curve } from "~~/components/Curve";

// REGEX for number inputs (only allow numbers and a single decimal point)
const NUMBER_REGEX = /^\.?\d+\.?\d*$/;

const Dex: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [ethToTokenAmount, setEthToTokenAmount] = useState("");
  const [tokenToETHAmount, setTokenToETHAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [accountBalanceOf, setAccountBalanceOf] = useState("");

  const { data: SwapContract } = useDeployedContractInfo("RollSwap");
  // const { data: BalloonsInfo } = useDeployedContractInfo("Balloons");
  const { address: connectedAccount } = useAccount();

  // const { data: DEXBalloonBalance } = useScaffoldContractRead({
  //   contractName: "Balloons",
  //   functionName: "balanceOf",
  //   args: [SwapContract?.address?.toString()],
  // });
  const USDC_token = "0x2C9678042D52B97D27f2bD2947F7111d93F3dD0D";
  const ETH_token = "0x5300000000000000000000000000000000000004";
  const [amountIn, setAmountIn] = useState(0);
  const [amountOut, setAmountOut] = useState(0);
  const [duration, setDuration] = useState("");
  const [chartData, setChartData] = useState({});
  const [ETH_price, setETH_price] = useState('');
  let aa;
  const Covalent_API = `https://api.covalenthq.com/v1/pricing/historical/USD/ETH/?key=` + process.env.NEXT_PUBLIC_COVALENT_KEY;
  // console.log(Covalent_API)
  const fetchPrices = async () => {
    try {
      const client = new CovalentClient("cqt_rQt9JtGvcX7D7468yrGW8YCrXfKK");
      const resp = await client.PricingService.getTokenPrices("eth-mainnet", "USD", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", { "from": "2024-03-11", "to": "2024-04-29", "pricesAtAsc": false });
      console.log(resp.data);
      const prices = resp.data[0].items;
      setChartData({
        labels: prices.map(data => new Date(data.date).toLocaleDateString()),
        datasets: [
          {
            label: 'ETH/USD Price',
            data: prices.map(data => data.price),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  };

  useEffect(() => {
    fetchPrices();
    aa = PriceFeed
  }, []);
  const { writeAsync: createQuoteWrite } = useScaffoldContractWrite({
    contractName: "RollSwap",
    functionName: "createQuote",
    args: [
      USDC_token,
      ETH_token,
      BigInt(amountIn),
      BigInt(amountOut),
      duration
    ],
  });
  const { data: PriceFeed } = useScaffoldContractRead({
    contractName: "RollSwap",
    functionName: "getLatestPrice",
  });

  const priceAsString = PriceFeed ? PriceFeed.toString() : 'Loading...';
  const EthVal = Number(priceAsString) / 100000000

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    console.log(event);
    const tx = await createQuoteWrite();
    console.log("Transaction:", tx);
  };

  const { balance: contractETHBalance } = useAccountBalance(SwapContract?.address);

  return (
    <>
      <h1 className="text-center mb-4 mt-5">
        {/* <span className="block text-xl text-right mr-7">
          🎈: {parseFloat(formatEther(userBalloons || 0n)).toFixed(4)}
        </span>
        <span className="block text-xl text-right mr-7">
          💦💦: {parseFloat(formatEther(userLiquidity || 0n)).toFixed(4)}
        </span> */}
      </h1>
      <div className="items-start pt-10 grid grid-cols-1 md:grid-cols-2 content-start">
        <div className="px-5 py-5">
          <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-8 m-8">
            <div className="flex flex-col text-center">
              <span className="text-3xl font-semibold mb-2">DEX Contract</span>
              <span className="block text-2xl mb-2 mx-auto">
                <Address size="xl" address={SwapContract?.address} />
              </span>
              <span className="flex flex-row mx-auto mt-5">
                {" "}
                <Balance className="text-xl" address={SwapContract?.address} />
                {/* {isLoading ? (
                  <span>Loading...</span>
                ) : (
                  <span className="pl-8 text-xl">🎈 {parseFloat(formatEther(DEXBalloonBalance || 0n)).toFixed(4)}</span>
                )} */}
              </span>
            </div>
            <div className="py-3 px-4">
              <div className="flex mb-4 justify-center items-center">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="amountIn" className="block mb-2">Eth To Swap:</label>
                    <input
                      id="amountIn"
                      type="number" // assuming input should be restricted to numbers
                      value={amountIn}
                      onChange={e => setAmountIn(Number(e.target.value))}
                      style={{ borderRadius: '8px', backgroundColor: 'rgba(209, 235, 254, 0.5)', padding: '3px' }}
                      placeholder="Enter amount in"
                      className="form-input"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="amountOut" className="block mb-2">Eth/USDC Rate:</label>
                    <input
                      id="amountOut"
                      type="number" // assuming input should be restricted to numbers
                      value={amountOut}
                      onChange={e => setAmountOut(Number(e.target.value))}
                      style={{ borderRadius: '8px', backgroundColor: 'rgba(209, 235, 254, 0.5)', padding: '3px' }}
                      placeholder="Enter amount out"
                      className="form-input"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="duration" className="block mb-2">Duration:</label>
                    <input
                      id="duration"
                      type="text"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      style={{ borderRadius: '8px', backgroundColor: 'rgba(209, 235, 254, 0.5)', padding: '6px' }}
                      placeholder="Duration"
                      className="form-input"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Create Quote</button>
                </form>
              </div>

              <div className="flex justify-center items-center">
                <span className="w-1/2">
                  <p className="text-center text-primary-content text-xl mt-8 -ml-8">
                    Current ETH/USD : {EthVal}
                  </p>
                </span>
                {/* <button
                  className="btn btn-primary h-[2.2rem] min-h-[2.2rem] mt-6 mx-5"
                  onClick={wrapInTryCatch(tokenToEthWrite, "tokenToEthWrite")}
                >
                  Send
                </button> */}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto p-8 m-8 md:sticky md:top-0">
          {/* <Curve
            addingEth={ethToTokenAmount !== "" ? parseFloat(ethToTokenAmount.toString()) : 0}
            addingToken={tokenToETHAmount !== "" ? parseFloat(tokenToETHAmount.toString()) : 0}
            USD={contractETHBalance ? parseFloat("" + 3320) : 0}
            ETH={parseFloat(formatEther(222 || 0n))}
            width={500}
            height={500}
          /> */}
          {/* <h2>ETH/USD Historical Price Chart</h2>
          <Line data={chartData} /> */}
        </div>
      </div>
    </>
  );
};

export default Dex;
