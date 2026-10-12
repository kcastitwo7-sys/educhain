/**
 * EduChain - Scholarship Directory & Card Rendering Module
 * Manages fetching scholarship data, rendering responsive cards,
 * handling detail modal popups, and toggling tracker persistence.
 */

import { filterScholarships, sortScholarships, formatDeadlineBadge } from './filters.js';
import { isScholarshipSaved, saveApplication, removeApplication } from './storage.js';
import { showToast } from './app.js';

let allScholarships = [];
let currentFilters = {
  query: '',
  country: 'all',
  educationLevel: 'all',
  fundingType: 'all',
  deadlineStatus: 'all'
};
let currentSort = 'deadline-soonest';

/**
 * Initialize Scholarship directory
 */
export async function initScholarshipsDirectory() {
  const container = document.getElementById('scholarships-grid');
  if (!container) return; // Not on scholarships page

  try {
    const response = await fetch('/data/scholarships.json');
    if (!response.ok) {
      throw new Error(`Failed to load scholarships: ${response.statusText}`);
    }
    allScholarships = await response.json();
    setupFilterListeners();
    renderScholarships();
    setupModalListeners();
  } catch (error) {
    console.error('[EduChain] Scholarship dataset error:', error);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>Could not load scholarships dataset</h3>
        <p>Ensure the data/scholarships.json file is present and served properly.</p>
      </div>
    `;
  }
}

/**
 * Bind filter and search inputs
 */
function setupFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const countrySelect = document.getElementById('filter-country');
  const levelSelect = document.getElementById('filter-level');
  const fundingSelect = document.getElementById('filter-funding');
  const deadlineSelect = document.getElementById('filter-deadline');
  const sortSelect = document.getElementById('sort-select');
  const resetBtn = document.getElementById('btn-reset-filters');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.query = e.target.value;
      if (searchClear) {
        searchClear.style.display = e.target.value ? 'block' : 'none';
      }
      renderScholarships();
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentFilters.query = '';
      searchClear.style.display = 'none';
      renderScholarships();
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', (e) => {
      currentFilters.country = e.target.value;
      renderScholarships();
    });
  }

  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      currentFilters.educationLevel = e.target.value;
      renderScholarships();
    });
  }

  if (fundingSelect) {
    fundingSelect.addEventListener('change', (e) => {
      currentFilters.fundingType = e.target.value;
      renderScholarships();
    });
  }

  if (deadlineSelect) {
    deadlineSelect.addEventListener('change', (e) => {
      currentFilters.deadlineStatus = e.target.value;
      renderScholarships();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderScholarships();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilters = {
        query: '',
        country: 'all',
        educationLevel: 'all',
        fundingType: 'all',
        deadlineStatus: 'all'
      };
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.style.display = 'none';
      if (countrySelect) countrySelect.value = 'all';
      if (levelSelect) levelSelect.value = 'all';
      if (fundingSelect) fundingSelect.value = 'all';
      if (deadlineSelect) deadlineSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'deadline-soonest';
      renderScholarships();
    });
  }

  // Listen for storage changes from other components/tabs
  window.addEventListener('educhain:storage-changed', () => {
    renderScholarships();
  });
}

/**
 * Filter, sort, and render cards
 */
export function renderScholarships() {
  const container = document.getElementById('scholarships-grid');
  const countDisplay = document.getElementById('results-count');
  if (!container) return;

  const filtered = filterScholarships(allScholarships, currentFilters);
  const sorted = sortScholarships(filtered, currentSort);

  if (countDisplay) {
    countDisplay.textContent = `Showing ${sorted.length} of ${allScholarships.length} opportunities`;
  }

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No scholarships found</h3>
        <p>No educational opportunities match your selected search or filter criteria. Try clearing or relaxing your filters.</p>
        <button class="btn btn-secondary btn-sm" id="empty-reset-btn">Reset All Filters</button>
      </div>
    `;

    const emptyReset = document.getElementById('empty-reset-btn');
    if (emptyReset) {
      emptyReset.addEventListener('click', () => {
        const resetBtn = document.getElementById('btn-reset-filters');
        if (resetBtn) resetBtn.click();
      });
    }
    return;
  }

  container.innerHTML = sorted.map(item => createScholarshipCardHTML(item)).join('');

  // Attach card event listeners
  attachCardActionEvents(container);
}

/**
 * Generate card HTML string
 */
