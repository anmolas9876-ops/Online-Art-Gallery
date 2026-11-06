const STORAGE = {
    bids: "artGalleryBids",
    submissions: "artGallerySubmissions",
    published: "artGalleryPublished",
    transactions: "artGalleryTransactions"
};
const DEMO_USER = "admin";
const DEMO_PASSWORD = "gallery2026";
const artworks = [
    ["Girl with the Wheat Sheaf", "Clara Whitmore", "Traditional", 1850],
    ["A Quiet Supper", "Elise Beaumont", "Traditional", 2200],
    ["Portrait in Blue", "Mateo Laurent", "Traditional", 3400],
    ["The Grand Salon", "Beatrice Moreau", "Traditional", 2750],
    ["Stillness in Stone", "Lucien Ardent", "Sculpture", 4800],
    ["The Young Laureate", "Felix Rowan", "Sculpture", 3900],
    ["Mended in Gold", "Hana Sato", "Sculpture", 5250],
    ["Gathering of the Muses", "Adrian Bellini", "Sculpture", 6100],
    ["Colour in Motion", "Nina Calder", "Modern", 1650],
    ["Lines of a City", "Jules Mercer", "Modern", 2450],
    ["Sunroom No. 4", "Amara Cole", "Modern", 2900],
    ["Many Ways of Seeing", "Devika Rao", "Modern", 3150]
].map(function(row) { return { title: row[0], artist: row[1], category: row[2], startingBid: row[3] }; });

function readList(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch (error) { return []; }
}
function writeList(key, list) { localStorage.setItem(key, JSON.stringify(list)); }
function money(amount) { return (Number(amount) || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }); }
function dateText(value) {
    if (!value) return "—";
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function cell(row, value, className) {
    const td = document.createElement("td");
    td.textContent = value;
    if (className) td.className = className;
    row.appendChild(td);
    return td;
}
function emptyRow(body, message, columns) {
    const row = document.createElement("tr");
    const td = cell(row, message, "table-empty");
    td.colSpan = columns;
    body.replaceChildren(row);
}
function getFinanceSummary() {
    const entries = readList(STORAGE.transactions);
    let income = 0;
    let expenses = 0;
    entries.forEach(function(entry) {
        const amount = Number(entry.amount) || 0;
        if (entry.type === "expense" || entry.type === "refund") expenses += amount;
        else income += amount;
    });
    return { income: income, expenses: expenses, balance: income - expenses };
}
function allArtworks() {
    const categoryNames = { traditional: "Traditional", sculpture: "Sculpture", modern: "Modern" };
    return artworks.concat(readList(STORAGE.published).map(function(item) {
        return { title: item.title, artist: item.artist, category: categoryNames[item.category] || item.category, startingBid: Number(item.price) || 0 };
    }));
}
function bidLeaders() {
    const bids = readList(STORAGE.bids);
    return allArtworks().map(function(artwork) {
        const offers = bids.filter(function(bid) { return bid.artwork === artwork.title; });
        const leader = offers.reduce(function(best, bid) {
            return !best || Number(bid.amount) > Number(best.amount) ? bid : best;
        }, null);
        return Object.assign({}, artwork, {
            currentBid: leader ? Number(leader.amount) : artwork.startingBid,
            bidder: leader ? leader.bidder || "—" : "—",
            offers: offers.length
        });
    });
}

function showDashboard() {
    document.getElementById("loginScreen").classList.add("is-hidden");
    document.getElementById("adminApp").classList.remove("is-hidden");
    document.getElementById("todayDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const dateInput = document.getElementById("transactionDate");
    if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
    renderDashboard();
}

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const user = document.getElementById("adminUser").value.trim();
    const password = document.getElementById("adminPassword").value;
    if (user === DEMO_USER && password === DEMO_PASSWORD) {
        sessionStorage.setItem("artGalleryAdminSession", "active");
        document.getElementById("loginError").textContent = "";
        showDashboard();
    } else {
        document.getElementById("loginError").textContent = "That username and password do not match the prototype access details.";
    }
});

document.getElementById("logoutButton").addEventListener("click", function() {
    sessionStorage.removeItem("artGalleryAdminSession");
    document.getElementById("adminApp").classList.add("is-hidden");
    document.getElementById("loginScreen").classList.remove("is-hidden");
});

const viewNames = { overview: "Overview", bidding: "Live bidding", submissions: "Artwork review", finance: "Finance & transactions" };
function setView(view) {
    document.querySelectorAll(".admin-view").forEach(function(panel) {
        panel.classList.toggle("is-hidden", panel.dataset.view !== view);
    });
    document.querySelectorAll(".side-link").forEach(function(link) {
        link.classList.toggle("active", link.dataset.viewTarget === view);
    });
    document.getElementById("pageTitle").textContent = viewNames[view] || "Overview";
    if (view === "submissions") renderSubmissions();
    if (view === "finance") renderTransactions();
}
document.querySelectorAll("[data-view-target]").forEach(function(button) {
    button.addEventListener("click", function() { setView(button.dataset.viewTarget); });
});
document.querySelectorAll("[data-open-view]").forEach(function(button) {
    button.addEventListener("click", function() { setView(button.dataset.openView); });
});

