/**
 * SK Portal Database Controller Configuration
 */
const SHEET_ID = '1bkhpqGTzS1_NehWzCEfnpAy5gaz9NZldEIVq7gs04OM'; 
const SHEET_TAB_NAME = 'Projects';
const MEMBERS_TAB_NAME = 'Members';
const SLIDESHOW_TAB_NAME = 'Slideshow';

// Auto-generated cache-buster to instantly pull live updates from your Google Sheet
const cacheBuster = `&cb=${new Date().getTime()}`;

const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TAB_NAME}${cacheBuster}`;
const COUNCIL_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${MEMBERS_TAB_NAME}${cacheBuster}`;
const SLIDESHOW_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SLIDESHOW_TAB_NAME}${cacheBuster}`;

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
 * Controls the top-level high-priority Emergency Banner layout
 */
function processEmergencyAlert(alertText) {
    const emergencyBar = document.getElementById('emergency-announcement');
    const emergencyPara = document.getElementById('emergency-text');

    if (!emergencyBar) return;

    if (!alertText || alertText.trim() === "" || alertText.trim() === "N/A" || alertText.trim().toLowerCase() === "none") {
        emergencyBar.style.setProperty('display', 'none', 'important');
    } else {
        emergencyBar.style.setProperty('display', 'flex', 'important');
        if (emergencyPara) emergencyPara.innerText = alertText;
    }
}

/**
 * Renders the brand new permanent Bulletin board text in the middle section
 */
function processGeneralBulletin(bulletinText) {
    const bulletinContainer = document.getElementById('general-bulletin-container');
    if (!bulletinContainer) return;

    if (!bulletinText || bulletinText.trim() === "" || bulletinText.trim() === "N/A") {
        bulletinContainer.innerHTML = `<p style="font-size: 14px; color: #94a3b8; font-style: italic;">No active council announcements posted at this moment.</p>`;
    } else {
        bulletinContainer.innerHTML = `
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px;">
                <p style="font-size: 14px; color: #334155; line-height: 1.6; font-weight: 500;">${bulletinText}</p>
            </div>
        `;
    }
}

/**
 * Pulls, segregates, and renders announcements and project trackers together
 */
async function fetchLiveProjects() {
    const gridContainer = document.getElementById('project-grid');
    const loadingIndicator = document.getElementById('loading-state');
    const errorIndicator = document.getElementById('error-state');

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Google Sheet access denied.");
        
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);

        if (cleanRows.length <= 1) {
            processEmergencyAlert("");
            processGeneralBulletin("");
            if (loadingIndicator) loadingIndicator.innerHTML = `<p style="font-size: 12px; color: #94a3b8;">No records posted currently.</p>`;
            return;
        }

        // 1. Extract Emergency Alert from Row 2, Column A (index [1][0])
        const rawEmergency = cleanRows[1] ? cleanRows[1][0] : "";
        processEmergencyAlert(rawEmergency);

        // 2. Extract General Announcement from Row 3, Column A (index [2][0])
        const rawGeneral = cleanRows[2] ? cleanRows[2][0] : "";
        processGeneralBulletin(rawGeneral);

        if (gridContainer) gridContainer.innerHTML = '';

        // 3. Project pipeline loop now starts safely from Row 4 (index i = 3) downwards!
        let projectCount = 0;
        for (let i = 3; i < cleanRows.length; i++) { 
            const row = cleanRows[i];
            if (!row || row.length < 3 || !row[0]) continue; 

            projectCount++;
            const title = row[0];
            const date = row[1] || 'N/A';
            const status = row[2] || 'Planning';
            const details = row[3] || 'No description logged.';

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

            if (gridContainer) {
                gridContainer.innerHTML += `
                    <div class="project-card">
                        <div>
                            <div class="card-top">
                                <h3>${title}</h3>
                                <span class="${badgeStyleClass}">${statusMarkup}</span>
                            </div>
                            <p class="card-details">${details}</p>
                        </div>
                        <div class="card-footer">
                            <i class="fa-regular fa-calendar"></i> Target execution: ${date}
                        </div>
                    </div>
                `;
            }
        }

        if (projectCount === 0 && loadingIndicator) {
            loadingIndicator.innerHTML = `<p style="font-size: 12px; color: #94a3b8;">No active project tracking records logged.</p>`;
            return;
        }

        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (gridContainer) gridContainer.classList.remove('hidden');

    } catch (err) {
        console.error("Pipeline Engine Error:", err);
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (errorIndicator) {
            errorIndicator.classList.remove('hidden');
            errorIndicator.querySelector('p').innerText = err.message;
        }
    }
}

/**
 * Fetches dynamic banner carousels from the spreadsheet dashboard configuration
 */
async function fetchLiveSlideshow() {
    const slideshowContainer = document.getElementById('hero-bg-slideshow');
    try {
        const response = await fetch(SLIDESHOW_DATA_URL);
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        if (cleanRows.length <= 1) { if(slideshowContainer) slideshowContainer.style.backgroundColor = "#0f172a"; return; }
        if (slideshowContainer) slideshowContainer.innerHTML = '';
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i];
            if (!row[0]) continue; 
            if (slideshowContainer) {
                slideshowContainer.innerHTML += `
                    <div class="custom-slide fade">
                        <img src="${row[0]}" alt="SK Documentation Slide">
                    </div>
                `;
            }
        }
        slideTrackerIndex = 0;
        runLiveSlideshow();
    } catch (err) { console.error(err); }
}

let slideTrackerIndex = 0;
function runLiveSlideshow() {
    const slides = document.getElementsByClassName("custom-slide");
    if (slides.length === 0) return;
    for (let i = 0; i < slides.length; i++) slides[i].style.display = "none";
    slideTrackerIndex++;
    if (slideTrackerIndex > slides.length) slideTrackerIndex = 1; 
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
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        if (cleanRows.length <= 1) { if(loadingIndicator) loadingIndicator.innerHTML = `<p style="font-size: 12px; color: #94a3b8;">No records posted.</p>`; return; }
        if (gridContainer) gridContainer.innerHTML = '';
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i];
            if (row.length < 3 || !row[0]) continue; 
            const role = row[0], name = row[1], purok = row[2] || 'Unassigned', contact = row[3] || 'No contact';
            let cardClass = 'member-card';
            if (role.toLowerCase().includes('chair') || role.toLowerCase().includes('kapitan')) cardClass = 'member-card chairperson-card';
            else if (role.toLowerCase().includes('secretary') || role.toLowerCase().includes('treasurer')) cardClass = 'member-card executive-card';
            if (gridContainer) {
                gridContainer.innerHTML += `
                    <div class="${cardClass}">
                        <span class="member-role">${role}</span>
                        <h3 class="member-name">${name}</h3>
                        <span class="member-purok"><i class="fa-solid fa-location-dot"></i> ${purok}</span>
                        <div class="member-contact"><i class="fa-solid fa-phone"></i> ${contact}</div>
                    </div>
                `;
            }
        }
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (gridContainer) gridContainer.classList.remove('hidden');
    } catch (err) { console.error(err); }
}

function switchTab(targetTab) {
    const feedbackForm = document.getElementById('feedback-form'), contactForm = document.getElementById('contact-form');
    const feedbackBtn = document.getElementById('tab-feedback-btn'), contactBtn = document.getElementById('tab-contact-btn');
    const alertBox = document.getElementById('form-alert');
    if(alertBox) alertBox.classList.add('hidden');
    if (targetTab === 'feedback') {
        if(feedbackForm) feedbackForm.classList.remove('hidden'); if(contactForm) contactForm.classList.add('hidden');
        if(feedbackBtn) feedbackBtn.classList.add('active'); if(contactBtn) contactBtn.classList.remove('active');
    } else {
        if(contactForm) contactForm.classList.remove('hidden'); if(feedbackForm) feedbackForm.classList.add('hidden');
        if(contactBtn) contactBtn.className = 'active'; if(feedbackBtn) feedbackBtn.classList.remove('active');
    }
}

function setupFormListeners() {
    const feedbackForm = document.getElementById('feedback-form'), contactForm = document.getElementById('contact-form');
    const alertBox = document.getElementById('form-alert'), alertText = document.getElementById('alert-text');
    if(feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = feedbackForm.querySelector('.submit-btn');
            submitBtn.innerText = "Submitting..."; submitBtn.disabled = true;
            try {
                await fetch(FEEDBACK_SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: document.getElementById('feedback-category').value, text: document.getElementById('feedback-text').value }) });
                feedbackForm.classList.add('hidden'); alertBox.classList.remove('hidden');
                alertText.innerText = `Mabuhay! Your suggestion has been successfully recorded anonymously.`;
                feedbackForm.reset();
            } catch (err) { alertBox.classList.remove('hidden'); alertText.innerText = "Submission exception detected."; }
            finally { submitBtn.innerText = "Submit Anonymously"; submitBtn.disabled = false; }
        });
    }
    if(contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); const name = document.getElementById('contact-name').value;
            if(feedbackForm) feedbackForm.classList.add('hidden'); contactForm.classList.add('hidden'); alertBox.classList.remove('hidden');
            alertText.innerText = `Thank you ${name}! Your request has been logged.`; contactForm.reset();
        });
    }
}

function setupFAQEngine() {
    const chatForm = document.getElementById('chat-input-area'), userInput = document.getElementById('user-chat-input'), chatContainer = document.getElementById('chat-messages');
    if(!chatForm) return;
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault(); const rawText = userInput.value.trim(); if (!rawText) return;
        const msg = document.createElement('div'); msg.className = 'message user-message'; msg.innerText = rawText; chatContainer.appendChild(msg); userInput.value = '';
        setTimeout(() => {
            const reply = document.createElement('div'); reply.className = 'message ai-message';
            reply.innerText = "I am processing your query regarding our dynamic barangay community services. For immediate manual verification, please contact our desk officers directly!";
            chatContainer.appendChild(reply); chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 650);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchLiveSlideshow(); 
    fetchLiveCouncil();
    fetchLiveProjects();
    setupFormListeners();
    setupFAQEngine();
});
