import './style.css'
import { initHeroScene } from './hero-scene.js'
import { initBgParticles } from './bg-particles.js'

// ── Load data from server (always fresh) ─────────────────────────────────────
async function loadData() {
  const res = await fetch('/data.json?t=' + Date.now());
  return res.json();
}

// ── In-memory store ──────────────────────────────────────────────────────────
let siteData = {};
let isEditing = false;

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 9);
}

function stagger(elements, baseDelay = 0, step = 100) {
  elements.forEach((el, i) => {
    el.style.animationDelay = `${baseDelay + i * step}ms`;
    el.classList.add('stagger-child');
  });
}

// ── Render: Simple text fields ───────────────────────────────────────────────
function renderTextFields() {
  document.querySelectorAll('[data-editable]').forEach(el => {
    const key = el.getAttribute('data-editable');
    if (siteData[key] !== undefined) el.textContent = siteData[key];
  });
}

// ── Render: Experience ───────────────────────────────────────────────────────
function renderExperience() {
  const list = document.getElementById('experience-list');
  if (!list) return;
  list.innerHTML = '';

  (siteData.experience || []).forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'timeline-item glass-card reveal';
    el.style.transitionDelay = `${idx * 0.12}s`;
    el.dataset.id = item.id;
    el.innerHTML = `
      <div class="timeline-top">
        <div>
          <h3>${item.title}</h3>
          <h4>${item.company}</h4>
        </div>
        <span class="timeline-date">${item.date}</span>
      </div>
      <p>${item.description}</p>
      ${isEditing ? `
        <div class="item-controls">
          <button class="ctrl-btn edit-btn" data-idx="${idx}" data-section="experience">Edit</button>
          <button class="ctrl-btn del-btn"  data-idx="${idx}" data-section="experience">Delete</button>
        </div>` : ''}
    `;
    list.appendChild(el);
  });

  document.getElementById('add-experience-btn-wrap').style.display = isEditing ? 'flex' : 'none';
  attachItemControls();

  // Trigger reveal for newly added items
  requestAnimationFrame(() => {
    list.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  });
}

// ── Render: Skills ───────────────────────────────────────────────────────────
function renderSkills() {
  const list = document.getElementById('skills-list');
  if (!list) return;
  list.innerHTML = '';

  (siteData.skills || []).forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'skill-category glass-card reveal';
    el.style.transitionDelay = `${idx * 0.1}s`;
    el.dataset.id = item.id;

    const tagsHtml = (item.tags || []).map((tag, tagIdx) => `
      <span class="tag">
        ${tag}
        ${isEditing ? `<button class="tag-del-btn" data-section="skills" data-idx="${idx}" data-tagidx="${tagIdx}">×</button>` : ''}
      </span>
    `).join('');

    el.innerHTML = `
      <div class="skill-cat-header">
        <h3>${item.category}</h3>
        ${isEditing ? `
          <div class="item-controls inline">
            <button class="ctrl-btn edit-btn" data-idx="${idx}" data-section="skills">Edit</button>
            <button class="ctrl-btn del-btn"  data-idx="${idx}" data-section="skills">Del</button>
          </div>` : ''}
      </div>
      <div class="skill-tags">${tagsHtml}</div>
      ${isEditing ? `
        <div class="add-tag-row">
          <input class="tag-input" type="text" placeholder="Add tag…" data-idx="${idx}" />
          <button class="btn-add-tag" data-idx="${idx}">+</button>
        </div>` : ''}
    `;
    list.appendChild(el);
  });

  document.getElementById('add-skill-btn-wrap').style.display = isEditing ? 'flex' : 'none';
  attachItemControls();
  attachTagControls();

  requestAnimationFrame(() => {
    list.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  });
}

