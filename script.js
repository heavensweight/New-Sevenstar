/*********************************
 * CHECK SUPABASE LOADED (IMPORTANT)
 *********************************/
if (!window.supabase) {
  alert("Supabase library failed to load. Check CDN.");
}

/*********************************
 * SUPABASE INITIALIZATION
 *********************************/
const supabaseUrl = "https://wneingzbhbluvcndyhrq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZWluZ3piaGJsdXZjbmR5aHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzU1MTUsImV4cCI6MjA4MjA1MTUxNX0.hUkfvUQFmURQdI2ZzvUas-1yo7TIPTqOEg9GtyoDnIA";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

let customerRecords = [];

/*********************************
 * ADMIN LOGIN
 *********************************/
async function login() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  const loginMsg = document.getElementById("loginMsg");

  if (!email || !password) {
    loginMsg.innerText = "Please enter email and password.";
    return;
  }

  loginMsg.innerText = "Logging in...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      loginMsg.innerText = error.message;
      return;
    }

    loginMsg.innerText = "Login successful!";
    show("adminPanel");
    loadFromSupabase();
  } catch (err) {
    alert("LOGIN ERROR: " + err.message);
  }
}

/*********************************
 * LOAD CUSTOMERS
 *********************************/
async function loadFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("LOAD ERROR: " + error.message);
      return;
    }

    customerRecords = data || [];
    renderTable();
  } catch (err) {
    alert("LOAD EXCEPTION: " + err.message);
  }
}

/*********************************
 * SAVE / UPDATE CUSTOMER
 *********************************/
async function save() {
  const nameInput = document.getElementById("custName");
  const passportInput = document.getElementById("passport");
  const statusInput = document.getElementById("status");
  const fileInput = document.getElementById("ticketFile");

  const name = nameInput.value.trim();
  const passport = passportInput.value.trim().toUpperCase();
  const status = statusInput.value;

  if (!name || !passport) {
    alert("Name and Passport are required.");
    return;
  }

  let ticketPath = null;

  try {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const filename = `${passport}_${Date.now()}_${file.name}`;

      const { data, error } = await supabaseClient.storage
        .from("Tickets")
        .upload(`tickets/${filename}`, file, { upsert: true });

      if (error) {
        alert("UPLOAD ERROR: " + error.message);
        return;
      }

      ticketPath = data.path;
    }

    const payload = {
      name,
      passport,
      status,
    };

    if (ticketPath) payload.ticket = ticketPath;

    const editId = nameInput.dataset.editId;

    let result;
    if (editId) {
      result = await supabaseClient
        .from("customers")
        .update(payload)
        .eq("id", editId);
    } else {
      result = await supabaseClient.from("customers").insert([payload]);
    }

    if (result.error) {
      alert("SAVE ERROR: " + result.error.message);
      return;
    }

    nameInput.value = "";
    passportInput.value = "";
    fileInput.value = "";
    delete nameInput.dataset.editId;

    loadFromSupabase();
  } catch (err) {
    alert("SAVE EXCEPTION: " + err.message);
  }
}

/*********************************
 * RENDER TABLE
 *********************************/
function renderTable() {
  const tbody = document.getElementById("records");
  tbody.innerHTML = "";

  if (customerRecords.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='5'>No records found</td></tr>";
    return;
  }

  customerRecords.forEach((c) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.passport}</td>
      <td class="status-${c.status.replace(/\s/g, "\\ ")}">
        ${c.status}
      </td>
      <td>
        ${
          c.status === "Ticket Issued" && c.ticket
            ? `<a href="${ticketUrl(c.ticket)}" target="_blank">Download</a>`
            : "-"
        }
      </td>
      <td>
        <button onclick="editCustomer('${c.id}')">Edit</button>
        <button onclick="deleteCustomer('${c.id}')">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/*********************************
 * EDIT CUSTOMER
 *********************************/
function editCustomer(id) {
  const c = customerRecords.find((x) => x.id === id);
  if (!c) return;

  document.getElementById("custName").value = c.name;
  document.getElementById("passport").value = c.passport;
  document.getElementById("status").value = c.status;
  document.getElementById("custName").dataset.editId = c.id;

  show("adminPanel");
}

/*********************************
 * DELETE CUSTOMER
 *********************************/
async function deleteCustomer(id) {
  if (!confirm("Delete this customer?")) return;

  try {
    const { error } = await supabaseClient
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      alert("DELETE ERROR: " + error.message);
      return;
    }

    loadFromSupabase();
  } catch (err) {
    alert("DELETE EXCEPTION: " + err.message);
  }
}

/*********************************
 * SEARCH (PUBLIC)
 *********************************/
function search() {
  const name = document
    .getElementById("searchName")
    .value.trim()
    .toLowerCase();
  const passport = document
    .getElementById("searchPassport")
    .value.trim()
    .toUpperCase();

  const c = customerRecords.find(
    (x) => x.name.toLowerCase() === name && x.passport === passport
  );

  if (!c) {
    alert("No record found");
    return;
  }

  document.getElementById("ticketStatus").innerText =
    "Status: " + c.status;

  const link = document.getElementById("downloadLink");

  if (c.status === "Ticket Issued" && c.ticket) {
    link.href = ticketUrl(c.ticket);
    link.style.display = "inline-block";
  } else {
    link.style.display = "none";
  }

  document.getElementById("popup").style.display = "block";
}

/*********************************
 * HELPERS
 *********************************/
function ticketUrl(path) {
  return `${supabaseUrl}/storage/v1/object/public/Tickets/${path}`;
}

function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

function show(id) {
  document
    .querySelectorAll("section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function viewMap() {
  const address =
    "New Seven Star Travel and Tourism, Doha, Qatar";
  window.open(
    `https://www.google.com/maps?q=${encodeURIComponent(address)}`,
    "_blank"
  );
}
