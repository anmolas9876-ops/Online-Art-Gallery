let currentSlide = 0;
let selectedArtwork = "";
let selectedPrice = 0;
let myBids = [];

const slider = document.querySelector(".slider");
const dots = document.querySelectorAll(".dot");

function showSlide(index) {

    if (index >= 2) {
        currentSlide = 0;
    }

    else if (index < 0) {
        currentSlide = 1;
    }

    else {
        currentSlide = index;
    }

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

setInterval(function() {
    nextSlide();
}, 5000);

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
    selectedPrice = price;

    closeForms();

    document.getElementById("bidArtwork").textContent =
        artwork;

    document.getElementById("bidCurrentPrice").textContent =
        "Current Bid: $" + price;

    document.getElementById("bidAmount").value = "";

    document.getElementById("bidBox").style.display = "flex";
}

function placeBid(event) {

    event.preventDefault();

    const amount =
        Number(document.getElementById("bidAmount").value);

    if (amount <= selectedPrice) {

        alert(
            "Your bid must be higher than the current bid of $" +
            selectedPrice
        );

        return;
    }

    myBids.push({
        artwork: selectedArtwork,
        amount: amount
    });

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

        bidItem.innerHTML =
            "<p><b>" +
            bid.artwork +
            "</b></p>" +
            "<p>Your Bid: $" +
            bid.amount +
            "</p>" +
            "<hr>";

        bidsContainer.appendChild(bidItem);
    });
}

function closeForms() {

    document.getElementById("loginBox").style.display = "none";

    document.getElementById("registerBox").style.display = "none";

    document.getElementById("bidsBox").style.display = "none";

    document.getElementById("bidBox").style.display = "none";
}