/**
 * SK Portal Database Controller Configuration
 */
const SHEET_ID = '1bkhpqGTzS1_NehWzCEfnpAy5gaz9NZldEIVq7gs04OM'; 
const SHEET_TAB_NAME = 'Projects';
const MEMBERS_TAB_NAME = 'Members';
const SLIDESHOW_TAB_NAME = 'Slideshow';
const ANNOUNCEMENT_TAB_NAME = 'Announcement';

const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TAB_NAME}`;
const COUNCIL_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${MEMBERS_TAB_NAME}`;
const SLIDESHOW_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SLIDESHOW_TAB_NAME}`;
const ANNOUNCEMENT_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${ANNOUNCEMENT_TAB_NAME}`;

// Your Active Google Apps Script Web App Deployment URL
const FEEDBACK_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxiDIQb7zpIFdbbHwH9gld2nbXDhn7hUU5ls9oY2NKznAGMbVif4Wmqc0obtKTU79_R/exec';

/**
 * Standard utility to parse raw Google Sheet CSV rows safely
 */
function parseCSV(text) {
    let lines = text.split('\n');
    return lines.map(line => {
        let matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return matches.map(val => val.replace(/^"|"$/g, '').trim());
    });
}

/**
 * Monitors the Sticky Announcement string values and hides the component framework if empty
 */
function verifyAnnouncementVisibility(announcementText) {
    const announcementBar = document.getElementById('announcement-bar');
    const body = document.body;

    // Check if text is empty, just spaces, or explicitly set to N/A
    if (!announcementText || announcementText.trim() === "" || announcementText.trim() === "N/A") {
        announcementBar.style.display = 'none'; // Completely removes the element visually
        body.style.paddingTop = '0px';          // Removes the layout spacing at the top
    } else {
        announcementBar.style.display = 'block'; // Shows it if there is real text
        announcementBar.innerText = announcementText;
        body.style.paddingTop = '40px';         // Pushes the site down so it fits nicely
    }
}

/**
 * Fetches the announcement text from its own dedicated sheet tab
 */
async function fetchLiveAnnouncement() {
    try {
        const response = await fetch(ANNOUNCEMENT_DATA_URL);
        if (!response.ok) throw new Error("Announcement connection anomaly.");
        
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);

        if (cleanRows.length > 0 && cleanRows[0][0]) {
            verifyAnnouncementVisibility(cleanRows[0][0]);
        } else {
            verifyAnnouncementVisibility("");
        }
    } catch (err) {
        console.error("Announcement engine exception:", err);
        verifyAnnouncementVisibility("");
    }
}

/**
 * Fetches image configurations dynamically from the Google Sheet and builds the backdrop slides
 */
async function fetchLiveSlideshow() {
    const slideshowContainer = document.getElementById('hero-bg-slideshow');

    try {
        const response = await fetch(SLIDESHOW_DATA_URL);
        if (!response.ok) throw new Error("Slideshow connection anomaly.");
        
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);

        if (cleanRows.length <= 1) {
            slideshowContainer.style.backgroundColor = "#0f172a";
            return;
        }

        slideshowContainer.innerHTML = '';

        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i];
            if (!row[0]) continue; 

            const imageUrl = row[0];

            slideshowContainer.innerHTML += `
                <div class="custom-slide fade">
                    <img src="${imageUrl}" alt="SK Documentation Slide">
                </div>
            `;
        }

        slideTrackerIndex = 0;
        runLiveSlideshow();

    } catch (err) {
        console.error("Slideshow engine runtime exception:", err);
        slideshowContainer.style.backgroundColor = "#0f172a";
    }
}

/**
 * Rotates the dynamically loaded slideshow frames smoothly
 */
let slideTrackerIndex = 0;

function runLiveSlideshow() {
    const slides = document.getElementsByClassName("custom-slide");
    if (slides.length === 0) return;

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    slideTrackerIndex++;
    if (slideTrackerIndex > slides.length) { 
        slideTrackerIndex = 1; 
    }

    slides[slideTrackerIndex - 1].style.display = "block";
    setTimeout(runLiveSlideshow, 4500);
}

/**
 * Pulls and renders the dynamic SK Council Directory profiles
 */