// ── Render: Projects ─────────────────────────────────────────────────────────
function renderProjects() {
  const list = document.getElementById('projects-list');
  if (!list) return;
  list.innerHTML = '';

  (siteData.projects || []).forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'project-card glass-card reveal';
    el.style.transitionDelay = `${idx * 0.13}s`;
    el.dataset.id = item.id;

    const techHtml = (item.tech || []).map(t => `<span class="tag-small">${t}</span>`).join('');
    const numLabel = String(idx + 1).padStart(2, '0');

    // ── Media block: video or image or placeholder ──
    let mediaHtml = '';
    if (item.media) {
      const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(item.media) || item.mediaType === 'video';
      if (isVideo) {
        mediaHtml = `
          <div class="project-media">
            <video src="${item.media}" autoplay muted loop playsinline></video>
            <div class="play-badge">&#9654;</div>
            ${isEditing ? `<button class="project-media-edit-btn" data-idx="${idx}">Change Media</button>` : ''}
          </div>`;
      } else {
        mediaHtml = `
          <div class="project-media">
            <img src="${item.media}" alt="${item.title} screenshot" loading="lazy" />
            ${isEditing ? `<button class="project-media-edit-btn" data-idx="${idx}">Change Media</button>` : ''}
          </div>`;
      }
    } else {
      mediaHtml = `
        <div class="project-media">
          <div class="project-media-placeholder">
            <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            <span class="placeholder-text">No Preview</span>
          </div>
          ${isEditing ? `<button class="project-media-edit-btn" data-idx="${idx}">Add Screenshot / Trailer</button>` : ''}
        </div>`;
    }

    el.innerHTML = `
      ${mediaHtml}
      <div class="project-content">
        <div class="project-index">Project ${numLabel}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="project-tech">${techHtml}</div>
        <div class="project-footer">
          <a href="${item.link || '#'}" class="project-link" target="_blank" rel="noopener">
            View Project
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          ${isEditing ? `
            <div class="item-controls project-controls" style="margin-top:0;">
              <button class="ctrl-btn edit-btn" data-idx="${idx}" data-section="projects">Edit</button>
              <button class="ctrl-btn del-btn"  data-idx="${idx}" data-section="projects">Del</button>
            </div>` : ''}
        </div>
      </div>
    `;
    list.appendChild(el);
  });

  document.getElementById('add-project-btn-wrap').style.display = isEditing ? 'flex' : 'none';
  attachItemControls();
  attachMediaControls();

  requestAnimationFrame(() => {
    list.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  });
}

// ── Re-render all dynamic sections ──────────────────────────────────────────
function renderAll() {
  renderTextFields();
  renderExperience();
  renderSkills();
  renderProjects();
}

// ── Attach edit/delete buttons inside rendered items ─────────────────────────
function attachItemControls() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const section = btn.dataset.section;
      const idx = parseInt(btn.dataset.idx);
      openEditModal(section, idx);
    };
  });

  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const section = btn.dataset.section;
      const idx = parseInt(btn.dataset.idx);
      if (confirm('Delete this item?')) {
        siteData[section].splice(idx, 1);
        renderAll();
        saveAll(true);
      }
    };
  });
}

// ── Attach media upload/url controls for projects ────────────────────────────
function attachMediaControls() {
  document.querySelectorAll('.project-media-edit-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      openMediaModal(idx);
    };
  });
}

