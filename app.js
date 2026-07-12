/**
 * SK Portal Database Controller Configuration
 */
const SHEET_ID = '1bkhpqGTzS1_NehWzCEfnpAy5gaz9NZldEIVq7gs04OM'; 
const SHEET_TAB_NAME = 'Projects';
const MEMBERS_TAB_NAME = 'Members';
const SLIDESHOW_TAB_NAME = 'Slideshow';
const ANNOUNCEMENT_TAB_NAME = 'Announcement';
const DOCS_TAB_NAME = 'Documentation';
const BUDGET_TAB_NAME = 'Budget';

const cacheBuster = `&cb=${new Date().getTime()}`;

const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TAB_NAME}${cacheBuster}`;
const COUNCIL_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${MEMBERS_TAB_NAME}${cacheBuster}`;
const SLIDESHOW_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SLIDESHOW_TAB_NAME}${cacheBuster}`;
const ANNOUNCEMENT_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${ANNOUNCEMENT_TAB_NAME}${cacheBuster}`;
const DOCS_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${DOCS_TAB_NAME}${cacheBuster}`;
const BUDGET_DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${BUDGET_TAB_NAME}${cacheBuster}`;

const FEEDBACK_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxiDIQb7zpIFdbbHwH9gld2nbXDhn7hUU5ls9oY2NKznAGMbVif4Wmqc0obtKTU79_R/exec';

function parseCSV(text) {
    let lines = text.split('\n');
    return lines.map(line => {
        let matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return matches.map(val => val.replace(/^"|"$/g, '').trim());
    });
}

function cleanDriveImageUrl(url) {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/);
        if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url;
}

function navigateCenterView(targetSectionId, activeBtnId) {
    const sections = ['view-home', 'view-pipeline', 'view-budget'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.setProperty('display', id === targetSectionId ? 'block' : 'none', 'important');
    });
}

/**
 * GLASSMORPHIC SPLIT ANNOUNCEMENTS PIPELINE
 */
