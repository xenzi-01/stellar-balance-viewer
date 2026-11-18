const form = document.getElementById("lookup-form");
const networkSelect = document.getElementById("network");
const keyInput = document.getElementById("public-key");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const accountIdEl = document.getElementById("account-id");
const sequenceEl = document.getElementById("sequence");
const balancesEl = document.getElementById("balances");
const button = form.querySelector("button");

const HORIZON = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
};

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function describeBalance(balance) {
  if (balance.asset_type === "native") {
    return { name: "XLM", issuer: "" };
  }
  if (balance.asset_type === "liquidity_pool_shares") {
    return { name: "Liquidity pool shares", issuer: balance.liquidity_pool_id };
  }
  return { name: balance.asset_code, issuer: balance.asset_issuer };
}

function renderBalances(balances) {
  balancesEl.replaceChildren();

  for (const balance of balances) {
    const { name, issuer } = describeBalance(balance);

    const li = document.createElement("li");

    const nameEl = document.createElement("span");
    nameEl.className = "asset-name";
    nameEl.textContent = name + ": ";

    const amountEl = document.createElement("span");
    amountEl.className = "asset-amount";
    amountEl.textContent = balance.balance;

    li.append(nameEl, amountEl);

    if (issuer) {
      const issuerEl = document.createElement("span");
      issuerEl.className = "asset-issuer";
      issuerEl.textContent = "Issuer: " + issuer;
      li.append(issuerEl);
    }

    balancesEl.append(li);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const publicKey = keyInput.value.trim();
  const baseUrl = HORIZON[networkSelect.value];

  if (!/^G[A-Z2-7]{55}$/.test(publicKey)) {
    resultEl.hidden = true;
    setStatus("That does not look like a valid public key. It should start with G and be 56 characters long.", true);
    return;
  }

  button.disabled = true;
  resultEl.hidden = true;
  setStatus("Loading...");

  try {
    const response = await fetch(`${baseUrl}/accounts/${publicKey}`);

    if (response.status === 404) {
      setStatus("Account not found on this network. Check the key and the network you selected.", true);
      return;
    }
    if (!response.ok) {
      setStatus(`Request failed with status ${response.status}.`, true);
      return;
    }

    const account = await response.json();

    accountIdEl.textContent = account.account_id;
    sequenceEl.textContent = "Sequence: " + account.sequence;
    renderBalances(account.balances);

    resultEl.hidden = false;
    setStatus("");
  } catch (error) {
    setStatus("Could not reach the Stellar network. Check your connection and try again.", true);
  } finally {
    button.disabled = false;
  }
});
