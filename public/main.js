const createAccount = document.getElementById("createaccount");
const accountsList = document.getElementById("accounts");
const loginForm = document.getElementById("login");
const logoutForm = document.getElementById("logout");
const formUsername = document.getElementById("user");
const formPassword = document.getElementById("pass");
const createUserForm = document.getElementById("createuser");
const userName = document.getElementById("username");
const userPassword = document.getElementById("password");
const welcomeMessage = document.getElementById("welcomeUser");
const bankUser = document.getElementById("bankuser");
const bankInfo = document.getElementById("bankinfo");

const nameField = document.getElementById("name");
const balanceField = document.getElementById("balance");

let accounts = [];

const accountTemplate = (account) => `
  <tr>
    <td>
      <p>${account._id}</p>
    </td>
    <td>
      <p>${account.name}</p>
    </td>
    <td>
      <p>${account.balance}</p>
    </td>
    <td>
    <input type="number" id="amount${account._id}">
    </td>
    <td>
      <button data-function="deposit" data-accountid="${account._id}">Sätt in</button>
    </td>
    <td>
      <button data-function="withdrawal" data-accountid="${account._id}">Ta ut</button>
    </td>
    <td>
      <button data-function="delete" data-accountid="${account._id}">Ta bort konto</button>
    </td>
  </tr>
`;

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: formUsername.value,
      pass: formPassword.value,
    }),
  });
  location.reload();
  console.log("You are logged in");
});

const checkIfLoggedin = async () => {
  const res = await fetch("/loggedin");
  const data = await res.json();

  if (data.user) {
    bankUser.style.display = "none";
    welcomeMessage.innerText = `Välkommen ${data.user}!`;
    loadAccounts();
  } else {
    logoutForm.style.display = "none";
    bankInfo.style.display = "none";
  }
};

checkIfLoggedin();

logoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await fetch("/logout", { method: "POST" });

  location.reload();
  console.log("You are logged out");
});

createUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: userName.value,
      pass: userPassword.value,
    }),
  });
  location.reload();
  console.log("user created");
});

createAccount.addEventListener("submit", async (e) => {
  e.preventDefault();

  await fetch("/accounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: nameField.value,
      balance: balanceField.value,
    }),
  });
  createAccount.reset();
  loadAccounts();
});

const deleteAccount = async (e) => {
  await fetch(`/accounts/${e.target.dataset.accountid}`, {
    method: "DELETE",
  });

  loadAccounts();
};

const deposit = async (e) => {
  const amount = document.getElementById(
    `amount${e.target.dataset.accountid}`
  ).value;

  await fetch(`/accounts/${e.target.dataset.accountid}/deposit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deposit: amount,
    }),
  });
  loadAccounts();
};

const withdrawal = async (e) => {
  const amount = document.getElementById(
    `amount${e.target.dataset.accountid}`
  ).value;

  await fetch(`/accounts/${e.target.dataset.accountid}/withdrawal`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      withdrawal: amount,
    }),
  });
  loadAccounts();
};

const loadAccounts = async () => {
  const res = await fetch("/accounts");
  accounts = await res.json();

  accountsList.innerHTML = accounts.map(accountTemplate).join("");
  addButtonListeners();
};

const addButtonListeners = () => {
  const deleteBtns = document.querySelectorAll('[data-function="delete"]');
  deleteBtns.forEach((btn) => btn.addEventListener("click", deleteAccount));

  const depositBtns = document.querySelectorAll('[data-function="deposit"]');
  depositBtns.forEach((btn) => btn.addEventListener("click", deposit));

  const withdrawalBtns = document.querySelectorAll(
    '[data-function="withdrawal"]'
  );
  withdrawalBtns.forEach((btn) => btn.addEventListener("click", withdrawal));
};

// loadAccounts();