async function fetchLiveCouncil() {
    const gridContainer = document.getElementById('council-grid');
    const loadingIndicator = document.getElementById('council-loading-state');

    try {
        const response = await fetch(COUNCIL_DATA_URL);
        if (!response.ok) throw new Error("Council connection anomaly.");
        
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);

        if (cleanRows.length <= 1) {
            loadingIndicator.innerHTML = `<p style="font-size: 12px; color: #94a3b8;">No council records posted currently.</p>`;
            return;
        }

        gridContainer.innerHTML = '';

        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i];
            if (row.length < 3 || !row[0]) continue; 

            const role = row[0];
            const name = row[1];
            const purok = row[2] || 'Unassigned';
            const contact = row[3] || 'No contact provided';

            const lowerRole = role.toLowerCase();
            let cardClass = 'member-card';

            if (lowerRole.includes('chair') || lowerRole.includes('kapitan')) {
                cardClass = 'member-card chairperson-card';
            } else if (lowerRole.includes('secretary') || lowerRole.includes('treasurer')) {
                cardClass = 'member-card executive-card';
            }

            gridContainer.innerHTML += `
                <div class="${cardClass}">
                    <span class="member-role">${role}</span>
                    <h3 class="member-name">${name}</h3>
                    <span class="member-purok">
                        <i class="fa-solid fa-location-dot"></i> ${purok}
                    </span>
                    <div class="member-contact">
                        <i class="fa-solid fa-phone"></i> ${contact}
                    </div>
                </div>
            `;
        }

        loadingIndicator.classList.add('hidden');
        gridContainer.classList.remove('hidden');

    } catch (err) {
        console.error("Council engine exception:", err);
        loadingIndicator.innerHTML = `<p style="font-size: 12px; color: #ef4444;">Failed to load dynamic directory profiles.</p>`;
    }
}

/**
 * Pulls and renders the project trackers from the primary sheet tab
 */
async function fetchLiveProjects() {
    const gridContainer = document.getElementById('project-grid');
    const loadingIndicator = document.getElementById('loading-state');
    const errorIndicator = document.getElementById('error-state');

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Google Sheet access denied. Check sharing settings.");
        
        const dataText = await response.text();
        if (dataText.includes('<!DOCTYPE html>')) {
            throw new Error("Google Sheet is private. Change permission to 'Anyone with the link can view'.");
        }

        const cleanRows = parseCSV(dataText);

        if (cleanRows.length <= 1) {
            loadingIndicator.innerHTML = `<p style="font-size: 12px; color: #94a3b8;">No active records posted currently.</p>`;
            return;
        }

        gridContainer.innerHTML = '';

        // Starts perfectly at index 1 so all projects load beautifully
        for (let i = 1; i < cleanRows.length; i++) { 
            const row = cleanRows[i];
            if (row.length < 3 || !row[0]) continue; 

            const title = row[0];
            const date = row[1] || 'N/A';
            const status = row[2] || 'Planning';
            const details = row[3] || 'No specific description logged.';

            let badgeStyleClass = 'status-badge'; 
            let statusMarkup = status;
            
            const lowerStatus = status.toLowerCase();
            if (lowerStatus.includes('progress') || lowerStatus.includes('ongoing')) {
                badgeStyleClass += ' badge-progress';
                statusMarkup = `<span class="pulse-dot"></span> ${status}`;
            } else if (lowerStatus.includes('plan') || lowerStatus.includes('prepare')) {
                badgeStyleClass += ' badge-planning';
            } else if (lowerStatus.includes('complete') || lowerStatus.includes('done')) {
                badgeStyleClass += ' badge-complete';
            } else {
                badgeStyleClass += ' badge-planning';
            }

            gridContainer.innerHTML += `
                <div class="project-card">
                    <div>
                        <div class="card-top">
                            <h3>${title}</h3>
                            <span class="${badgeStyleClass}">
                                ${statusMarkup}
                            </span>
                        </div>
                        <p class="card-details">${details}</p>
                    </div>
                    <div class="card-footer">
                        <i class="fa-regular fa-calendar"></i> Target execution: ${date}
                    </div>
                </div>
            `;
        }

        loadingIndicator.classList.add('hidden');
        gridContainer.classList.remove('hidden');

    } catch (err) {
        console.error("Pipeline Exception:", err);
        loadingIndicator.classList.add('hidden');
        errorIndicator.classList.remove('hidden');
        errorIndicator.querySelector('p').innerText = err.message;
    }
}

/**
 * Tab Switching Logic
 */
function switchTab(targetTab) {
    const feedbackForm = document.getElementById('feedback-form');
    const contactForm = document.getElementById('contact-form');
    const feedbackBtn = document.getElementById('tab-feedback-btn');
    const contactBtn = document.getElementById('tab-contact-btn');
    const alertBox = document.getElementById('form-alert');

    alertBox.classList.add('hidden');

    if (targetTab === 'feedback') {
        feedbackForm.classList.remove('hidden');
        contactForm.classList.add('hidden');
        feedbackBtn.classList.add('active');
        contactBtn.classList.remove('active');
    } else {
        contactForm.classList.remove('hidden');
        feedbackForm.classList.add('hidden');
        contactBtn.classList.add('active');
        feedbackBtn.classList.remove('active');
    }
}

/**
 * Handle Form Submissions Pipeline and route submissions to Google Sheets
 */