// ── Media Modal ──────────────────────────────────────────────────────────────
function openMediaModal(projectIdx) {
  const item = siteData.projects[projectIdx];

  // Build a small modal for media URL or file upload
  const modal = document.getElementById('edit-modal');
  const titleEl = document.getElementById('modal-title');
  const container = document.getElementById('modal-fields');

  titleEl.textContent = `Set Media — ${item.title}`;
  container.innerHTML = `
    <div class="modal-field">
      <label class="modal-label">Screenshot / Trailer URL (or paste a direct link)</label>
      <input class="modal-input" type="text" id="media-url-input" placeholder="https://… (.jpg, .png, .mp4, .webm)" value="${item.media || ''}" />
    </div>
    <div class="modal-field" style="text-align:center; color: #3d6080; font-family: var(--font-mono); font-size:0.8rem;">— or upload a file —</div>
    <div class="modal-field">
      <input class="modal-input" type="file" id="media-file-input" accept="image/*,video/*" style="padding:0.5rem;" />
    </div>
    <div class="modal-field">
      <label class="modal-label">Media Type Override (auto-detected from extension)</label>
      <select class="modal-input" id="media-type-input">
        <option value="" ${!item.mediaType ? 'selected' : ''}>Auto-detect</option>
        <option value="image" ${item.mediaType === 'image' ? 'selected' : ''}>Image</option>
        <option value="video" ${item.mediaType === 'video' ? 'selected' : ''}>Video</option>
      </select>
    </div>
  `;

  modal.style.display = 'flex';

  // File chosen → preview URL
  const fileInput = document.getElementById('media-file-input');
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Upload to server
    const formData = new FormData();
    formData.append('media', file);
    formData.append('projectId', item.id);
    try {
      const res = await fetch('/api/upload-media', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        document.getElementById('media-url-input').value = result.path;
      } else {
        // Fallback: use local object URL for preview (won't persist to server)
        document.getElementById('media-url-input').value = URL.createObjectURL(file);
      }
    } catch {
      document.getElementById('media-url-input').value = URL.createObjectURL(file);
    }
  };

  document.getElementById('modal-save').onclick = () => {
    const url       = document.getElementById('media-url-input').value.trim();
    const typeOver  = document.getElementById('media-type-input').value;

    siteData.projects[projectIdx].media     = url || undefined;
    siteData.projects[projectIdx].mediaType = typeOver || undefined;

    modal.style.display = 'none';
    renderAll();
    saveAll(true);
  };

  document.getElementById('modal-cancel').onclick = () => {
    modal.style.display = 'none';
  };

  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// ── Attach tag add/delete controls ───────────────────────────────────────────
function attachTagControls() {
  document.querySelectorAll('.tag-del-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx    = parseInt(btn.dataset.idx);
      const tagIdx = parseInt(btn.dataset.tagidx);
      siteData.skills[idx].tags.splice(tagIdx, 1);
      renderSkills();
      saveAll(true);
    };
  });

  document.querySelectorAll('.btn-add-tag').forEach(btn => {
    btn.onclick = () => {
      const idx   = parseInt(btn.dataset.idx);
      const input = document.querySelector(`.tag-input[data-idx="${idx}"]`);
      const val   = input.value.trim();
      if (!val) return;
      siteData.skills[idx].tags.push(val);
      renderSkills();
      saveAll(true);
    };
  });

  document.querySelectorAll('.tag-input').forEach(input => {
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const idx = parseInt(input.dataset.idx);
        const val = input.value.trim();
        if (!val) return;
        siteData.skills[idx].tags.push(val);
        renderSkills();
        saveAll(true);
      }
    };
  });
}

// ── Modal: field definitions per section ────────────────────────────────────
const FIELD_DEFS = {
  experience: [
    { key: 'date',        label: 'Date Range',   type: 'text',     placeholder: 'e.g. 2023 - Present' },
    { key: 'title',       label: 'Job Title',    type: 'text',     placeholder: 'e.g. Frontend Engineer' },
    { key: 'company',     label: 'Company',      type: 'text',     placeholder: 'e.g. Google' },
    { key: 'description', label: 'Description',  type: 'textarea', placeholder: 'What did you do?' },
  ],
  skills: [
    { key: 'category', label: 'Category Name', type: 'text', placeholder: 'e.g. Frontend' },
  ],
  projects: [
    { key: 'title',       label: 'Project Title', type: 'text',     placeholder: 'My Awesome Project' },
    { key: 'description', label: 'Description',   type: 'textarea', placeholder: 'What does it do?' },
    { key: 'tech',        label: 'Technologies',  type: 'text',     placeholder: 'React, Node.js, … (comma-separated)' },
    { key: 'link',        label: 'Live / Repo URL', type: 'text',   placeholder: 'https://…' },
  ],
};

const SECTION_LABELS = {
  experience: 'Experience',
  skills: 'Skill Category',
  projects: 'Project',
};

