// Initialize Supabase client with your provided credentials
const supabaseUrl = 'https://wneingzbhbluvcndyhrq.supabase.co';  // Your Supabase project URL
const supabaseKey = 'sb_publishable_sKf39c8Gu5Zk_N5LBCrfhg_yN1kGAmL';  // Your publishable API key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Admin credentials (hardcoded for now)
const ADMIN_EMAIL = "newseven@azim";
const ADMIN_PASSWORD = "12345678";

// Admin login functionality (no Supabase used for login)
function login() {
  const adminEmail = document.getElementById("adminEmail").value;
  const adminPassword = document.getElementById("adminPassword").value;
  const loginMsg = document.getElementById("loginMsg");

  // Check if both email and password fields are filled
  if (!adminEmail || !adminPassword) {
    loginMsg.innerText = "Please enter both email and password.";
    return;
  }

  // Check if the entered credentials match the hardcoded ones
  if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
    loginMsg.innerText = "Login successful!";
    show("adminPanel"); // Show admin panel after successful login
    loadFromSupabase(); // Load customer data from Supabase after login
  } else {
    loginMsg.innerText = "Invalid login credentials! Please try again.";
  }
}

// Fetch customer data from Supabase
async function loadFromSupabase() {
  const { data, error } = await supabase
    .from('customers')  // Replace with your actual table name
    .select('*');

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    customerRecords = data;
    load();  // Update the table with customer data
  }
}

// Save or update customer data in Supabase
async function save() {
  const custName = document.getElementById("custName");
  const passport = document.getElementById("passport");
  const status = document.getElementById("status");
  const ticketFile = document.getElementById("ticketFile");

  const name = custName.value.trim();
  const pass = passport.value.trim().toUpperCase();

  if (!name || !pass) {
    alert("Please fill in all required fields.");
    return;
  }

  let ticketUrl = null;

  // If there's a file selected, upload it to Supabase storage
  if (ticketFile.files.length > 0) {
    const file = ticketFile.files[0];
    const { data, error: uploadError } = await supabase.storage
      .from('Tickets')  // Updated to your "Tickets" storage bucket name
      .upload(`tickets/${file.name}`, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }

    ticketUrl = data.Key;  // Store the file URL after upload
  }

  // Prepare customer data object
  const customerData = {
    name,
    passport: pass,
    status: status.value,
    ticket: ticketUrl,  // Store ticket file URL or null if no file
  };

  // Check if we're editing an existing customer
  const isEdit = custName.dataset.editIndex !== undefined;
  if (isEdit) {
    // Edit the existing customer record in Supabase
    const { data, error } = await supabase
      .from('customers')
      .upsert([customerData]);

    if (error) {
      console.error('Error saving data:', error);
    }
  } else {
    // Insert a new customer record into Supabase
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData]);

    if (error) {
      console.error('Error saving data:', error);
    }
  }

  // Clear input fields after saving
  custName.value = '';
  passport.value = '';
  ticketFile.value = '';

  // Reload customer data from Supabase after saving
  loadFromSupabase();
}

// Load customer data into the table
async function load() {
  const recordsTable = document.getElementById("records");

  // Clear existing rows
  recordsTable.innerHTML = "";

  if (customerRecords.length === 0) {
    recordsTable.innerHTML = "<tr><td colspan='5'>No records found</td></tr>";
    return;
  }

  // Populate the table with customer records
  recordsTable.innerHTML = customerRecords.map((c, index) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.passport}</td>
      <td class="status-${c.status.replace(/\s/g, '\\ ')}">${c.status}</td>
      <td>
        ${c.status === 'Ticket Issued' && c.ticket ? `<a href="https://wneingzbhbluvcndyhrq.supabase.co/storage/v1/object/public/Tickets/${c.ticket}" target="_blank">Download</a>` : '-'}
      </td>
      <td>
        <button onclick="editCustomer(${index})">Edit</button>
        <button onclick="deleteCustomer(${index})">Delete</button>
      </td>
    </tr>
  `).join("");
}

// Edit customer data (for updating)
function editCustomer(index) {
  const customer = customerRecords[index];

  // Pre-fill the input fields with the existing data
  document.getElementById("custName").value = customer.name;
  document.getElementById("passport").value = customer.passport;
  document.getElementById("status").value = customer.status;

  // Mark as editing
  document.getElementById("custName").dataset.editIndex = index;
}

// Delete customer record from Supabase
async function deleteCustomer(index) {
  const customer = customerRecords[index];
  if (confirm(`Are you sure you want to delete customer ${customer.name}?`)) {
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .match({ id: customer.id });  // Assuming 'id' is the primary key of the table
    if (error) {
      console.error('Error deleting customer:', error);
    } else {
      loadFromSupabase();  // Reload the table after deletion
    }
  }
}

// Search customer status from the database
async function search() {
  const searchName = document.getElementById("searchName");
  const searchPassport = document.getElementById("searchPassport");

  const n = searchName.value.toLowerCase();
  const p = searchPassport.value.toUpperCase();

  const customer = customerRecords.find(c => c.name.toLowerCase() === n && c.passport === p);

  if (customer) {
    const popup = document.getElementById("popup");
    const ticketStatus = document.getElementById("ticketStatus");
    const downloadLink = document.getElementById("downloadLink");

    popup.style.display = "block";
    ticketStatus.innerText = "Status: " + customer.status;

    // If ticket is issued and exists, show the download link
    if (customer.status === "Ticket Issued" && customer.ticket) {
      downloadLink.href = `https://wneingzbhbluvcndyhrq.supabase.co/storage/v1/object/public/Tickets/${customer.ticket}`;
      downloadLink.download = customer.ticket;
      downloadLink.style.display = "inline-block";
    } else {
      downloadLink.style.display = "none";
    }
  } else {
    alert("No record found");
  }
}

// Toggle menu visibility (mobile menu)
function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

// Show specific sections
function show(id) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("menu").classList.remove("show");
}

// Open location in Google Maps (for the footer address)
function viewMap() {
  const address = "New Seven Star Travel and Tourism, Opposite of City Exchange, 615 Zone 53, Building 85 Umm al Dome North Muaither, Doha, Qatar";
  const url = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
  window.open(url, "_blank");
}

// Real-time updates for customer records (Supabase real-time subscription)
supabase
  .from('customers')
  .on('INSERT', payload => {
    console.log('New customer added:', payload);
    loadFromSupabase();  // Reload data after a new customer is added
  })
  .on('UPDATE', payload => {
    console.log('Customer updated:', payload);
    loadFromSupabase();  // Reload data after a customer is updated
  })
  .on('DELETE', payload => {
    console.log('Customer deleted:', payload);
    loadFromSupabase();  // Reload data after a customer is deleted
  })
  .subscribe();
