let currentSlide = 0;
let selectedArtwork = "";
let selectedPrice = 0;
const GALLERY_BIDS_KEY = "artGalleryBids";
const GALLERY_MY_BIDS_KEY = "artGalleryMyBids";
const GALLERY_SUBMISSIONS_KEY = "artGallerySubmissions";
const GALLERY_PUBLISHED_KEY = "artGalleryPublished";
function readGalleryList(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch (error) { return []; }
}
function saveGalleryList(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { alert("Your browser could not save this item. Try using a smaller image URL or clearing browser storage."); }
}
let myBids = readGalleryList(GALLERY_MY_BIDS_KEY);
let activeCategory = "all";

function formatINR(amount) {
    return Number(amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
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

    document.getElementById("loginBox").style.display = "flex";
}

function login(event) {

    event.preventDefault();

    closeForms();

    alert("Login Successful!");
}

function openRegister() {

    closeForms();

    document.getElementById("registerBox").style.display = "flex";
}

function register(event) {

    event.preventDefault();

    closeForms();

    alert("Registration Successful!");
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
    document.getElementById("bidderName").value = "";

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

    if (myBids.length === 0) {

        bidsContainer.innerHTML =
            "<p>No bids placed yet.</p>";

        return;
    }

    bidsContainer.innerHTML = "";

    myBids.forEach(function(bid) {

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