function renderBidding() {
    const allBids = readList(STORAGE.bids).slice().sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    const body = document.getElementById("biddingTable");
    body.replaceChildren();
    bidLeaders().sort(function(a, b) { return b.currentBid - a.currentBid; }).forEach(function(item) {
        const row = document.createElement("tr");
        cell(row, item.title);
        cell(row, item.artist);
        cell(row, item.category, "collection-tag");
        cell(row, money(item.currentBid), "bid-positive");
        cell(row, item.bidder);
        cell(row, String(item.offers));
        body.appendChild(row);
    });
    const history = document.getElementById("bidHistoryTable");
    history.replaceChildren();
    if (!allBids.length) emptyRow(history, "No offers have been placed yet.", 4);
    allBids.forEach(function(bid) {
        const row = document.createElement("tr");
        cell(row, bid.artwork || "Artwork");
        cell(row, bid.bidder || "Gallery visitor");
        cell(row, money(bid.amount), "bid-positive");
        cell(row, dateText(bid.createdAt));
        history.appendChild(row);
    });
    const overview = document.getElementById("overviewBids");
    overview.replaceChildren();
    const leaders = bidLeaders().filter(function(item) { return item.offers > 0; })
        .sort(function(a, b) { return b.currentBid - a.currentBid; }).slice(0, 5);
    if (!leaders.length) overview.innerHTML = '<div class="empty-state">No active offers yet. Bids placed on the gallery will appear here.</div>';
    leaders.forEach(function(item) {
        const row = document.createElement("div"); row.className = "compact-row";
        const main = document.createElement("div"); main.className = "compact-main";
        const title = document.createElement("strong"); title.textContent = item.title;
        const meta = document.createElement("span"); meta.textContent = item.offers + (item.offers === 1 ? " offer" : " offers") + " · led by " + item.bidder;
        main.append(title, meta);
        const value = document.createElement("span"); value.className = "compact-amount"; value.textContent = money(item.currentBid);
        row.append(main, value); overview.appendChild(row);
    });
    document.getElementById("metricBids").textContent = String(leaders.reduce(function(total, item) { return total + item.offers; }, 0));
}

function renderSubmissions() {
    const entries = readList(STORAGE.submissions).slice().sort(function(a, b) {
        return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });
    const pending = entries.filter(function(item) { return item.status === "pending"; }).length;
    document.getElementById("pendingBadge").textContent = String(pending);
    document.getElementById("reviewCount").textContent = String(pending);
    document.getElementById("metricSubmissions").textContent = String(pending);
    document.getElementById("submissionSummary").textContent = pending ? pending + (pending === 1 ? " submission waiting for review" : " submissions waiting for review") : "No pending submissions";
    const grid = document.getElementById("submissionGrid"); grid.replaceChildren();
    if (!entries.length) { grid.innerHTML = '<div class="panel empty-state">No submissions yet. Artists can send work using “Submit artwork” on the public gallery.</div>'; return; }
    entries.forEach(function(item) {
        const card = document.createElement("article"); card.className = "submission-card";
        const img = document.createElement("img"); img.src = item.image; img.alt = item.title; img.loading = "lazy";
        img.addEventListener("error", function() { img.style.display = "none"; });
        const content = document.createElement("div"); content.className = "submission-content";
        const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = (item.category || "art").toUpperCase() + " · " + dateText(item.submittedAt);
        const title = document.createElement("h3"); title.textContent = item.title;
        const artist = document.createElement("p"); artist.textContent = "By " + item.artist + " · Starting bid " + money(item.price);
        const story = document.createElement("p"); story.className = "submission-story"; story.textContent = item.story || "No description added.";
        const status = document.createElement("span"); status.className = "status-tag " + item.status; status.textContent = item.status === "published" ? "Published" : item.status === "rejected" ? "Declined" : "Pending review";
        content.append(eyebrow, title, artist, story, status);
        if (item.status === "pending") {
            const actions = document.createElement("div"); actions.className = "submission-actions";
            const approve = document.createElement("button"); approve.className = "approve-button"; approve.type = "button"; approve.textContent = "Approve & publish"; approve.dataset.approveId = item.id;
            const reject = document.createElement("button"); reject.className = "reject-button"; reject.type = "button"; reject.textContent = "Decline"; reject.dataset.rejectId = item.id;
            actions.append(approve, reject); content.appendChild(actions);
        }
        card.append(img, content); grid.appendChild(card);
    });
}