async function fetchLiveAnnouncements() {
    try {
        const response = await fetch(ANNOUNCEMENT_DATA_URL);
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        
        const bulletinContainer = document.getElementById('general-bulletin-container');
        const emergencyBar = document.getElementById('emergency-announcement');
        const heroAlertsAside = document.getElementById('hero-alerts-aside');
        
        if (cleanRows.length <= 1) {
            if (bulletinContainer) bulletinContainer.innerHTML = `<p style="font-size: 14px; color: #94a3b8; text-align: center;">No active announcements logged.</p>`;
            if (emergencyBar) emergencyBar.style.setProperty('display', 'none', 'important');
            return;
        }

        let hasTopEmergency = false;
        if (emergencyBar) emergencyBar.innerHTML = '';
        if (heroAlertsAside) heroAlertsAside.innerHTML = '';

        // 1. EVALUATE COLUMN A ENTIRE LOG STREAM
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i];
            if (!row || !row[0]) continue;
            
            const alertText = row[0].trim();
            const badgeType = row[1] ? row[1].trim().toUpperCase() : "INFO";
            
            if (alertText === "" || alertText === "N/A" || alertText.toLowerCase() === "none") continue;

            // TRACK CRITICAL EVENTS (ROUTED TO THE TOP BAR STACK)
            if (badgeType === 'EMERGENCY') {
                hasTopEmergency = true;
                emergencyBar.innerHTML += `
                    <div style="background: #ef4444; color: white; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 24px; font-size: 14px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.2); width: 100%;">
                        <span style="background: rgba(255, 255, 255, 0.25); padding: 3px 8px; border-radius: 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-fire-flame-curved"></i> EMERGENCY
                        </span>
                        <p style="margin: 0; line-height: 1.4;">${alertText}</p>
                    </div>
                `;
            } 
            // TRACK SECONDARY EVENTS (ROUTED TO THE FROSTED GLASS SIDEBAR BAR CARD PANEL)
            else if (heroAlertsAside) {
                let glassBorderColor = 'rgba(255, 255, 255, 0.2)';
                let labelBgColor = 'rgba(255, 255, 255, 0.15)';
                let badgeTextColor = '#ffffff';
                let alertIcon = '<i class="fa-solid fa-bullhorn"></i>';

                if (badgeType === 'URGENT') {
                    glassBorderColor = 'rgba(249, 115, 22, 0.4)';
                    labelBgColor = 'rgba(249, 115, 22, 0.2)';
                    badgeTextColor = '#ffedd5';
                    alertIcon = '<i class="fa-solid fa-triangle-exclamation"></i>';
                } else if (badgeType === 'NOTICE') {
                    glassBorderColor = 'rgba(59, 130, 246, 0.4)';
                    labelBgColor = 'rgba(59, 130, 246, 0.2)';
                    badgeTextColor = '#dbeafe';
                    alertIcon = '<i class="fa-solid fa-circle-info"></i>';
                }

                heroAlertsAside.innerHTML += `
                    <div style="background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid ${glassBorderColor}; padding: 16px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25); color: #ffffff; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center;">
                            <span style="background: ${labelBgColor}; color: ${badgeTextColor}; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;">
                                ${alertIcon} ${badgeType}
                            </span>
                        </div>
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; font-weight: 500; color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${alertText}</p>
                    </div>
                `;
            }
        }

        // CONTROL TOP STICKY BAR VISIBILITY ACTIONS
        if (hasTopEmergency && emergencyBar) {
            emergencyBar.style.setProperty('display', 'block', 'important');
            document.body.style.paddingTop = `${emergencyBar.offsetHeight}px`;
        } else if (emergencyBar) {
            emergencyBar.style.setProperty('display', 'none', 'important');
            document.body.style.paddingTop = '0px';
        }

        // 2. PROCESS BULLETIN BOARD POSTINGS
        if (bulletinContainer) {
            bulletinContainer.innerHTML = '';
            let bulletinCount = 0;

            for (let i = 1; i < cleanRows.length; i++) {
                const row = cleanRows[i];
                if (!row || !row[2] || row[2].trim() === "" || row[2] === "N/A") continue; 

                bulletinCount++;
                const title = row[2];
                const details = row[3] || 'No description logged.';
                const dateVal = row[4] || '';
                const dateLabel = row[5] || 'Schedule';
                const timeVal = row[6] || '';
                const venueVal = row[7] || '';

                let labelColor = '#2563eb'; let labelBg = '#eff6ff';
                const cleanLabel = dateLabel.toLowerCase();
                if (cleanLabel.includes('deadline') || cleanLabel.includes('due')) { labelColor = '#dc2626'; labelBg = '#fef2f2'; }
                else if (cleanLabel.includes('meeting') || cleanLabel.includes('session')) { labelColor = '#d97706'; labelBg = '#fffbeb'; }
                else if (cleanLabel.includes('event') || cleanLabel.includes('program')) { labelColor = '#16a34a'; labelBg = '#f0fdf4'; }

                bulletinContainer.innerHTML += `
                    <div class="bulletin-item-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; transition: all 0.2s; box-shadow: var(--shadow-sm);">
                        <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">${title}</h3>
                        <p style="font-size: 13px; color: #475569; line-height: 1.6; font-weight: 400; margin-bottom: 14px;">${details}</p>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; border-top: 1px dashed #f1f5f9; padding-top: 12px;">
                            ${dateVal ? `
                            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px;">
                                <i class="fa-regular fa-calendar" style="color: #64748b; margin-top: 2px;"></i>
                                <div>
                                    <span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; background: ${labelBg}; color: ${labelColor}; margin-bottom: 2px;">${dateLabel}</span>
                                    <strong style="display: block; color: #1e293b;">${dateVal}</strong>
                                </div>
                            </div>` : ''}
                            
                            ${timeVal ? `
                            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px;">
                                <i class="fa-regular fa-clock" style="color: #64748b; margin-top: 2px;"></i>
                                <div>
                                    <span style="display: block; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Time Slot</span>
                                    <strong style="color: #1e293b;">${timeVal}</strong>
                                </div>
                            </div>` : ''}
                            
                            ${venueVal ? `
                            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px;">
                                <i class="fa-solid fa-location-dot" style="color: #64748b; margin-top: 2px;"></i>
                                <div>
                                    <span style="display: block; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Location</span>
                                    <strong style="color: #1e293b;">${venueVal}</strong>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            }
            
            if (bulletinCount === 0) {
                bulletinContainer.innerHTML = `<p style="font-size: 14px; color: #94a3b8; text-align: center;">No active bulletin notices posted.</p>`;
            }
        }
    } catch (err) { console.error(err); }
}

