let currentSlide = 0;
let selectedArtwork = "";
let selectedPrice = 0;
const GALLERY_BIDS_KEY = "artGalleryBids";
const GALLERY_MY_BIDS_KEY = "artGalleryMyBids";
const GALLERY_SUBMISSIONS_KEY = "artGallerySubmissions";
const GALLERY_PUBLISHED_KEY = "artGalleryPublished";
const GALLERY_ACCOUNTS_KEY = "artGalleryAccounts";
const GALLERY_USER_SESSION_KEY = "artGalleryCurrentUser";
function readGalleryList(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch (error) { return []; }
}
function saveGalleryList(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { alert("Your browser could not save this item. Try using a smaller image URL or clearing browser storage."); return false; }
}
let myBids = readGalleryList(GALLERY_MY_BIDS_KEY);
let activeCategory = "all";

function formatINR(amount) {
    return Number(amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function currentGalleryUser() {
    const session = readGalleryList(GALLERY_USER_SESSION_KEY);
    if (!session || !session.email) return null;
    return readGalleryList(GALLERY_ACCOUNTS_KEY).find(function(account) { return account.email === session.email; }) || null;
}

function updateAccountControls() {
    const user = currentGalleryUser();
    document.getElementById("loginLink").hidden = Boolean(user);
    document.getElementById("registerLink").hidden = Boolean(user);
    const accountLink = document.getElementById("accountLink");
    accountLink.hidden = !user;
    if (user) accountLink.textContent = user.name.split(/\s+/)[0] + " ▾";
}

function showAccountDashboard(user) {
    const initials = user.name.trim().split(/\s+/).slice(0, 2).map(function(part) { return part.charAt(0).toUpperCase(); }).join("");
    document.getElementById("accountInitials").textContent = initials || "A";
    document.getElementById("accountGreeting").textContent = "Welcome, " + user.name.split(/\s+/)[0];
    document.getElementById("accountEmail").textContent = user.email;
    document.getElementById("accountBidCount").textContent = String(myBids.filter(function(bid) { return bid.accountEmail === user.email; }).length);
    document.getElementById("accountBox").style.display = "flex";
}

function openAccount() {
    closeForms();
    const user = currentGalleryUser();
    if (user) showAccountDashboard(user);
    else openLogin();
}

function logoutAccount() {
    localStorage.removeItem(GALLERY_USER_SESSION_KEY);
    closeForms();
    updateAccountControls();
}

async function hashAccountPassword(password, saltHex) {
    if (!window.crypto || !window.crypto.subtle) throw new Error("Secure password storage requires HTTPS or localhost.");
    const salt = saltHex ? Uint8Array.from(saltHex.match(/.{2}/g).map(function(byte) { return parseInt(byte, 16); })) : window.crypto.getRandomValues(new Uint8Array(16));
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" }, key, 256);
    return {
        salt: Array.from(salt).map(function(byte) { return byte.toString(16).padStart(2, "0"); }).join(""),
        hash: Array.from(new Uint8Array(bits)).map(function(byte) { return byte.toString(16).padStart(2, "0"); }).join("")
    };
}

const slider = document.querySelector(".slider");
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
const slideCount = slides.length;

function showSlide(index) {

    if (!slideCount) return;
    currentSlide = (index % slideCount + slideCount) % slideCount;

    slider.style.transform =
        "translateX(-" + (currentSlide * 100) + "%)";

    dots.forEach(function(dot) {
        dot.classList.remove("active");
    });

    dots[currentSlide].classList.add("active");
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function previousSlide() {
    showSlide(currentSlide - 1);
}

if (slideCount > 1) {
    setInterval(function() {
        nextSlide();
    }, 5000);
}

function searchArtworks() {

    const searchText =
        document.getElementById("searchInput").value.toLowerCase().trim();

    const products =
        document.querySelectorAll(".product");

    if (searchText === "") {

        products.forEach(function(product) {
            product.style.display = "block";
        });

        return;
    }

    let found = false;

    products.forEach(function(product) {

        const artworkName =
            product.querySelector("h3").textContent.toLowerCase();

        const artistName =
            product.querySelector("p").textContent.toLowerCase();

        const category = product.dataset.category || "";
        const categoryMatches = activeCategory === "all" || category === activeCategory;
        const searchMatches = !searchText || artworkName.includes(searchText) ||
            artistName.includes(searchText) || category.includes(searchText);

        if (categoryMatches && searchMatches) {
            product.style.display = "block";
            found = true;
        }

        else {
            product.style.display = "none";
        }
    });

    if (!found && searchText) {
        alert("No artwork found!");
    }
}

function filterArtworks(category) {
    activeCategory = "all";
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    document.querySelectorAll(".art-section").forEach(function(section) {
        section.style.display = category === "all" || section.id === category ? "" : "none";
    });
    document.querySelectorAll(".product").forEach(function(product) {
        product.style.display = "block";
    });
}

function filterArtists(category, selectedButton) {
    document.querySelectorAll(".artist-card").forEach(function(card) {
        card.style.display = category === "all" || card.dataset.category === category ? "" : "none";
    });

    document.querySelectorAll(".artist-filter").forEach(function(button) {
        const isActive = button === selectedButton;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

function openLogin() {
    closeForms();
    const user = currentGalleryUser();
    if (user) { showAccountDashboard(user); return; }
    document.getElementById("loginMessage").textContent = "";
    document.getElementById("loginBox").style.display = "flex";
}

async function login(event) {
    event.preventDefault();
    const message = document.getElementById("loginMessage");
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const account = readGalleryList(GALLERY_ACCOUNTS_KEY).find(function(item) { return item.email === email; });
    if (!account) { message.textContent = "We couldn't find an account with that email. Register to get started."; return; }
    message.textContent = "Checking your account…";
    try {
        const result = await hashAccountPassword(password, account.passwordSalt);
        if (result.hash !== account.passwordHash) { message.textContent = "That password doesn't match this account."; return; }
        saveGalleryList(GALLERY_USER_SESSION_KEY, { email: account.email, signedInAt: new Date().toISOString() });
        updateAccountControls();
        closeForms();
        showAccountDashboard(account);
    } catch (error) {
        message.textContent = error.message || "We couldn't sign you in. Please try again.";
    }
}

function openRegister() {
    closeForms();
    document.getElementById("registerMessage").textContent = "";
    document.getElementById("registerBox").style.display = "flex";
}

async function register(event) {
    event.preventDefault();
    const message = document.getElementById("registerMessage");
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirmation = document.getElementById("registerConfirmPassword").value;
    if (password.length < 8) { message.textContent = "Choose a password with at least 8 characters."; return; }
    if (password !== confirmation) { message.textContent = "Those passwords don't match yet."; return; }
    const accounts = readGalleryList(GALLERY_ACCOUNTS_KEY);
    if (accounts.some(function(account) { return account.email === email; })) { message.textContent = "An account with this email already exists. Sign in instead."; return; }
    message.textContent = "Creating your account…";
    try {
        const passwordData = await hashAccountPassword(password);
        const account = { name: name, email: email, passwordSalt: passwordData.salt, passwordHash: passwordData.hash, createdAt: new Date().toISOString() };
        accounts.push(account);
        if (!saveGalleryList(GALLERY_ACCOUNTS_KEY, accounts)) { message.textContent = "Your browser couldn't save the account. Please check available storage and try again."; return; }
        if (!saveGalleryList(GALLERY_USER_SESSION_KEY, { email: email, signedInAt: new Date().toISOString() })) { message.textContent = "Your account was created, but we couldn't keep you signed in on this browser."; return; }
        updateAccountControls();
        closeForms();
        event.target.reset();
        showAccountDashboard(account);
    } catch (error) {
        message.textContent = error.message || "We couldn't create your account. Please try again.";
    }
}

function openBids() {

    closeForms();

    displayBids();

    document.getElementById("bidsBox").style.display = "flex";
}

function openBidForm(artwork, price) {

    selectedArtwork = artwork;
    selectedPrice = readGalleryList(GALLERY_BIDS_KEY)
        .filter(function(bid) { return bid.artwork === artwork; })
        .reduce(function(high, bid) { return Math.max(high, Number(bid.amount) || 0); }, price);

    closeForms();

    document.getElementById("bidArtwork").textContent =
        artwork;

    document.getElementById("bidCurrentPrice").textContent =
        "Current Bid: " + formatINR(selectedPrice);

    document.getElementById("bidAmount").value = "";
    const bidderInput = document.getElementById("bidderName");
    const signedInUser = currentGalleryUser();
    bidderInput.value = signedInUser ? signedInUser.name : "";
    bidderInput.readOnly = Boolean(signedInUser);

    document.getElementById("bidBox").style.display = "flex";
}

function placeBid(event) {

    event.preventDefault();

    const amount =
        Number(document.getElementById("bidAmount").value);
    const bidder = document.getElementById("bidderName").value.trim();

    if (amount <= selectedPrice) {

        alert(
            "Your bid must be higher than the current bid of " +
            formatINR(selectedPrice)
        );

        return;
    }

    const bidRecord = {
        artwork: selectedArtwork,
        amount: amount,
        bidder: bidder,
        accountEmail: currentGalleryUser() ? currentGalleryUser().email : "",
        createdAt: new Date().toISOString()
    };

    myBids.push(bidRecord);
    const bids = readGalleryList(GALLERY_BIDS_KEY);
    bids.push(bidRecord);
    saveGalleryList(GALLERY_BIDS_KEY, bids);
    saveGalleryList(GALLERY_MY_BIDS_KEY, myBids);
    refreshBidDisplays();

    closeForms();

    alert("Bid Placed Successfully!");
}

function displayBids() {

    const bidsContainer =
        document.getElementById("myBids");

    const user = currentGalleryUser();
    const visibleBids = user ? myBids.filter(function(bid) { return bid.accountEmail === user.email; }) : myBids.filter(function(bid) { return !bid.accountEmail; });

    if (visibleBids.length === 0) {

        bidsContainer.innerHTML =
            "<p>No bids placed yet.</p>";

        return;
    }

    bidsContainer.innerHTML = "";

    visibleBids.forEach(function(bid) {

        const bidItem =
            document.createElement("div");

        const title = document.createElement("p");
        const titleText = document.createElement("b");
        titleText.textContent = bid.artwork;
        title.appendChild(titleText);
        const amount = document.createElement("p");
        amount.textContent = "Your Bid: " + formatINR(bid.amount);
        bidItem.appendChild(title);
        bidItem.appendChild(amount);
        bidItem.appendChild(document.createElement("hr"));

        bidsContainer.appendChild(bidItem);
    });
}

function closeForms() {

    document.getElementById("loginBox").style.display = "none";

    document.getElementById("registerBox").style.display = "none";

    document.getElementById("bidsBox").style.display = "none";

    document.getElementById("bidBox").style.display = "none";
    document.getElementById("submissionBox").style.display = "none";
    document.getElementById("accountBox").style.display = "none";
}

function openSubmissionForm() {
    closeForms();
    document.getElementById("submissionBox").style.display = "flex";
}

function submitArtwork(event) {
    event.preventDefault();
    const item = {
        id: "submission-" + Date.now(),
        artist: document.getElementById("submissionArtist").value.trim(),
        title: document.getElementById("submissionTitle").value.trim(),
        category: document.getElementById("submissionCategory").value,
        image: document.getElementById("submissionImage").value.trim(),
        price: Number(document.getElementById("submissionPrice").value),
        story: document.getElementById("submissionStory").value.trim(),
        status: "pending",
        submittedAt: new Date().toISOString()
    };
    const submissions = readGalleryList(GALLERY_SUBMISSIONS_KEY);
    submissions.push(item);
    saveGalleryList(GALLERY_SUBMISSIONS_KEY, submissions);
    closeForms();
    event.target.reset();
    alert("Your artwork was sent to the gallery for review.");
}

function refreshBidDisplays() {
    const bids = readGalleryList(GALLERY_BIDS_KEY);
    document.querySelectorAll(".product").forEach(function(product) {
        const title = product.querySelector("h3").textContent;
        const price = product.querySelector(".price");
        const startingPrice = Number((price.textContent.match(/[\d,]+/) || ["0"])[0].replace(/,/g, ""));
        const currentPrice = bids.filter(function(bid) { return bid.artwork === title; })
            .reduce(function(high, bid) { return Math.max(high, Number(bid.amount) || 0); }, startingPrice);
        price.textContent = "Current Bid: " + formatINR(currentPrice);
    });
}

function renderPublishedArtworks() {
    const categorySections = { traditional: "traditional-art", sculpture: "sculptures", modern: "modern-art" };
    readGalleryList(GALLERY_PUBLISHED_KEY).forEach(function(item) {
        const container = document.querySelector("#" + categorySections[item.category] + " .products");
        if (!container || container.querySelector('[data-submission-id="' + item.id + '"]')) return;
        const card = document.createElement("article");
        card.className = "product";
        card.dataset.submissionId = item.id;
        const image = document.createElement("img");
        image.className = "art";
        image.src = item.image;
        image.alt = item.title;
        const label = document.createElement("span");
        label.className = "art-type";
        label.textContent = item.category.toUpperCase() + " · ARTIST SUBMISSION";
        const title = document.createElement("h3");
        title.textContent = item.title;
        const artist = document.createElement("p");
        artist.textContent = "Artist: " + item.artist;
        const price = document.createElement("p");
        price.className = "price";
        price.textContent = "Current Bid: " + formatINR(item.price);
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Place Bid";
        button.addEventListener("click", function() { openBidForm(item.title, Number(item.price)); });
        card.append(image, label, title, artist, price, button);
        container.appendChild(card);
    });
}

renderPublishedArtworks();
refreshBidDisplays();
updateAccountControls();
