const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "resource-hub.db");

function scrypt(password, salt) {
  return crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
}

function hash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { hash: scrypt(password, salt), salt };
}

function now() { return new Date().toISOString(); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function dateIn(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function genId(prefix) { return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function seed() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Remove old DB if exists
  try { fs.unlinkSync(DB_PATH); } catch (_) {}

  // Apply migrations
  const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of sqlFiles) {
    try {
      db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
    } catch (_) {}
  }

  const t = now;

  const saHash = hash("password");
  const admHash = hash("password");
  const mgrHash = hash("password");
  const empHash = hash("password");

  const userNames = [
    "Super Admin", "IT Admin", "Rina Wijaya", "Budi Santoso", "Auditor Internal", "Procurement Officer",
    "Dewi Lestari", "Alex Chandra", "Andi Pratama", "Siti Nurhaliza", "Rudi Hartono", "Maya Dewi",
    "Dika Saputra", "Putri Anggraini", "Hendra Gunawan", "Ratna Sari", "Irfan Hakim", "Dewa Putra",
    "Lina Marlina", "Fajar Nugroho",
  ];
  const userEmails = [
    "superadmin@example.com", "admin@example.com", "manager@example.com",
    "employee@example.com", "auditor@example.com", "procurement@example.com",
    "dewi@example.com", "alex@example.com", "andi@example.com", "siti@example.com",
    "rudi@example.com", "maya@example.com", "dika@example.com", "putri@example.com",
    "hendra@example.com", "ratna@example.com", "irfan@example.com", "dewa@example.com",
    "lina@example.com", "fajar@example.com",
  ];
  const userRoles = [
    "super_admin", "admin_it", "manager", "employee", "auditor", "procurement",
    "employee", "employee", "employee", "employee", "employee",
    "employee", "employee", "employee", "employee", "employee",
    "employee", "employee", "employee", "employee",
  ];
  const userDepts = [
    null, "dep_it", "dep_sales", "dep_sales", "dep_hr", "dep_it",
    "dep_fin", "dep_mkt", "dep_ops", "dep_mkt", "dep_legal",
    "dep_hr", "dep_it", "dep_fin", "dep_ops", "dep_sales",
    "dep_mkt", "dep_it", "dep_hr", "dep_legal",
  ];
  const userJobs = [
    "Super Admin", "IT Administrator", "Sales Manager", "Sales Executive", "HR Specialist", "Frontend Engineer",
    "Accountant", "Marketing Specialist", "Ops Coordinator", "Content Writer", "Legal Associate",
    "HR Generalist", "Backend Engineer", "Finance Analyst", "Warehouse Lead", "Sales Representative",
    "SEO Specialist", "DevOps Engineer", "People Partner", "Compliance Officer",
  ];

  const insertUser = db.prepare(`INSERT OR REPLACE INTO users (id, name, email, password_hash, password_salt, role, department_id, job_title, status, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const users = [];
  for (let i = 0; i < 20; i++) {
    const h = empHash;
    const id = i < 6 ? `usr_${["superadmin","admin","manager","employee","auditor","procurement"][i]}` : genId("usr");
    users.push({ id, email: userEmails[i], role: userRoles[i], department_id: userDepts[i] });
    insertUser.run(id, userNames[i], userEmails[i], h.hash, h.salt, userRoles[i], userDepts[i], userJobs[i], "active", i < 2 ? t() : null, t(), t());
  }

  const departments = [
    { id: "dep_it", department_code: "IT", department_name: "Information Technology", description: "IT Infrastructure & Support", status: "active", created_at: t(), updated_at: t() },
    { id: "dep_sales", department_code: "SLS", department_name: "Sales", description: "Sales & Business Development", status: "active", created_at: t(), updated_at: t() },
    { id: "dep_hr", department_code: "HR", department_name: "Human Resources", description: "People & Culture", status: "active", created_at: t(), updated_at: t() },
    { id: "dep_fin", department_code: "FIN", department_name: "Finance", description: "Accounting & Finance", status: "active", created_at: t(), updated_at: t() },
    { id: "dep_mkt", department_code: "MKT", department_name: "Marketing", description: "Brand & Digital Marketing", status: "active", created_at: t(), updated_at: t() },
    { id: "dep_ops", department_code: "OPS", department_name: "Operations", description: "Supply Chain & Logistics", status: "active", created_at: t(), updated_at: t() },
    { id: "dep_legal", department_code: "LGL", department_name: "Legal", description: "Legal & Compliance", status: "active", created_at: t(), updated_at: t() },
  ];
  const insertDept = db.prepare(`INSERT INTO departments (id, department_code, department_name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const d of departments) insertDept.run(d.id, d.department_code, d.department_name, d.description, d.status, d.created_at, d.updated_at);

  const locations = [
    { id: "loc_hq", location_name: "Head Office", branch_name: "Jakarta", building: "Tower A", floor: "12", room: "1201", notes: "", created_at: t(), updated_at: t() },
    { id: "loc_branch", location_name: "Branch Office", branch_name: "Bandung", building: "Main", floor: "3", room: "301", notes: "", created_at: t(), updated_at: t() },
    { id: "loc_remote", location_name: "Remote", branch_name: "Distributed", building: "", floor: "", room: "", notes: "Work from home", created_at: t(), updated_at: t() },
    { id: "loc_sby", location_name: "Hub Surabaya", branch_name: "Surabaya", building: "Menara Graha", floor: "5", room: "502", notes: "", created_at: t(), updated_at: t() },
    { id: "loc_dc", location_name: "Data Center", branch_name: "Jakarta", building: "DC Building", floor: "G", room: "Rack B12", notes: "Tier 3 facility, biometric access only", created_at: t(), updated_at: t() },
  ];
  const insertLoc = db.prepare(`INSERT INTO locations (id, location_name, branch_name, building, floor, room, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const l of locations) insertLoc.run(l.id, l.location_name, l.branch_name, l.building, l.floor, l.room, l.notes, l.created_at, l.updated_at);

  const categories = [
    { id: "cat_laptop", category_name: "Laptop", description: "Portable computers", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_monitor", category_name: "Monitor", description: "Display screens", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_keyboard", category_name: "Keyboard", description: "Input devices", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_mouse", category_name: "Mouse", description: "Pointing devices", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_printer", category_name: "Printer", description: "Printing devices", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_server", category_name: "Server", description: "Server hardware", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_phone", category_name: "Mobile Phone", description: "Smartphones", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_desktop", category_name: "Desktop", description: "Desktop workstations", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_headset", category_name: "Headset", description: "Audio devices", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_webcam", category_name: "Webcam", description: "Video conferencing cameras", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_tablet", category_name: "Tablet", description: "Tablet devices", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_router", category_name: "Router", description: "Network routers", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_switch", category_name: "Switch", description: "Network switches", status: "active", created_at: t(), updated_at: t() },
    { id: "cat_ap", category_name: "Access Point", description: "Wireless access points", status: "active", created_at: t(), updated_at: t() },
  ];
  const insertCat = db.prepare(`INSERT INTO categories (id, category_name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const c of categories) insertCat.run(c.id, c.category_name, c.description, c.status, c.created_at, c.updated_at);

  const catPools = {
    cat_laptop: { brands: ["Apple","Dell","Lenovo","HP","Asus"], models:["MacBook Pro 14\"","MacBook Air 15\"","XPS 15","Latitude 5540","ThinkPad X1 Carbon","ThinkPad T14s","EliteBook 840 G10","Zenbook 14X","Precision 5680","ProBook 450 G10"], prices: [35000000,22000000,28000000,18000000,32000000,25000000,20000000,16000000,38000000,14000000] },
    cat_monitor: { brands: ["Dell","LG","Samsung","Asus","BenQ"], models:["U2724H","U3223QE","27UN880-B","32UN650","ViewFinity S8","Odyssey G7","ProArt PA278","DesignVue PD2705U","GW2790","EW3270U"], prices: [5500000,12000000,7500000,8500000,9000000,11000000,7000000,6500000,3000000,10000000] },
    cat_keyboard: { brands: ["Logitech","Keychron","Ducky","Razer","Apple"], models:["MX Keys S","K380","K3 Pro","Q1 Pro","One 3","Huntsman V3","Magic Keyboard","G915","K10 Pro","V1 Max"], prices: [2200000,800000,1800000,2800000,2000000,3500000,2200000,3200000,1500000,1600000] },
    cat_mouse: { brands: ["Logitech","Razer","Apple","Microsoft","Corsair"], models:["MX Master 3S","G Pro X","DeathAdder V3","Magic Mouse","Sculpt Ergonomic","Ironclaw","M720 Triathlon","Basilisk V3","MX Anywhere 3","Naga V2"], prices: [1800000,2200000,1500000,1700000,800000,1200000,900000,1600000,1400000,1800000] },
    cat_desktop: { brands: ["Dell","HP","Lenovo","Apple","Intel"], models:["OptiPlex 7010","EliteDesk 800 G9","ThinkCentre M90q","Mac Mini M2","NUC 13 Pro","Precision 3660","ProDesk 600 G9","IdeaCentre AIO","Z2 Mini G9","Studio XPS"], prices: [15000000,17000000,13000000,11000000,8000000,25000000,12000000,14000000,30000000,22000000] },
    cat_server: { brands: ["Dell","HPE","Lenovo","Supermicro","Cisco"], models:["PowerEdge R750","PowerEdge R650","ProLiant DL380 Gen11","ThinkSystem SR650","SuperServer 2029","UCS C220 M7","ProLiant ML350","ThinkSystem SR250","PowerEdge T550","HyperFlex HX220c"], prices: [125000000,95000000,145000000,110000000,85000000,135000000,100000000,75000000,60000000,120000000] },
    cat_printer: { brands: ["HP","Canon","Epson","Brother","Xerox"], models:["LaserJet Pro M404dn","LaserJet MFP M283fdw","imageRUNNER C3525i","EcoTank L15150","HL-L2350DW","VersaLink C405","PIXMA TR8620a","SureColor P700","WorkForce Pro","i-SENSYS MF455"], prices: [8500000,12000000,25000000,11000000,4000000,18000000,4500000,15000000,9500000,7500000] },
    cat_phone: { brands: ["Samsung","Apple","Google","Xiaomi","OnePlus"], models:["Galaxy S24 Ultra","Galaxy Z Fold 6","iPhone 15 Pro","iPhone 15","Pixel 8 Pro","Pixel 7a","13T Pro","Redmi Note 13","OnePlus 12","Galaxy A55"], prices: [22000000,28000000,20000000,14000000,16000000,6000000,8000000,3000000,12000000,5000000] },
    cat_headset: { brands: ["Jabra","Sony","Logitech","Poly","JBL"], models:["Evolve2 65","Evolve 40","WH-1000XM5","Zone Wireless 2","Voyager Focus 2","Blackwire 5220","Quantum 910","Elite 8 Active","Engage 75","Tune 770NC"], prices: [3500000,1800000,4500000,2800000,3800000,1200000,2200000,3000000,3200000,900000] },
    cat_webcam: { brands: ["Logitech","Razer","Microsoft","Anker","Elgato"], models:["Brio 4K","C920s","Kiyo Pro","LifeCam Studio","PowerConf C300","FaceCam Pro","StreamCam","C930e","Kiyo X","Meet 4K"], prices: [2500000,1200000,2800000,900000,1400000,3200000,1800000,1000000,1700000,2200000] },
    cat_tablet: { brands: ["Apple","Samsung","Microsoft","Lenovo","Xiaomi"], models:["iPad Air","iPad Pro 12.9\"","Galaxy Tab S9 Ultra","Surface Pro 9","Tab P12 Pro","Pad 6 Pro","Galaxy Tab S9 FE","iPad 10.9\"","Surface Go 4","Tab Extreme"], prices: [9000000,20000000,16000000,18000000,7000000,5000000,6000000,6500000,8000000,12000000] },
    cat_router: { brands: ["Cisco","MikroTik","Ubiquiti","TP-Link","Fortinet"], models:["ISR 4331","CCR2004","Dream Machine Pro","ER8411","FortiGate 60F","ISR 4321","CCR1072","UXG-Pro","ER707-M2","FortiGate 100F"], prices: [35000000,12000000,8000000,4500000,10000000,25000000,35000000,7000000,3000000,18000000] },
    cat_switch: { brands: ["Cisco","Ubiquiti","Netgear","Aruba","TP-Link"], models:["SG350-28","USW-Pro-48","GS752TP","Instant On 1930","JetStream TL-SG3428","Catalyst 9200L","USW-Enterprise-24","M4300-96X","Instant On 1960","Omada SG2428P"], prices: [12000000,8000000,6500000,7000000,4000000,22000000,14000000,35000000,8500000,3500000] },
    cat_ap: { brands: ["Ubiquiti","Aruba","TP-Link","Cisco","Ruckus"], models:["U6-Pro","U6-LR","Instant On AP22","EAP670","Catalyst 9130","EAP610","R550","Instant On AP17","U6-Enterprise","EAP660 HD"], prices: [2500000,3500000,2000000,1800000,12000000,1500000,8000000,1200000,4500000,2500000] },
  };

  const catCounts = {
    cat_laptop: 60, cat_monitor: 35, cat_keyboard: 25, cat_mouse: 25,
    cat_desktop: 15, cat_server: 10, cat_printer: 10, cat_phone: 20,
    cat_headset: 10, cat_webcam: 10, cat_tablet: 10,
    cat_router: 8, cat_switch: 7, cat_ap: 5,
  };

  const statusWeighted = ["available","available","available","available","assigned","assigned","assigned","assigned","in_repair","retired","retired","lost","disposed"];
  const conditions = ["new","good","good","good","fair","fair","damaged"];
  const locIds = locations.map(l => l.id);
  const adminUserIds = users.filter(u => u.role === "super_admin" || u.role === "admin_it").map(u => u.id);
  const allActiveUserIds = users.map(u => u.id);

  const insertAsset = db.prepare(`INSERT INTO assets (id, asset_code, asset_name, category_id, brand, model, serial_number, condition, status, purchase_date, purchase_price, warranty_end_date, warranty_note, location_id, assigned_user_id, assigned_department_id, cost_center, notes, qr_code_value, image_url, specifications, created_by, updated_by, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTxn = db.prepare(`INSERT INTO asset_transactions (id, asset_id, transaction_type, from_user_id, to_user_id, from_department_id, to_department_id, from_location_id, to_location_id, condition_before, condition_after, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const assets = [];
  const asset_transactions = [];
  let assetCounter = 0;

  const insertMany = db.transaction(() => {
    for (const [catId, count] of Object.entries(catCounts)) {
      const pool = catPools[catId];
      for (let i = 0; i < count; i++) {
        assetCounter++;
        const idx = rand(0, pool.brands.length - 1);
        const brand = pool.brands[idx];
        const model = pool.models[idx];
        const price = pool.prices[idx];
        const status = pick(statusWeighted);
        const condition = status === "retired" || status === "lost" ? "damaged" : pick(conditions);
        const purchaseDaysAgo = rand(30, 900);
        const purchaseDate = daysAgo(purchaseDaysAgo).split("T")[0];
        const warrantyDays = rand(180, 1095);
        const warrantyEnd = dateIn(warrantyDays - purchaseDaysAgo);
        const locId = pick(locIds);
        const createdBy = pick(adminUserIds);

        let assignedUser = null;
        let assignedDept = null;
        if (status === "assigned" || status === "in_repair") {
          assignedUser = pick(allActiveUserIds);
          const u = users.find(x => x.id === assignedUser);
          assignedDept = u?.department_id ?? null;
        }

        const assetId = genId("ast");
        const assetCode = `AST-${(2000 + rand(20, 24)).toString()}-${String(assetCounter).padStart(4, "0")}`;
        const serialNum = `SN-${brand.substring(0,3).toUpperCase()}-${String(assetCounter).padStart(3, "0")}`;

        insertAsset.run(
          assetId, assetCode, `${brand} ${model}`, catId, brand, model, serialNum,
          condition, status, purchaseDate, price,
          warrantyEnd.includes("NaN") ? dateIn(365) : warrantyEnd,
          rand(1, 3) === 1 ? ["AppleCare+","Dell ProSupport","HP Care Pack","Standard"][rand(0,3)] : null,
          locId, assignedUser, assignedDept, assignedDept ?? null,
          ["", "", "", "Upgraded to SSD", "Incl. docking station", "Original box kept", ""][rand(0,6)],
          genId("QR"), null, null, createdBy, createdBy,
          daysAgo(purchaseDaysAgo), daysAgo(rand(1, purchaseDaysAgo)), null
        );

        assets.push({ id: assetId, status, assigned_user_id: assignedUser });
      }
    }
  });

  insertMany();

  const insertTxnBatch = db.transaction(() => {
    let assetCounter2 = 0;
    for (const [catId, count] of Object.entries(catCounts)) {
      const pool = catPools[catId];
      for (let i = 0; i < count; i++) {
        const asset = assets[assetCounter2++];
        const idx = rand(0, pool.brands.length - 1);
        const purchaseDaysAgo = rand(30, 900);
        const createdBy = pick(adminUserIds);
        const condition = pick(["new","good","good","good","fair","fair","damaged"]);
        const locId = pick(locIds);

        const txnDate = daysAgo(purchaseDaysAgo);
        insertTxn.run(genId("txn"), asset.id, "create", null, null, null, null, null, locId, null, condition, "Asset created", createdBy, txnDate);
        asset_transactions.push({ asset_id: asset.id, created_at: txnDate, transaction_type: "create", notes: "Asset created", created_by: createdBy });

        if (asset.assigned_user_id) {
          const assignDate = daysAgo(rand(1, purchaseDaysAgo - 1));
          const assignedDept = users.find(u => u.id === asset.assigned_user_id)?.department_id ?? null;
          insertTxn.run(genId("txn"), asset.id, "assign", null, asset.assigned_user_id, null, assignedDept, locId, locId, condition, condition, "Assigned to user", createdBy, assignDate);
          asset_transactions.push({ asset_id: asset.id, created_at: assignDate, transaction_type: "assign", notes: "Assigned to user", created_by: createdBy });
        }

        if (asset.status === "retired" || asset.status === "lost" || asset.status === "disposed") {
          insertTxn.run(genId("txn"), asset.id, "update", asset.assigned_user_id, null, null, null, locId, locId, condition, "damaged", `Asset ${asset.status}`, createdBy, daysAgo(rand(1, 30)));
          asset_transactions.push({ asset_id: asset.id, created_at: daysAgo(rand(1, 30)), transaction_type: "update", notes: `Asset ${asset.status}`, created_by: createdBy });
        }
      }
    }
  });
  insertTxnBatch();

  const requestStatuses = ["pending_approval","pending_approval","pending_approval","pending_approval","pending_approval","draft","draft","draft","approved","approved","approved","rejected","rejected","in_progress","completed","cancelled"];
  const requestTypes = ["new_asset","new_asset","new_asset","replacement","temporary_loan","return","repair"];
  const priorities = ["high","high","medium","medium","medium","medium","low","low"];
  const requestTitles = [
    "New laptop for new hire", "Upgrade monitor to 4K", "Replacement keyboard needed",
    "Additional monitor for productivity", "Borrow projector for presentation", "Repair broken printer",
    "New phone for field team", "Request standing desk adapter", "Upgrade RAM for workstation",
    "Replace aging server hardware", "Temporary loan iPad for event", "Returning equipment after project",
    "New headset for call center", "Request ergonomic mouse", "Need external SSD for backup",
    "Repair flickering display", "New tablet for inspection team", "Return MacBook after contract",
    "Borrow camera for documentation", "Replace faulty network switch",
    "New router for branch office", "Upgrade access points Wi-Fi 6E", "Request USB-C hub",
    "Replace damaged laptop screen", "Need extra charger for home", "Borrow keyboard for testing",
    "New desktop for reception", "Repair printer paper jam", "Request dual monitor arm",
    "Return headset after trial",
  ];

  const insertReq = db.prepare(`INSERT INTO requests (id, request_code, requester_id, request_type, asset_category_id, asset_id, title, description, priority, status, reason, required_date, approved_by, approved_at, rejected_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const usedReqCodes = new Set();
  for (let i = 0; i < 30; i++) {
    const status = requestStatuses[i] || pick(requestStatuses);
    const type = pick(requestTypes);
    const requesterIdx = rand(2, 19);
    const requester = users[requesterIdx];
    let code;
    do { code = `REQ-${rand(1000, 9999)}`; } while (usedReqCodes.has(code));
    usedReqCodes.add(code);

    const createdDays = rand(1, 30);
    const approvedBy = ["approved","rejected","in_progress","completed"].includes(status) ? pick(adminUserIds) : null;
    const approvedAt = approvedBy ? daysAgo(rand(1, createdDays - 1)) : null;

    insertReq.run(
      genId("req"), code, requester.id, type,
      rand(1, 2) === 1 ? pick(categories).id : null, null,
      requestTitles[i] || `Request for ${pick(categories).category_name}`,
      ["Urgent need for department operations.","Budget has been approved.","Current equipment failing.","Standard office setup needed.","Project requirement by Q4.","Replacement cycle due."][rand(0,5)],
      pick(priorities), status,
      status === "rejected" ? ["Budget constraint","Not priority","Alternative available","Delayed for review"][rand(0,3)] : "",
      dateIn(rand(1, 60)), approvedBy, approvedAt,
      status === "rejected" ? ["Budget not available for this quarter.","Existing equipment can fulfill the need.","Please resubmit with cost analysis.","Vendor contract pending renewal."][rand(0,3)] : "",
      daysAgo(createdDays), daysAgo(rand(0, createdDays))
    );
  }

  const maintenanceStatuses = ["open","open","open","in_progress","in_progress","in_progress","in_progress","waiting_vendor","waiting_vendor","waiting_vendor","resolved","resolved","resolved","closed","closed","closed","open","in_progress","waiting_vendor","resolved"];
  const maintenanceSev = ["low","low","medium","medium","medium","high","high","critical"];
  const maintenanceIssues = [
    "Keyboard replacement needed", "Screen flickering when connected to external display",
    "Battery draining rapidly", "Overheating under load", "Frequent random reboots",
    "USB port not recognizing devices", "Fan making grinding noise", "Trackpad unresponsive",
    "SSD smart failure warning", "Network card dropping connection", "Bluetooth not pairing",
    "Coil whine under load", "Charging port loose", "Display backlight uneven",
    "RAM module reporting errors", "OS corrupted after update", "Power supply failure",
    "Thermal paste dry out", "Dust buildup causing throttling", "CMOS battery dead",
  ];
  const vendors = ["Tech Service Co","Digital Repair Hub","PT Teknologi Solusi","IT Fix Express","Prime Support","", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
  const technicians = ["Hendra","Arief","Slamet","Agus","Wahyu","Dian","Rina","Eko","", "", "", "", "", "", "", "", "", "", "", ""];

  const insertMnt = db.prepare(`INSERT INTO maintenance_logs (id, maintenance_code, asset_id, issue_description, severity, vendor_name, technician_name, cost_estimate, actual_cost, status, started_at, completed_at, notes, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (let i = 0; i < 20; i++) {
    const status = maintenanceStatuses[i] || "open";
    const asset = pick(assets);
    const severity = pick(maintenanceSev);
    const createdDays = rand(2, 90);
    const completedAt = ["resolved","closed"].includes(status) ? daysAgo(rand(1, createdDays - 1)) : null;

    insertMnt.run(
      genId("mnt"), `MNT-${String(i + 1).padStart(4, "0")}`, asset.id,
      maintenanceIssues[i] || pick(maintenanceIssues), severity,
      pick(vendors), pick(technicians),
      rand(1, 3) === 1 ? rand(500000, 8000000) : null,
      ["closed"].includes(status) ? rand(300000, 7000000) : null,
      status, daysAgo(createdDays).split("T")[0],
      completedAt ? completedAt.split("T")[0] : null,
      ["Ordering replacement parts","Waiting for vendor approval","Diagnosing root cause","Scheduled for next maintenance window","Escalated to vendor support"][rand(0,4)],
      pick(adminUserIds), daysAgo(createdDays), daysAgo(rand(0, createdDays))
    );
  }

  const licenses = [
    { id: "lic_001", license_name: "Microsoft 365", license_key: "MS-365-BIZ-2024", vendor: "Microsoft", license_type: "subscription", total_seats: 50, purchase_cost: 7200, purchase_date: "2024-01-15", expiry_date: dateIn(180), description: "Productivity suite for office", status: "active", created_at: t(), updated_at: t() },
    { id: "lic_002", license_name: "Adobe Creative Cloud", license_key: "ACC-ENT-2024", vendor: "Adobe", license_type: "subscription", total_seats: 10, purchase_cost: 3600, purchase_date: "2024-03-01", expiry_date: dateIn(90), description: "Design and video editing tools", status: "active", created_at: t(), updated_at: t() },
    { id: "lic_003", license_name: "Slack", license_key: "", vendor: "Slack", license_type: "subscription", total_seats: 40, purchase_cost: 3200, purchase_date: "2024-02-01", expiry_date: dateIn(365), description: "Team communication platform", status: "active", created_at: t(), updated_at: t() },
    { id: "lic_004", license_name: "Figma Enterprise", license_key: "", vendor: "Figma", license_type: "subscription", total_seats: 15, purchase_cost: 2700, purchase_date: "2024-04-01", expiry_date: dateIn(120), description: "UI/UX design collaboration", status: "active", created_at: t(), updated_at: t() },
    { id: "lic_005", license_name: "GitHub Enterprise", license_key: "GHE-CLOUD-25", vendor: "GitHub", license_type: "subscription", total_seats: 30, purchase_cost: 6300, purchase_date: "2024-01-01", expiry_date: dateIn(200), description: "Source code management & CI/CD", status: "active", created_at: t(), updated_at: t() },
    { id: "lic_006", license_name: "Jira Software", license_key: "", vendor: "Atlassian", license_type: "subscription", total_seats: 25, purchase_cost: 1950, purchase_date: "2024-02-15", expiry_date: dateIn(150), description: "Project management & issue tracking", status: "active", created_at: t(), updated_at: t() },
    { id: "lic_007", license_name: "Notion", license_key: "", vendor: "Notion Labs", license_type: "subscription", total_seats: 35, purchase_cost: 2100, purchase_date: "2024-05-01", expiry_date: dateIn(300), description: "Team workspace & documentation", status: "active", created_at: t(), updated_at: t() },
    { id: "lic_008", license_name: "Google Workspace", license_key: "", vendor: "Google", license_type: "subscription", total_seats: 45, purchase_cost: 5400, purchase_date: "2024-01-01", expiry_date: dateIn(250), description: "Email, drive, and collaboration suite", status: "active", created_at: t(), updated_at: t() },
  ];
  const insertLic = db.prepare(`INSERT INTO licenses (id, license_name, license_key, vendor, license_type, total_seats, purchase_cost, purchase_date, expiry_date, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const l of licenses) insertLic.run(l.id, l.license_name, l.license_key, l.vendor, l.license_type, l.total_seats, l.purchase_cost, l.purchase_date, l.expiry_date, l.description, l.status, l.created_at, l.updated_at);

  // License assignments
  const license_assignments = [];
  const employeeUsers = users.filter((u) => u.role === "employee");
  for (const lic of licenses) {
    const count = rand(1, Math.min(5, lic.total_seats || 5));
    for (let i = 0; i < count; i++) {
      const u = pick(employeeUsers);
      license_assignments.push({
        id: genId("lsa"),
        license_id: lic.id,
        assigned_user_id: u.id,
        assigned_asset_id: null,
        seat_number: String(i + 1),
        allocated_at: daysAgo(rand(10, 60)),
        notes: "",
      });
    }
  }
  const insertLa = db.prepare(`INSERT INTO license_assignments (id, license_id, assigned_user_id, assigned_asset_id, seat_number, allocated_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const la of license_assignments) insertLa.run(la.id, la.license_id, la.assigned_user_id, la.assigned_asset_id, la.seat_number, la.allocated_at, la.notes);

  const insertAudit = db.prepare(`INSERT INTO audit_logs (id, actor_user_id, action_type, entity_type, entity_id, before_json, after_json, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const txn of asset_transactions) {
    insertAudit.run(
      genId("aud"), txn.created_by, `asset.${txn.transaction_type}`, "asset", txn.asset_id,
      null, JSON.stringify({ transaction_type: txn.transaction_type, notes: txn.notes }),
      "127.0.0.1", "Seed Script", txn.created_at
    );
  }

  db.close();

  const totalRec = assets.length + asset_transactions.length + 30 + 20 + asset_transactions.length;
  console.log("====================================");
  console.log("  Seeded SQLite database successfully");
  console.log(`  Assets:             ${assets.length}`);
  console.log(`  Transactions:       ${asset_transactions.length}`);
  console.log(`  Requests:           30`);
  console.log(`  Maintenance:        20`);
  console.log(`  Audit Logs:         ${asset_transactions.length}`);
  console.log(`  Users:              ${users.length}`);
  console.log(`  Departments:        ${departments.length}`);
  console.log(`  Locations:          ${locations.length}`);
  console.log(`  Categories:         ${categories.length}`);
  console.log(`  Licenses:           ${licenses.length}`);
  console.log(`  Total records:      ${totalRec}`);
  console.log("====================================");
  console.log("  Login: admin@example.com / password");
}

seed();