// ── Open Edit Modal ──────────────────────────────────────────────────────────
function openEditModal(section, idx) {
  const item   = idx === -1 ? {} : { ...siteData[section][idx] };
  const fields = FIELD_DEFS[section];
  const isNew  = idx === -1;
  const label  = SECTION_LABELS[section] || section;

  document.getElementById('modal-title').textContent = (isNew ? 'Add ' : 'Edit ') + label;
  const container = document.getElementById('modal-fields');
  container.innerHTML = '';

  fields.forEach(f => {
    let val = item[f.key] ?? '';
    if (Array.isArray(val)) val = val.join(', ');

    const wrap = document.createElement('div');
    wrap.className = 'modal-field';
    if (f.type === 'textarea') {
      wrap.innerHTML = `
        <label class="modal-label">${f.label}</label>
        <textarea class="modal-input" data-key="${f.key}" rows="3" placeholder="${f.placeholder}">${val}</textarea>
      `;
    } else {
      wrap.innerHTML = `
        <label class="modal-label">${f.label}</label>
        <input class="modal-input" type="text" data-key="${f.key}" placeholder="${f.placeholder}" value="${val}" />
      `;
    }
    container.appendChild(wrap);
  });

  const modal = document.getElementById('edit-modal');
  modal.style.display = 'flex';
  const first = container.querySelector('.modal-input');
  if (first) setTimeout(() => first.focus(), 50);

  document.getElementById('modal-save').onclick = () => {
    const updated = { ...item };
    if (isNew) updated.id = uid();

    container.querySelectorAll('.modal-input').forEach(el => {
      const key = el.dataset.key;
      let val = el.value.trim();
      if (key === 'tech') {
        updated[key] = val.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        updated[key] = val;
      }
    });

    if (isNew) {
      siteData[section].push(updated);
    } else {
      siteData[section][idx] = updated;
    }

    modal.style.display = 'none';
    renderAll();
    saveAll(true);
  };

  document.getElementById('modal-cancel').onclick = () => {
    modal.style.display = 'none';
  };

  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// ── Save all data to disk ────────────────────────────────────────────────────
async function saveAll(silent = false) {
  const saveBtn = document.getElementById('save-edit-btn');

  document.querySelectorAll('[data-editable]').forEach(el => {
    const key = el.getAttribute('data-editable');
    siteData[key] = el.textContent;
  });

  if (!silent && saveBtn) {
    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;
  }

  try {
    const res = await fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData),
    });
    const result = await res.json();

    if (!silent && saveBtn) {
      if (result.success) {
        saveBtn.textContent = 'Saved';
        setTimeout(() => {
          saveBtn.textContent = 'Save All';
          saveBtn.disabled = false;
          isEditing = false;
          applyEditMode();
        }, 1200);
      } else {
        alert('Save failed: ' + result.error);
        saveBtn.textContent = 'Save All';
        saveBtn.disabled = false;
      }
    }
  } catch (e) {
    console.error(e);
    if (!silent && saveBtn) {
      alert('Save failed.');
      saveBtn.textContent = 'Save All';
      saveBtn.disabled = false;
    }
  }
}

// ── Apply / unapply edit mode visuals ────────────────────────────────────────
function applyEditMode() {
  const toggleBtn    = document.getElementById('toggle-edit-btn');
  const publishBtn   = document.getElementById('publish-btn');
  const saveBtn      = document.getElementById('save-edit-btn');
  const avatarWrapper = document.getElementById('avatar-wrapper');
  const avatarOverlay = document.getElementById('avatar-overlay');

  if (isEditing) {
    toggleBtn.textContent = 'Cancel';
    publishBtn.style.display = 'inline-block';
    saveBtn.style.display    = 'inline-block';
    document.body.classList.add('edit-mode');

    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'true';
      el.classList.add('editable-field');
      el.onblur = () => saveAll(true);
    });

    if (avatarWrapper) avatarWrapper.classList.add('editable');
    if (avatarOverlay) avatarOverlay.style.display = 'flex';
  } else {
    toggleBtn.textContent    = 'Edit Mode';
    publishBtn.style.display = 'none';
    saveBtn.style.display    = 'none';
    document.body.classList.remove('edit-mode');

    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'false';
      el.classList.remove('editable-field');
    });

    if (avatarWrapper) avatarWrapper.classList.remove('editable');
    if (avatarOverlay) avatarOverlay.style.display = 'none';
  }

  renderAll();
}

