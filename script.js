/* ================= FORM SWITCH LOGIC ================= */

const selector = document.getElementById("form_selector");
const headerCard = document.querySelector(".header-card");

const uav = document.getElementById("uav_form");
const item = document.getElementById("item_form");
const deploy = document.getElementById("deploy_form");

const submitBar = document.getElementById("submit_bar");

function hideAll() {
  uav.classList.add("hidden");
  item.classList.add("hidden");
  deploy.classList.add("hidden");
  // hide any form action bars
  document.querySelectorAll('.form-actions').forEach(el => el.classList.add('hidden'));
}

function backToSelector() {
  hideAll();
  headerCard.classList.remove("hidden");
  selector.value = "";
  submitBar.classList.add("hidden");
}

selector.addEventListener("change", () => {
  hideAll();
  
  // Hide form selector
  if (selector.value) {
    headerCard.classList.add("hidden");
  }

  if (selector.value === "UAV") uav.classList.remove("hidden");
  if (selector.value === "ITEM") item.classList.remove("hidden");
  if (selector.value === "DEPLOY") deploy.classList.remove("hidden");

  // show the action bar inside the opened form
  if (selector.value === "UAV") {
    const fa = uav.querySelector('.form-actions'); if (fa) fa.classList.remove('hidden');
  } else if (selector.value === "ITEM") {
    const fa = item.querySelector('.form-actions'); if (fa) fa.classList.remove('hidden');
  } else if (selector.value === "DEPLOY") {
    const fa = deploy.querySelector('.form-actions'); if (fa) fa.classList.remove('hidden');
  }

  // Function to generate Request ID
  function generateRequestId(prefix) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${prefix}-${day}${month}${year}${hours}${minutes}${seconds}${milliseconds}`;
  }

  // Auto-fill Request Date with today's date
  const today = new Date().toISOString().split('T')[0];
  
  if (selector.value === "UAV") {
    document.getElementById("uav_request_date").value = today;
    document.getElementById("uav_request_id").value = generateRequestId("UAV");
  } else if (selector.value === "ITEM") {
    document.getElementById("item_request_date").value = today;
    document.getElementById("item_request_id").value = generateRequestId("RIR");
  } else if (selector.value === "DEPLOY") {
    document.getElementById("deploy_request_date").value = today;
    document.getElementById("deploy_request_id").value = generateRequestId("NDR");
  }
});

/* ================= GOOGLE SHEET CONFIG ================= */

const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkj_95QeAoWu2vS2yFfjfaFyG3V4cjf3CdQyBo5zqTyDDYy8tA_NnYM2YWc_2jJh7mrIwpkVdirUmM/pub?gid=168673912&single=true&output=csv";

// Main issue sheet (user-provided)
const MAIN_ISSUE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkj_95QeAoWu2vS2yFfjfaFyG3V4cjf3CdQyBo5zqTyDDYy8tA_NnYM2YWc_2jJh7mrIwpkVdirUmM/pub?gid=143833453&single=true&output=csv";

let mainIssueCache = [];

async function loadMainIssueSheetData() {
  if (mainIssueCache.length > 0) return mainIssueCache;

  const response = await fetch(MAIN_ISSUE_SHEET_CSV_URL);
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });

  mainIssueCache = parsed.data;
  console.log("✅ Main Issue Sheet Loaded", mainIssueCache.length, "rows");
  return mainIssueCache;
}

/* ================= CSV LOAD (PAPAPARSE) ================= */

let sheetDataCache = [];

async function loadGoogleSheetData() {
  if (sheetDataCache.length > 0) return sheetDataCache;

  const response = await fetch(GOOGLE_SHEET_CSV_URL);
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });

  sheetDataCache = parsed.data;

  console.log("✅ Google Sheet Loaded");
  console.log("Headers:", Object.keys(sheetDataCache[0]));
  console.log("First Row:", sheetDataCache[0]);

  return sheetDataCache;
}

/* ================= AUTO-FILL USING TICKET ID ================= */

const ticketInput = document.getElementById("ticket_id");
console.log("Ticket input element:", ticketInput);

ticketInput.addEventListener("change", async () => {
  const ticketId = ticketInput.value;
  if (!ticketId) return;

  const data = await loadGoogleSheetData();

  const normalize = v =>
    String(v).replace(".0", "").trim();

  const match = data.find(row => {
    // dynamically find Ticket ID column
    const ticketKey = Object.keys(row).find(
      k => k.replace(/\s+/g, "").toLowerCase() === "ticketid"
    );

    if (!ticketKey) return false;

    return normalize(row[ticketKey]) === normalize(ticketId);
  });

  if (!match) {
    alert("❌ Ticket ID not found");
    return;
  }

  console.log("🎯 MATCH FOUND:", match);
  // --- Capture Issue ID from the ticket row (if present) ---
  const ticketHeaders = Object.keys(match || {});
  console.log("📋 Ticket row headers:", ticketHeaders);

  const findTicketIssueKey = headers => {
    const normalized = h => h.replace(/\s+/g, "").toLowerCase();
    const excludeIf = h => /date|time|created|timestamp/.test(normalized(h));

    const candidates = [
      "issue id",
      "issueid",
      "issue number",
      "issue_no",
      "issue#",
      "issue"
    ];

    // Prefer exact/close matches first
    for (const c of candidates) {
      const found = headers.find(h => normalized(h) === c || normalized(h).includes(c));
      if (found && !excludeIf(found)) return found;
    }

    // fallback: any header containing 'issue' but not date-like
    const fallback = headers.find(h => normalized(h).includes("issue") && !excludeIf(h));
    return fallback;
  };

  const issueKey = findTicketIssueKey(ticketHeaders);
  console.log("🔑 Selected Issue ID column:", issueKey);

  if (issueKey && match[issueKey]) {
    const lastIssueId = normalize(match[issueKey]);
    console.log("Using ticket sheet column for Issue ID:", issueKey);
    console.log("Column value (raw):", match[issueKey]);
    console.log("Column value (normalized):", lastIssueId);
    // Attempt main-issue lookup in the secondary sheet to populate component names
    console.log("Looking up Issue ID in main-issue sheet:", lastIssueId);

    // Load the main-issue mapping sheet and look up by Issue ID column (robust)
    try {
      const mainData = await loadMainIssueSheetData();
      if (!mainData || mainData.length === 0) {
        console.log("⚠️ Main issue sheet is empty or unavailable");
      } else {
        const mainHeaders = Object.keys(mainData[0] || {});
        console.log("Main sheet headers:", mainHeaders);

        const findHeader = keys => {
          return mainHeaders.find(h => {
            const k = h.replace(/\s+/g, "").toLowerCase();
            return keys.some(t => k === t || k.includes(t));
          });
        };

        // For Issue ID, prefer exact match "Issue ID"
        const mainSheetIssueKey = mainHeaders.find(h => {
          const k = h.replace(/\s+/g, "").toLowerCase();
          return k === "issueid" || k === "issue id";
        }) || mainHeaders.find(h => h.toLowerCase().includes("issue id")) || mainHeaders[0];
        
        // For Main Issue, search for "Main Issue"
        const mainIssueColumnKey = mainHeaders.find(h => {
          const k = h.toLowerCase();
          return k === "main issue" || k.includes("main issue");
        }) || mainHeaders.find(h => h.toLowerCase().includes("main")) || mainHeaders[1] || mainHeaders[0];

        console.log("Main sheet Issue ID column:", mainSheetIssueKey);
        console.log("Main sheet Main Issue column:", mainIssueColumnKey);
        console.log("Sample values from Issue ID column:", mainData.slice(0, 5).map(row => row[mainSheetIssueKey]));

        // helper to compare normalized values more flexibly
        const normalizeSafe = v => String(v || "").replace(/\.0$/, "").trim();
        const digitsOnly = s => String(s || "").replace(/\D+/g, "");

        // try exact match first
        let mainMatch = mainData.find(row => normalizeSafe(row[mainSheetIssueKey]) === lastIssueId);
        console.log("Exact match attempt: looking for '" + lastIssueId + "' in column '" + mainSheetIssueKey + "'");

        // try contains
        if (!mainMatch) {
          mainMatch = mainData.find(row => String(row[mainSheetIssueKey] || "").includes(lastIssueId));
        }

        // try digits-only comparison
        if (!mainMatch) {
          const targetDigits = digitsOnly(lastIssueId);
          if (targetDigits) {
            mainMatch = mainData.find(row => digitsOnly(row[mainSheetIssueKey]) === targetDigits);
          }
        }

        if (mainMatch) {
          const mainIssueValue = String(mainMatch[mainIssueColumnKey] || "").trim();
          const damageEl = document.getElementById("damage_component_name");
          const replaceEl = document.getElementById("replace_component_name");
          if (damageEl) damageEl.value = mainIssueValue;
          if (replaceEl) replaceEl.value = mainIssueValue;
          console.log("🔁 Populated component names from main issue:", mainIssueValue, "(from column:", mainIssueColumnKey, ")");
        } else {
          console.log("⚠️ No mapping found in main issue sheet for Issue ID:", lastIssueId);
        }
      }
    } catch (err) {
      console.log("Error loading main issue sheet:", err);
    }
  } else {
    console.log("❌ Issue ID column not found or value is empty");
    console.log("issueKey:", issueKey, "match[issueKey]:", issueKey ? match[issueKey] : "N/A");
  }

  document.getElementById("requester_name").value =
    match["Support exec Assigned"] || "";

  document.getElementById("project_name").value =
    match["Project-ID"] || "";

  document.getElementById("team_name").value =
    match["Team ID"] || "";
  
  document.getElementById("ship_person_name").value =
    match["Operator Name"] || "";

  document.getElementById("ship_contact").value =
    match["Phone Number"] || "";

  const flightId = match["Combine Flight_ID"] || "";

  document.getElementById("drone_type").value =
    flightId.substring(0, 3);

  document.getElementById("drone_id").value =
    flightId.substring(0, 6);
});

/* ================= SUBMIT HANDLER (delegated) ================= */

function handleSubmit() {
  let payload = {
    form_type: selector.value,
    submitted_at: new Date().toISOString(),
    data: {}
  };

  /* ---------- UAV FORM ---------- */
  if (selector.value === "UAV") {
    payload.data = {
      request_id: document.getElementById("uav_request_id").value,
      request_date: document.getElementById("uav_request_date").value,
      requesting_person: document.getElementById("uav_requesting_person").value,
      item_required: document.getElementById("uav_item_required").value,
      quantity: document.getElementById("uav_quantity").value,
      return_date: document.getElementById("uav_return_date").value
    };
  }

  /* ---------- ITEM FORM ---------- */
  if (selector.value === "ITEM") {
    payload.data = {
      issue_id: window.lastIssueId || "",
      request_id: document.getElementById("item_request_id").value,
      request_date: document.getElementById("item_request_date").value,
      ticket_id: document.getElementById("ticket_id").value,
      requester_name: document.getElementById("requester_name").value,
      project_name: document.getElementById("project_name").value,
      team_name: document.getElementById("team_name").value,

      drone_type: document.getElementById("drone_type").value,
      drone_id: document.getElementById("drone_id").value,

      damage_component_name: document.getElementById("damage_component_name").value,
      damage_component_type: document.getElementById("damage_component_type").value,
      damage_component_id: document.getElementById("damage_component_id").value,

      replace_component_name: document.getElementById("replace_component_name").value,
      replace_component_type: document.getElementById("replace_component_type").value,
      replace_quantity: document.getElementById("replace_quantity").value,

      ship_person_name: document.getElementById("ship_person_name").value,
      ship_contact: document.getElementById("ship_contact").value,
      ship_location: document.getElementById("ship_location").value,
      ship_expected_date: document.getElementById("ship_expected_date").value
    };
  }

  /* ---------- DEPLOY FORM ---------- */
  if (selector.value === "DEPLOY") {
    payload.data = {
      request_id: document.getElementById("deploy_request_id").value,
      request_date: document.getElementById("deploy_request_date").value,
      requesting_person: document.getElementById("deploy_requesting_person").value,
      project_name: document.getElementById("deploy_project_name").value,
      team_name: document.getElementById("deploy_team_name").value,
      drone_type: document.getElementById("deploy_drone_type").value,
      camera_type: document.getElementById("deploy_camera_type").value,
      lens_type: document.getElementById("deploy_lens_type").value,
      quantity: document.getElementById("deploy_quantity").value,

      ship_person_name: document.getElementById("deploy_ship_person_name").value,
      ship_contact: document.getElementById("deploy_ship_contact").value,
      ship_location: document.getElementById("deploy_ship_location").value,
      ship_expected_date: document.getElementById("deploy_ship_expected_date").value
    };
  }

  console.log("✅ SUBMITTED PAYLOAD:", payload);

  // Get the request ID based on form type
  let requestId = "";
  if (selector.value === "UAV") {
    requestId = document.getElementById("uav_request_id").value;
  } else if (selector.value === "ITEM") {
    requestId = document.getElementById("item_request_id").value;
  } else if (selector.value === "DEPLOY") {
    requestId = document.getElementById("deploy_request_id").value;
  }

  // Hide all forms and header
  hideAll();
  headerCard.classList.add("hidden");

  // Show success message
  const successMessage = document.getElementById("success_message");
  document.getElementById("success_request_id").innerText = requestId;
  successMessage.classList.remove("hidden");
}

// Delegated click handler for form action buttons
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target.classList.contains('submit-btn')) {
    handleSubmit();
  }
  if (target.classList.contains('back-btn')) {
    backToSelector();
  }
});
