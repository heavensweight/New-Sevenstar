const ADMIN_EMAIL="Newseven@azim";
const ADMIN_PASS="12345678";
let editIndex=null;

function toggleMenu(){
  document.getElementById("menu").classList.toggle("show");
}

function show(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("menu").classList.remove("show");
}

function login(){
  if(adminEmail.value===ADMIN_EMAIL && adminPassword.value===ADMIN_PASS){
    show("adminPanel");
  }else loginMsg.innerText="Invalid login";
}

function save(){
  const n=custName.value.trim();
  const p=passport.value.trim().toUpperCase();
  if(!n||!p)return;
  let d=JSON.parse(localStorage.getItem("customers")||"[]");

  function saveData(t,tn){
    d.push({name:n,passport:p,status:status.value,ticket:t,tn});
    localStorage.setItem("customers",JSON.stringify(d));
    custName.value=passport.value="";
    load();
  }

  if(ticketFile.files[0]){
    const r=new FileReader();
    r.onload=e=>saveData(e.target.result,ticketFile.files[0].name);
    r.readAsDataURL(ticketFile.files[0]);
  }else saveData(null,null);
}

function load(){
  let d=JSON.parse(localStorage.getItem("customers")||"[]");
  records.innerHTML=d.map(c=>`
    <tr>
      <td>${c.name}</td>
      <td>${c.passport}</td>
      <td class="status-${c.status.replace(/\s/g,'\\ ')}">${c.status}</td>
      <td>${c.ticket?`<a href="${c.ticket}" download="${c.tn}">Download</a>`:"-"}</td>
    </tr>
  `).join("");
}

function search(){
  let n=searchName.value.toLowerCase();
  let p=searchPassport.value.toUpperCase();
  let d=JSON.parse(localStorage.getItem("customers")||"[]");
  let f=d.find(x=>x.name.toLowerCase()===n && x.passport===p);
  if(f){
    popup.style.display="block";
    ticketStatus.innerText="Status: "+f.status;
    if(f.ticket){
      downloadLink.href=f.ticket;
      downloadLink.download=f.tn;
      downloadLink.style.display="inline-block";
    }else downloadLink.style.display="none";
  }else alert("No record found");
}