// ── Scroll-reveal animations (IntersectionObserver) ──────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  const revealAll = () => {
    document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right').forEach(el => {
      observer.observe(el);
    });
  };

  revealAll();
  return revealAll;
}

// ── Navbar scroll effect ─────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── Profile photo upload ─────────────────────────────────────────────────────
function initPhotoUpload() {
  const avatarWrapper  = document.getElementById('avatar-wrapper');
  const profilePicInput = document.getElementById('profile-pic-input');
  const profilePicImg   = document.getElementById('profile-pic');

  if (avatarWrapper) {
    avatarWrapper.addEventListener('click', () => {
      if (avatarWrapper.classList.contains('editable')) profilePicInput.click();
    });
  }

  if (profilePicInput) {
    profilePicInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      profilePicImg.src = URL.createObjectURL(file);

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const res    = await fetch('/api/upload-photo', { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
          profilePicImg.src = result.path + '?t=' + Date.now();
        } else {
          alert('Photo upload failed: ' + result.error);
        }
      } catch {
        alert('Photo upload failed.');
      }
      profilePicInput.value = '';
    });
  }
}

// ── Contact form ─────────────────────────────────────────────────────────────
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn  = contactForm.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled    = true;
    btn.style.opacity = '0.7';

    setTimeout(() => {
      btn.textContent   = 'Message Sent';
      btn.style.opacity = '1';
      contactForm.reset();

      setTimeout(() => {
        btn.textContent  = orig;
        btn.style.opacity = '';
        btn.disabled = false;
      }, 3000);
    }, 1500);
  });
}

// ── Smooth scroll ────────────────────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      e.preventDefault();
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Load data and render
  siteData = await loadData();
  renderAll();

  // Interactive Robot Scene
  initHeroScene('hero-canvas');

  // Interactive Background particles
  initBgParticles('bg-canvas');

  // Mouse-reactive background glow
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth)  * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  }, { passive: true });

  const reObserve = initScrollAnimations();
  initNavbar();
  initContactForm();
  initSmoothScroll();
  initPhotoUpload();

  // DEV-ONLY: admin panel
  if (import.meta.env.DEV) {
    const adminControls = document.getElementById('admin-controls');
    const toggleBtn     = document.getElementById('toggle-edit-btn');
    const saveBtn       = document.getElementById('save-edit-btn');
    const publishBtn    = document.getElementById('publish-btn');

    adminControls.style.display = 'flex';

    toggleBtn.addEventListener('click', () => {
      isEditing = !isEditing;
      applyEditMode();
      setTimeout(reObserve, 100);
    });

    saveBtn.addEventListener('click', saveAll);

    publishBtn.addEventListener('click', async () => {
      publishBtn.textContent = 'Publishing…';
      publishBtn.disabled    = true;
      try {
        const res    = await fetch('/api/deploy', { method: 'POST' });
        const result = await res.json();
        publishBtn.textContent = result.success ? 'Published!' : 'Failed';
        if (!result.success) alert('Publish failed: ' + result.error);
      } catch {
        publishBtn.textContent = 'Error';
      }
      setTimeout(() => {
        publishBtn.textContent = 'Publish Live';
        publishBtn.disabled    = false;
      }, 3000);
    });

    document.getElementById('add-experience-btn').addEventListener('click', () => openEditModal('experience', -1));
    document.getElementById('add-skill-btn').addEventListener('click',      () => openEditModal('skills', -1));
    document.getElementById('add-project-btn').addEventListener('click',    () => openEditModal('projects', -1));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') document.getElementById('edit-modal').style.display = 'none';
    });
  }
});
