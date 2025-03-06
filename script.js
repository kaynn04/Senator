// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNM55D9108SdpAk8P_gKBuHNyznQaQl00",
    authDomain: "senator-forum.firebaseapp.com",
    databaseURL: "https://senator-forum-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "senator-forum",
    storageBucket: "senator-forum.firebasestorage.app",
    messagingSenderId: "1004038813101",
    appId: "1:1004038813101:web:59a28db6ef29bebabf9d24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Get DOM elements
const senatorContainer = document.getElementById("senatorContainer");
const addSenatorButton = document.getElementById("addSenatorFloatingBtn");
const modal = document.getElementById("addSenatorModal");
const addSenatorForm = document.getElementById("addSenatorForm");
const searchInput = document.getElementById("search");
const closeAddSenator = document.getElementById("close-btn")

// Function to create a senator card
function createSenatorCard(id, name, party) {
    const card = document.createElement("div");
    card.classList.add("senator-card");
    card.innerHTML = `
        <h3>${name}</h3>
        <p>${party}</p>
        <div class="button-group">
            <button class="opinion-btn view-opinions-btn" data-id="${id}">View Informations</button>
            <button class="opinion-btn add-opinion-btn" data-id="${id}">Add Informations</button>
        </div>
        <div class="opinions-container" id="opinions-${id}" style="display: none;"></div>
    `;
    
    card.querySelector(".view-opinions-btn").addEventListener("click", () => openViewOpinionsModal(id, party));
    card.querySelector(".add-opinion-btn").addEventListener("click", () => openOpinionModal(id, party));

    return card;
}

// Function to retrieve senators grouped by party
function getSenators() {
    const senatorsRef = ref(db, "senators");
    onValue(senatorsRef, (snapshot) => {
        const senatorContainer = document.getElementById("senatorContainer");
        senatorContainer.innerHTML = "";
        if (!snapshot.exists()) return;

        snapshot.forEach((partySnapshot) => {
            const partyName = partySnapshot.key;
            const rowContainer = document.createElement("div");
            rowContainer.classList.add("party-row");
            rowContainer.innerHTML = `<h2>${partyName}</h2>`;

            const scrollContainer = document.createElement("div");
            scrollContainer.classList.add("scroll-container");

            const senatorsArray = []; // Collect senators for overflow check
            partySnapshot.forEach((senatorSnapshot) => {
                const senator = senatorSnapshot.val();
                senatorsArray.push(createSenatorCard(senatorSnapshot.key, senator.name, senator.party));
            });

            // Add cards and handle overflow
            senatorsArray.forEach((card, index) => {
                scrollContainer.appendChild(card);
            });

            if (senatorsArray.length > 4) {
                scrollContainer.style.maxHeight = "600px"; // Adjust height as needed
                scrollContainer.style.overflowY = "auto";
            } else {
                scrollContainer.style.maxHeight = "none";
                scrollContainer.style.overflowY = "visible";
            }

            rowContainer.appendChild(scrollContainer);
            senatorContainer.appendChild(rowContainer);
        });
    });
}

// Function to add a senator under the corresponding party node
function addSenator(name, party) {
    if (!name || !party) {
        alert("Please fill in all fields.");
        return;
    }

    const partyRef = ref(db, `senators/${party}`);
    const newSenatorRef = push(partyRef);
    
    update(newSenatorRef, { name, party, opinions: {} })
        .then(() => console.log("Senator added successfully"))
        .catch(error => console.error("Error adding senator:", error));
}

function openOpinionModal(senatorId, party) {
    const modal = document.createElement("div");
    modal.classList.add("opinion-modal");
    modal.innerHTML = `
        <div class="opinion-modal-content">
            <span class="close-modal">&times;</span>
            <h2>Add Information</h2>
            <form id="opinionForm">
                <textarea id="opinionText" placeholder="Write Information here..." required></textarea>
                <textarea id="references" placeholder="References (Separate with commas)" required></textarea>
                <button type="submit">Submit Information</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector(".close-modal").addEventListener("click", () => modal.remove());
    modal.querySelector("#opinionForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const opinionText = document.getElementById("opinionText").value.trim();
        const referencesInput = document.getElementById("references").value.trim();
        const references = referencesInput.split(',').map(ref => ref.trim()); // Split by commas

        if (opinionText && references.length > 0) {
            const validReferences = references.every(isValidUrl); // Check if all are valid
            if (validReferences) {
                addOpinion(senatorId, party, opinionText, references); // Pass the array
                modal.remove();
                alert("Information added successfully!");
            } else {
                alert("Please provide valid reference URLs, separated by commas.");
            }
        } else {
            alert("Please provide an opinion and at least one reference.");
        }
    });
}

// Function to validate URL format
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

// Function to add an opinion under the senator's node
function addOpinion(senatorId, party, opinion, reference) {
    const opinionsRef = ref(db, `senators/${party}/${senatorId}/opinions`);
    push(opinionsRef, { opinion, reference })
        .then(() => console.log("Information added successfully"))
        .catch(error => console.error("Error adding opinion:", error));
}

// Event listeners
document.addEventListener("DOMContentLoaded", getSenators);
addSenatorButton.addEventListener("click", () => modal.style.display = "flex");
addSenatorForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("senatorName").value.trim();
    const party = document.getElementById("senatorParty").value.trim();
    if (name && party) {
        addSenator(name, party);
        modal.style.display = "none";
        addSenatorForm.reset();
    } else {
        alert("Please fill in all fields.");
    }
});

// Search function
function searchSenator() {
    const input = searchInput.value.toLowerCase();
    const senatorCards = document.querySelectorAll(".senator-card");
    const partyRows = document.querySelectorAll(".party-row");

    let hasVisibleSenator = false;
    senatorCards.forEach(card => {
        const name = card.querySelector("h3").textContent.toLowerCase();
        const party = card.querySelector("p").textContent.toLowerCase();
        
        if (name.includes(input) || party.includes(input)) {
            card.style.display = "block";
            hasVisibleSenator = true;
        } else {
            card.style.display = "none";
        }
    });

    // Party row logic (if you are using party rows)
    partyRows.forEach(row => {
        const party = row.getAttribute("data-party")?.toLowerCase(); // Get the party attribute and convert to lowercase
        const senatorsInParty = row.querySelectorAll(".senator-card");
        const hasVisibleCards = Array.from(senatorsInParty).some(card => card.style.display !== "none");

        //If you want the party row to hide when the search doesn't match the party name.
        if(party && !party.includes(input)){
            row.style.display = "none";
        } else {
            row.style.display = hasVisibleCards ? "block" : "none";
        }
    });
}

searchInput.addEventListener("keyup", searchSenator);

function setupCloseAddSenator() {
    const closeAddSenator = document.querySelector("#addSenatorModal .close-btn"); // More specific selector

    if (closeAddSenator) {
        closeAddSenator.addEventListener("click", () => {
            const addSenatorModal = document.getElementById("addSenatorModal");
            if (addSenatorModal) {
                addSenatorModal.style.display = "none";
            }
        });
    } else {
        console.error("Close button not found in Add Senator Modal.");
    }
}

// Call the function when your script loads
setupCloseAddSenator();

// Function to fetch and display opinions in a modal
function openViewOpinionsModal(senatorId, party) {
    const modal = document.createElement("div");
    modal.classList.add("opinion-modal");
    modal.innerHTML = `
        <div class="opinion-modal-content">
            <span class="close-modal">&times;</span>
            <h2>Informations</h2>
            <div id="opinionsList">Loading informations...</div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking the close button
    modal.querySelector(".close-modal").addEventListener("click", () => modal.remove());

    // Retrieve and display opinions from Firebase
    retrieveOpinions(senatorId, party, modal.querySelector("#opinionsList"));
}