function setupFormListeners() {
    const feedbackForm = document.getElementById('feedback-form');
    const contactForm = document.getElementById('contact-form');
    const alertBox = document.getElementById('form-alert');
    const alertText = document.getElementById('alert-text');

    feedbackForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const categorySelection = document.getElementById('feedback-category').value;
        const suggestionText = document.getElementById('feedback-text').value;
        const submitBtn = feedbackForm.querySelector('.submit-btn');

        submitBtn.innerText = "Submitting...";
        submitBtn.disabled = true;

        const payload = {
            category: categorySelection,
            text: suggestionText
        };

        try {
            await fetch(FEEDBACK_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            feedbackForm.classList.add('hidden');
            alertBox.classList.remove('hidden');
            alertText.innerText = `Mabuhay! Your anonymous suggestion regarding the selected program category has been safely recorded for council review.`;
            feedbackForm.reset();

        } catch (err) {
            console.error("Form transmission anomaly:", err);
            alertBox.classList.remove('hidden');
            alertBox.className = "status-box error-box";
            alertText.innerText = "Connection anomaly. Please try submitting your suggestion again.";
        } finally {
            submitBtn.innerText = "Submit Anonymously";
            submitBtn.disabled = false;
        }
    });

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const clientName = document.getElementById('contact-name').value;
        feedbackForm.classList.add('hidden');
        contactForm.classList.add('hidden');
        alertBox.classList.remove('hidden');
        alertText.innerText = `Thank you ${clientName}! Your request has been logged. We will reach out shortly via your contact channels.`;
        contactForm.reset();
    });
}

/**
 * Automated FAQ Desk AI Knowledge Engine
 */
function setupFAQEngine() {
    const chatForm = document.getElementById('chat-input-area');
    const userInput = document.getElementById('user-chat-input');
    const chatContainer = document.getElementById('chat-messages');

    function appendMessage(text, side) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${side === 'user' ? 'user-message' : 'ai-message'}`;
        msgDiv.innerText = text;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; 
    }

    function processAIResponse(query) {
        const normalized = query.toLowerCase();
        
        if (normalized.includes('linggo') || normalized.includes('kabataan') || normalized.includes('sports') || normalized.includes('august')) {
            return "📅 SK LINGGO NG KABATAAN 2026\n• Target Date: August 2026\n• Status: Planning Phase\n• Details: This annual youth celebration will focus on localized sports clinics, leadership development seminars, and team-building activities to foster unity among our community youth.";
        }
        if (normalized.includes('library') || normalized.includes('study') || normalized.includes('wi-fi') || normalized.includes('wifi') || normalized.includes('hub')) {
            return "💻 BARANGAY YOUTH E-LIBRARY & STUDY HUB\n• Target Date: Ongoing Deployment\n• Status: In Progress\n• Details: We are setting up a dedicated, air-conditioned study hall inside the barangay hall premises. It will feature free high-speed Wi-Fi, computer access, and a quiet learning environment tailored for students.";
        }
        if (normalized.includes('waste') || normalized.includes('bin') || normalized.includes('recycle') || normalized.includes('trash') || normalized.includes('clean')) {
            return "♻️ LOCALIZED WASTE SEGREGATION DRIVE\n• Target Date: Completed\n• Status: Fully Executed\n• Details: Color-coded recycling storage bins have been successfully distributed across the main puroks to encourage proper ecological disposal. Thank you for your cooperation!";
        }
        if (normalized.includes('project') || normalized.includes('list') || normalized.includes('happen') || normalized.includes('update') || normalized.includes('status') || normalized.includes('active')) {
            return "📋 CURRENT PROJECT OVERVIEW:\n\n1. SK Linggo ng Kabataan 2026 (Planning Phase - Target: August 2026)\n2. Barangay Youth E-Library & Study Hub (In Progress - Ongoing Deployment)\n3. Localized Waste Segregation Drive (Completed & Deployed)\n\nYou can scroll down to the Live Project Pipeline grid to view full description logs or track live adjustments!";
        }
        if (normalized.includes('help') || normalized.includes('hi') || normalized.includes('hello') || normalized.includes('ask') || normalized.includes('question')) {
            return "👋 Hello! I can instantly provide detailed parameters regarding our core programs:\n• Type 'library' for the Study Hub.\n• Type 'linggo' for the youth sports/seminar events.\n• Type 'waste' for the sanitation drives.\n• Type 'projects' to see a summary list of everything.\n\nIf you want to file a custom personal concern, just use the 'Message Us Personally' tab on the left!";
        }
        
        return "I want to make sure you get the right info! I didn't find an exact keyword match for that phrase, but you can type 'projects' to see a full list of what we are tracking, or type 'help' to see my guide directory. You can also message our officers directly using the panel on the left!";
    }

    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const rawText = userInput.value.trim();
        if (!rawText) return;

        appendMessage(rawText, 'user');
        userInput.value = '';

        setTimeout(() => {
            const botOutputText = processAIResponse(rawText);
            appendMessage(botOutputText, 'ai');
        }, 650);
    });
}

// Bind interactive event hooks securely into the global runtime stack loading phase
window.addEventListener('DOMContentLoaded', () => {
    fetchLiveAnnouncement();
    fetchLiveSlideshow(); 
    fetchLiveCouncil();
    fetchLiveProjects();
    setupFormListeners();
    setupFAQEngine();
});
