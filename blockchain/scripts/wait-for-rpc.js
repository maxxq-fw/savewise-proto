const rpcUrl = process.argv[2] || process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";
const maxAttempts = Number(process.env.RPC_WAIT_ATTEMPTS || 60);
const delayMs = Number(process.env.RPC_WAIT_DELAY_MS || 1000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkRpc() {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_chainId",
      params: []
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.result) {
    throw new Error("RPC response does not contain chainId.");
  }

  return data.result;
}

async function main() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const chainId = await checkRpc();
      console.log(`Hardhat RPC is ready: ${rpcUrl}, chainId=${chainId}`);
      return;
    } catch (error) {
      console.log(`Waiting for Hardhat RPC (${attempt}/${maxAttempts})...`);
      await sleep(delayMs);
    }
  }

  throw new Error(`Hardhat RPC is not available: ${rpcUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