function createScholarshipCardHTML(item) {
  const isSaved = isScholarshipSaved(item.id);
  const deadlineInfo = formatDeadlineBadge(item.deadline);

  // Funding badge style
  let fundingBadgeClass = 'badge-tuition';
  if (item.fundingType.includes('Fully')) fundingBadgeClass = 'badge-fully';
  else if (item.fundingType.includes('Partially')) fundingBadgeClass = 'badge-partial';
  else if (item.fundingType.includes('Research')) fundingBadgeClass = 'badge-research';

  const eligibilityList = (item.eligibility || []).slice(0, 2).map(e => `<li>${e}</li>`).join('');

  return `
    <article class="scholarship-card" data-id="${item.id}">
      <div>
        <div class="card-top-row">
          <span class="provider-name">${escapeHTML(item.provider)}</span>
          <span class="badge badge-demo" title="This is a demonstration record for hackathon evaluation">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            ${escapeHTML(item.verificationStatus || 'Demo Data')}
          </span>
        </div>

        <h3 class="scholarship-title">${escapeHTML(item.name)}</h3>

        <div class="card-tags">
          <span class="badge badge-country">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${escapeHTML(item.country)}
          </span>
          <span class="badge badge-level">${escapeHTML(item.educationLevel)}</span>
          <span class="badge ${fundingBadgeClass}">${escapeHTML(item.fundingType)}</span>
        </div>

        <div class="funding-details-box">
          <strong>Coverage & Benefits</strong>
          ${escapeHTML(item.fundingDetails)}
        </div>

        <ul class="eligibility-preview-list">
          ${eligibilityList}
        </ul>
      </div>

      <div>
        <div class="card-footer-meta">
          <div class="deadline-indicator ${deadlineInfo.isUrgent ? 'urgent' : ''}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${deadlineInfo.label}</span>
          </div>
          ${item.lastChecked ? `<span class="text-dim" style="font-size:0.75rem;">Checked: ${item.lastChecked}</span>` : ''}
        </div>

        <div class="card-actions-grid">
          <button class="btn btn-secondary btn-sm btn-view-details" data-id="${item.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View Details
          </button>
          
          <button class="btn ${isSaved ? 'btn-outline' : 'btn-primary'} btn-sm btn-toggle-save" data-id="${item.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>${isSaved ? 'Saved in Tracker' : 'Save & Track'}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Attach button actions inside cards
 */
function attachCardActionEvents(container) {
  // View Details
  container.querySelectorAll('.btn-view-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = allScholarships.find(s => s.id === id);
      if (item) openScholarshipModal(item);
    });
  });

  // Save / Track
  container.querySelectorAll('.btn-toggle-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = allScholarships.find(s => s.id === id);
      if (!item) return;

      const currentlySaved = isScholarshipSaved(id);
      if (currentlySaved) {
        removeApplication(id);
        showToast('Removed from tracker', `"${item.name}" was removed from your tracker.`, 'info');
      } else {
        saveApplication(id, { status: 'Interested' });
        showToast('Added to tracker!', `"${item.name}" is now in your student dashboard.`, 'success');
      }
      renderScholarships();
    });
  });
}

/**
 * Open detail modal for a scholarship
 */
export function openScholarshipModal(item) {
  const modal = document.getElementById('scholarship-detail-modal');
  if (!modal) return;

  const isSaved = isScholarshipSaved(item.id);
  const deadlineInfo = formatDeadlineBadge(item.deadline);

  // Populate modal fields
  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-provider').textContent = item.provider;
  document.getElementById('modal-country').textContent = item.country;
  document.getElementById('modal-level').textContent = item.educationLevel;
  document.getElementById('modal-funding').textContent = item.fundingType;
  document.getElementById('modal-deadline').textContent = `${item.deadline} (${deadlineInfo.label})`;
  document.getElementById('modal-status-badge').textContent = item.verificationStatus || 'Demo Data';
  document.getElementById('modal-lastchecked').textContent = item.lastChecked || 'Not provided';
  document.getElementById('modal-funding-details').textContent = item.fundingDetails || 'Not provided';

  // Eligibility
  const eligContainer = document.getElementById('modal-eligibility-list');
  eligContainer.innerHTML = (item.eligibility && item.eligibility.length > 0)
    ? item.eligibility.map(e => `<li>${escapeHTML(e)}</li>`).join('')
    : '<li>Eligibility details not provided. Please check the official provider portal.</li>';

  // Documents
  const docsContainer = document.getElementById('modal-docs-list');
  docsContainer.innerHTML = (item.requiredDocuments && item.requiredDocuments.length > 0)
    ? item.requiredDocuments.map(d => `<li>${escapeHTML(d)}</li>`).join('')
    : '<li>Required documents not specified.</li>';

  // Instructions
  document.getElementById('modal-instructions').textContent = item.applicationInstructions || 'Follow the official portal instructions.';

  // Official Link button (safe external navigation)
  const officialLink = document.getElementById('modal-official-url');
  if (officialLink) {
    officialLink.href = item.officialUrl || '#';
    officialLink.setAttribute('target', '_blank');
    officialLink.setAttribute('rel', 'noopener noreferrer');
  }

  // Modal Save/Track action button
  const trackBtn = document.getElementById('modal-btn-track');
  if (trackBtn) {
    trackBtn.textContent = isSaved ? 'Saved in Tracker (View Dashboard)' : 'Add to Application Tracker';
    trackBtn.className = isSaved ? 'btn btn-outline' : 'btn btn-primary';
    trackBtn.onclick = () => {
      if (isSaved) {
        window.location.href = '/dashboard.html';
      } else {
        saveApplication(item.id, { status: 'Interested' });
        showToast('Saved!', `Added to tracker.`, 'success');
        openScholarshipModal(item);
        renderScholarships();
      }
    };
  }

  modal.classList.add('open');
}

/**
 * Setup modal closing events
 */
function setupModalListeners() {
  const modal = document.getElementById('scholarship-detail-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      modal.classList.remove('open');
    }
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