document.getElementById("submissionGrid").addEventListener("click", function(event) {
    const approveId = event.target.dataset.approveId;
    const rejectId = event.target.dataset.rejectId;
    if (!approveId && !rejectId) return;
    const submissions = readList(STORAGE.submissions);
    const item = submissions.find(function(entry) { return entry.id === (approveId || rejectId); });
    if (!item || item.status !== "pending") return;
    if (approveId) {
        item.status = "published";
        item.publishedAt = new Date().toISOString();
        const published = readList(STORAGE.published);
        if (!published.some(function(entry) { return entry.id === item.id; })) published.push(item);
        writeList(STORAGE.published, published);
    } else item.status = "rejected";
    writeList(STORAGE.submissions, submissions);
    renderSubmissions(); renderDashboardMetrics();
});

function renderTransactions() {
    const entries = readList(STORAGE.transactions).slice().sort(function(a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
    });
    const filter = document.getElementById("transactionFilter").value;
    const filtered = entries.filter(function(entry) {
        if (filter === "income") return ["sale", "fee", "adjustment"].includes(entry.type);
        if (filter === "expense") return ["expense", "refund"].includes(entry.type);
        return true;
    });
    const body = document.getElementById("transactionTable"); body.replaceChildren();
    if (!filtered.length) emptyRow(body, "No transactions recorded. Add a ledger entry to get started.", 5);
    filtered.forEach(function(entry) {
        const row = document.createElement("tr");
        cell(row, dateText(entry.date)); cell(row, entry.description);
        const isExpense = ["expense", "refund"].includes(entry.type);
        cell(row, entry.type.charAt(0).toUpperCase() + entry.type.slice(1), "type-tag " + (isExpense ? "expense" : "income"));
        cell(row, (isExpense ? "− " : "+ ") + money(entry.amount), isExpense ? "" : "bid-positive");
        const action = cell(row, "");
        const remove = document.createElement("button"); remove.className = "delete-button"; remove.type = "button"; remove.textContent = "Remove"; remove.dataset.deleteTransaction = entry.id;
        action.appendChild(remove); body.appendChild(row);
    });
    const recent = document.getElementById("overviewTransactions"); recent.replaceChildren();
    if (!entries.length) recent.innerHTML = '<div class="empty-state">No ledger entries recorded yet.</div>';
    entries.slice(0, 5).forEach(function(entry) {
        const row = document.createElement("div"); row.className = "compact-row";
        const main = document.createElement("div"); main.className = "compact-main";
        const title = document.createElement("strong"); title.textContent = entry.description;
        const date = document.createElement("span"); date.textContent = dateText(entry.date) + " · " + entry.type;
        main.append(title, date);
        const expense = ["expense", "refund"].includes(entry.type);
        const amount = document.createElement("span"); amount.className = "compact-amount"; amount.textContent = (expense ? "− " : "+ ") + money(entry.amount);
        row.append(main, amount); recent.appendChild(row);
    });
    const summary = getFinanceSummary();
    document.getElementById("financeIncome").textContent = money(summary.income);
    document.getElementById("financeExpenses").textContent = money(summary.expenses);
    document.getElementById("financeBalance").textContent = money(summary.balance);
    document.getElementById("metricBalance").textContent = money(summary.balance);
}

document.getElementById("transactionForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const entries = readList(STORAGE.transactions);
    entries.push({
        id: "txn-" + Date.now(),
        type: document.getElementById("transactionType").value,
        description: document.getElementById("transactionDescription").value.trim(),
        amount: Number(document.getElementById("transactionAmount").value),
        date: document.getElementById("transactionDate").value,
        createdAt: new Date().toISOString()
    });
    writeList(STORAGE.transactions, entries);
    this.reset();
    document.getElementById("transactionDate").value = new Date().toISOString().slice(0, 10);
    renderTransactions(); renderDashboardMetrics();
});
document.getElementById("transactionTable").addEventListener("click", function(event) {
    const id = event.target.dataset.deleteTransaction;
    if (!id) return;
    writeList(STORAGE.transactions, readList(STORAGE.transactions).filter(function(entry) { return entry.id !== id; }));
    renderTransactions(); renderDashboardMetrics();
});
document.getElementById("transactionFilter").addEventListener("change", renderTransactions);

document.getElementById("exportTransactions").addEventListener("click", function() {
    const entries = readList(STORAGE.transactions);
    const escapeCell = function(value) { return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"'; };
    const rows = [["Date", "Description", "Type", "Amount INR"]].concat(entries.map(function(item) { return [item.date, item.description, item.type, Number(item.amount).toFixed(0)]; }));
    const csv = rows.map(function(row) { return row.map(escapeCell).join(","); }).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "art-gallery-transactions.csv"; link.click();
    URL.revokeObjectURL(url);
});

function renderDashboardMetrics() {
    document.getElementById("metricArtworks").textContent = String(allArtworks().length);
    renderBidding(); renderSubmissions(); renderTransactions();
}
function renderDashboard() { renderDashboardMetrics(); }

window.addEventListener("storage", renderDashboard);
if (sessionStorage.getItem("artGalleryAdminSession") === "active") showDashboard();