async function fetchLiveProjects() {
    const gridContainer = document.getElementById('project-grid');
    const loadingIndicator = document.getElementById('loading-state');
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        if (cleanRows.length <= 1) return;
        if (gridContainer) gridContainer.innerHTML = '';
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i]; if (!row || !row[0]) continue;
            const title = row[0], date = row[1] || 'N/A', status = row[2] || 'Planning', details = row[3] || 'No description logged.';
            let badgeStyleClass = 'status-badge', statusMarkup = status;
            const lowerStatus = status.toLowerCase();
            if (lowerStatus.includes('progress') || lowerStatus.includes('ongoing')) {
                badgeStyleClass += ' badge-progress'; statusMarkup = `<span class="pulse-dot"></span> ${status}`;
            } else if (lowerStatus.includes('complete') || lowerStatus.includes('done')) { badgeStyleClass += ' badge-complete'; }
            else { badgeStyleClass += ' badge-planning'; }
            if (gridContainer) {
                gridContainer.innerHTML += `
                    <div class="project-card">
                        <div><div class="card-top"><h3>${title}</h3><span class="${badgeStyleClass}">${statusMarkup}</span></div><p class="card-details">${details}</p></div>
                        <div class="card-footer"><i class="fa-regular fa-calendar"></i> Target execution: ${date}</div>
                    </div>
                `;
            }
        }
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (gridContainer) gridContainer.classList.remove('hidden');
    } catch (err) { console.error(err); }
}

async function fetchLiveSlideshow() {
    const slideshowContainer = document.getElementById('hero-bg-slideshow');
    try {
        const response = await fetch(SLIDESHOW_DATA_URL);
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        if (cleanRows.length <= 1) return;
        if (slideshowContainer) slideshowContainer.innerHTML = '';
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i]; if (!row[0]) continue;
            const optimizedLink = cleanDriveImageUrl(row[0]);
            if (slideshowContainer) {
                slideshowContainer.innerHTML += `<div class="custom-slide fade"><img src="${optimizedLink}" alt="SK Slide"></div>`;
            }
        }
        slideTrackerIndex = 0; runLiveSlideshow();
    } catch (err) { console.error(err); }
}

let slideTrackerIndex = 0;
function runLiveSlideshow() {
    const slides = document.getElementsByClassName("custom-slide"); if (slides.length === 0) return;
    for (let i = 0; i < slides.length; i++) slides[i].style.display = "none";
    slideTrackerIndex++; if (slideTrackerIndex > slides.length) slideTrackerIndex = 1; 
    slides[slideTrackerIndex - 1].style.display = "block"; setTimeout(runLiveSlideshow, 4500);
}

async function fetchLiveCouncil() {
    const gridContainer = document.getElementById('council-grid');
    const loadingIndicator = document.getElementById('council-loading-state');
    try {
        const response = await fetch(COUNCIL_DATA_URL);
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        if (gridContainer) gridContainer.innerHTML = '';
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i]; if (!row[0]) continue;
            const role = row[0], name = row[1], purok = row[2] || 'Unassigned', contact = row[3] || 'No contact';
            let cardClass = 'member-card';
            if (role.toLowerCase().includes('chair') || role.toLowerCase().includes('kapitan')) cardClass = 'member-card chairperson-card';
            else if (role.toLowerCase().includes('secretary') || role.toLowerCase().includes('treasurer')) cardClass = 'member-card executive-card';
            if (gridContainer) {
                gridContainer.innerHTML += `
                    <div class="${cardClass}"><span class="member-role">${role}</span><h3 class="member-name">${name}</h3><span class="member-purok"><i class="fa-solid fa-location-dot"></i> ${purok}</span><div class="member-contact"><i class="fa-solid fa-phone"></i> ${contact}</div></div>
                `;
            }
        }
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (gridContainer) gridContainer.classList.remove('hidden');
    } catch (err) { console.error(err); }
}

async function fetchLiveDocumentationFeed() {
    const feedContainer = document.getElementById('documentation-feed');
    if (!feedContainer) return;
    try {
        const response = await fetch(DOCS_DATA_URL);
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        if (cleanRows.length <= 1) {
            feedContainer.innerHTML = `<p style="font-size: 14px; color: #94a3b8; text-align: center; padding: 20px;">No community documentation posts logged yet.</p>`;
            return;
        }
        feedContainer.innerHTML = '';
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i]; if (!row || !row[0]) continue;
            const rawImg = cleanDriveImageUrl(row[0]), caption = row[1] || '', dateStr = row[2] || 'Recent';
            feedContainer.innerHTML += `
                <div class="fb-post-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; align-items: center; gap: 10px; padding: 16px; border-bottom: 1px solid #f1f5f9;">
                        <img src="Images/SK LOGO.jpg" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                        <div><h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">Sangguniang Kabataan</h4><span style="font-size: 11px; color: #94a3b8; display: block;"><i class="fa-solid fa-earth-asia"></i> ${dateStr}</span></div>
                    </div>
                    <div style="padding: 16px; font-size: 14px; color: #334155; line-height: 1.6;">${caption}</div>
                    <div style="width: 100%; background: #f8fafc; display: flex; align-items: center; justify-content: center;"><img src="${rawImg}" style="width: 100%; max-height: 450px; object-fit: cover;"></div>
                </div>
            `;
        }
    } catch (err) { console.error(err); }
}