function retrieveOpinions(senatorId, party, container) {
    console.log(`Retrieving opinions from path: senators/${party}/${senatorId}/opinions`);

    const opinionsRef = ref(db, `senators/${party}/${senatorId}/opinions`);

    onValue(opinionsRef, (snapshot) => {
        console.log("Snapshot received:", snapshot.exists());

        container.innerHTML = ""; // Clear loading text

        if (!snapshot.exists()) {
            container.innerHTML = "<p>No information found.</p>";
            console.log("No informations found.");
            return;
        }

        const opinions = snapshot.val();
        console.log("Opinions retrieved:", opinions);

        // Create a grid container
        const gridContainer = document.createElement("div");
        gridContainer.classList.add("opinions-grid");

        let infoCount = 1; // Counter for Information 1, 2, 3...

        Object.entries(opinions).forEach(([opinionId, opinionData]) => {
            console.log(`Opinion ID: ${opinionId}`, opinionData);

            // Check if reference is an array or a single string
            let referenceHTML = "No references available";
            if (opinionData.reference) {
                if (Array.isArray(opinionData.reference)) {
                    // If multiple references, create a list of clickable links
                    referenceHTML = opinionData.reference.map(ref => 
                        `<a href="${ref}" target="_blank" rel="noopener noreferrer">${ref}</a>`
                    ).join("<br>");
                } else {
                    // If it's a single reference, make it clickable
                    referenceHTML = `<a href="${opinionData.reference}" target="_blank" rel="noopener noreferrer">${opinionData.reference}</a>`;
                }
            }

            const opinionDiv = document.createElement("div");
            opinionDiv.classList.add("opinion-item");
            opinionDiv.innerHTML = `<p class="info-text"><strong>Information ${infoCount}</strong></p>`;

            // Click event to open full-screen opinion modal
            opinionDiv.addEventListener("click", () => {
                openOpinionDetailModal(opinionData.opinion, referenceHTML);
            });

            gridContainer.appendChild(opinionDiv);
            infoCount++;
        });

        container.appendChild(gridContainer);
    }, (error) => {
        console.error("Error retrieving opinions:", error);
        container.innerHTML = "<p>Failed to load opinions.</p>";
    });
}

function openOpinionDetailModal(opinion, referenceHTML) {
    // Create the full-screen detail modal
    const detailModal = document.createElement("div");
    detailModal.classList.add("detail-modal");
    detailModal.innerHTML = `
        <div class="detail-modal-content">
            <span class="close-detail-modal">&times;</span>
            <h2>Information Details</h2>
            <pre class="opinion-text">${opinion}</pre>
            <p class="reference-text"><strong>Reference:</strong> ${referenceHTML}</p>
        </div>
    `;

    document.body.appendChild(detailModal);

    // Close modal when clicking the close button
    detailModal.querySelector(".close-detail-modal").addEventListener("click", () => {
        detailModal.remove();
    });
}

// Show modal if user hasn't seen the tutorial
window.onload = function () {
    if (!localStorage.getItem("seenGuide")) {  // FIX: Only show if NOT seen
        document.getElementById("guideModal").style.display = "flex";
    }
};

// Wait for DOM content to load before adding event listener
document.addEventListener("DOMContentLoaded", function () {
    const closeBtn = document.querySelector(".guide-close-btn"); // FIX: Match new class name

    if (closeBtn) {
        closeBtn.addEventListener("click", function () {
            document.getElementById("guideModal").style.display = "none";
            localStorage.setItem("seenGuide", "true"); // Store tutorial seen
        });
    }
});