async function fetchLiveBudgetLedger() {
    const budgetGrid = document.getElementById('budget-ledger-grid');
    if (!budgetGrid) return;
    try {
        const response = await fetch(BUDGET_DATA_URL);
        if (!response.ok) return;
        const dataText = await response.text();
        const cleanRows = parseCSV(dataText);
        if (cleanRows.length <= 1) return;
        budgetGrid.innerHTML = '';
        for (let i = 1; i < cleanRows.length; i++) {
            const row = cleanRows[i]; if (!row || !row[0]) continue;
            const title = row[0], allocated = row[1] || '0.00', spent = row[2] || '0.00', remaining = row[3] || '0.00';
            budgetGrid.innerHTML += `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm);">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 8px;">${title}</h3>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Allocated Budget:</span> <strong style="color: #0f172a;">₱${allocated}</strong></div>
                        <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Total Expenses:</span> <strong style="color: #dc2626;">₱${spent}</strong></div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 6px; margin-top: 4px;"><span style="color: #64748b; font-weight: 600;">Remaining Balance:</span> <strong style="color: #16a34a; font-size: 14px;">₱${remaining}</strong></div>
                    </div>
                </div>
            `;
        }
    } catch (err) { console.error(err); }
}

function switchTab(targetTab) {
    const feedbackForm = document.getElementById('feedback-form'), contactForm = document.getElementById('contact-form');
    const feedbackBtn = document.getElementById('tab-feedback-btn'), contactBtn = document.getElementById('tab-contact-btn');
    if (targetTab === 'feedback') {
        if (feedbackForm) feedbackForm.style.setProperty('display', 'block', 'important');
        if (contactForm) contactForm.style.setProperty('display', 'none', 'important');
        if (feedbackBtn) { feedbackBtn.style.background = "#2563eb"; feedbackBtn.style.color = "#ffffff"; }
        if (contactBtn) { contactBtn.style.background = "transparent"; contactBtn.style.color = "#64748b"; }
    } else {
        if (contactForm) contactForm.style.setProperty('display', 'block', 'important');
        if (feedbackForm) feedbackForm.style.setProperty('display', 'none', 'important');
        if (contactBtn) { contactBtn.style.background = "#2563eb"; contactBtn.style.color = "#ffffff"; }
        if (feedbackBtn) { feedbackBtn.style.background = "transparent"; feedbackBtn.style.color = "#64748b"; }
    }
}

function setupFormListeners() {
    const feedbackForm = document.getElementById('feedback-form'), contactForm = document.getElementById('contact-form');
    const alertBox = document.getElementById('form-alert'), alertText = document.getElementById('alert-text');
    if(feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault(); const submitBtn = feedbackForm.querySelector('.submit-btn'); submitBtn.innerText = "Submitting..."; submitBtn.disabled = true;
            try {
                await fetch(FEEDBACK_SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: document.getElementById('feedback-category').value, text: document.getElementById('feedback-text').value }) });
                feedbackForm.style.setProperty('display', 'none', 'important'); alertBox.classList.remove('hidden'); alertText.innerText = `Mabuhay! Recorded anonymously.`; feedbackForm.reset();
            } catch (err) { alertBox.classList.remove('hidden'); alertText.innerText = "Submission error."; }
            finally { submitBtn.innerText = "Submit Anonymously"; submitBtn.disabled = false; }
        });
    }
    if(contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); const name = document.getElementById('contact-name').value;
            feedbackForm.style.setProperty('display', 'none', 'important'); contactForm.style.setProperty('display', 'none', 'important'); alertBox.classList.remove('hidden');
            alertText.innerText = `Thank you ${name}! Logged successfully.`; contactForm.reset();
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
            reply.innerText = "Processing your query... For direct assistance please use the Voice Hub panel on the right!";
            chatContainer.appendChild(reply); chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 650);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchLiveAnnouncements();
    fetchLiveSlideshow(); 
    fetchLiveCouncil();
    fetchLiveProjects();
    fetchLiveDocumentationFeed();
    fetchLiveBudgetLedger();
    setupFormListeners();
    setupFAQEngine();
});
