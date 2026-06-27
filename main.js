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
    el.className = 'timeline-item glass-card';
    el.dataset.id = item.id;
    el.innerHTML = `
      <div class="timeline-date">${item.date}</div>
      <h3>${item.title}</h3>
      <h4>${item.company}</h4>
      <p>${item.description}</p>
      ${isEditing ? `
        <div class="item-controls">
          <button class="ctrl-btn edit-btn" data-idx="${idx}" data-section="experience" title="Edit">✏️</button>
          <button class="ctrl-btn del-btn"  data-idx="${idx}" data-section="experience" title="Delete">🗑️</button>
        </div>` : ''}
    `;
    list.appendChild(el);
  });

  document.getElementById('add-experience-btn-wrap').style.display = isEditing ? 'flex' : 'none';
  attachItemControls();
}

// ── Render: Skills ───────────────────────────────────────────────────────────
function renderSkills() {
  const list = document.getElementById('skills-list');
  if (!list) return;
  list.innerHTML = '';

  (siteData.skills || []).forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'skill-category';
    el.dataset.id = item.id;

    const tagsHtml = (item.tags || []).map((tag, tagIdx) => `
      <span class="tag">
        ${tag}
        ${isEditing ? `<button class="tag-del-btn" data-section="skills" data-idx="${idx}" data-tagidx="${tagIdx}" title="Remove tag">×</button>` : ''}
      </span>
    `).join('');

    el.innerHTML = `
      <div class="skill-cat-header">
        <h3>${item.category}</h3>
        ${isEditing ? `
          <div class="item-controls inline">
            <button class="ctrl-btn edit-btn" data-idx="${idx}" data-section="skills" title="Edit category">✏️</button>
            <button class="ctrl-btn del-btn"  data-idx="${idx}" data-section="skills" title="Delete category">🗑️</button>
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
}

// ── Render: Projects ─────────────────────────────────────────────────────────
function renderProjects() {
  const list = document.getElementById('projects-list');
  if (!list) return;
  list.innerHTML = '';

  (siteData.projects || []).forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'project-card glass-card';
    el.dataset.id = item.id;
    const techHtml = (item.tech || []).map(t => `<span class="tag-small">${t}</span>`).join('');
    el.innerHTML = `
      <div class="project-content">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="project-tech">${techHtml}</div>
        <a href="${item.link}" class="project-link">View Project &rarr;</a>
      </div>
      ${isEditing ? `
        <div class="item-controls project-controls">
          <button class="ctrl-btn edit-btn" data-idx="${idx}" data-section="projects" title="Edit">✏️</button>
          <button class="ctrl-btn del-btn"  data-idx="${idx}" data-section="projects" title="Delete">🗑️</button>
        </div>` : ''}
    `;
    list.appendChild(el);
  });

  document.getElementById('add-project-btn-wrap').style.display = isEditing ? 'flex' : 'none';
  attachItemControls();
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

// ── Attach tag add/delete controls ───────────────────────────────────────────
function attachTagControls() {
  // Delete tag
  document.querySelectorAll('.tag-del-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const tagIdx = parseInt(btn.dataset.tagidx);
      siteData.skills[idx].tags.splice(tagIdx, 1);
      renderSkills();
      saveAll(true);
    };
  });

  // Add tag on button click
  document.querySelectorAll('.btn-add-tag').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.idx);
      const input = document.querySelector(`.tag-input[data-idx="${idx}"]`);
      const val = input.value.trim();
      if (!val) return;
      siteData.skills[idx].tags.push(val);
      renderSkills();
      saveAll(true);
    };
  });

  // Add tag on Enter
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
    { key: 'link',        label: 'Link URL',      type: 'text',     placeholder: 'https://…' },
  ],
};

const SECTION_LABELS = {
  experience: 'Experience',
  skills: 'Skill Category',
  projects: 'Project',
};

// ── Open Edit Modal ──────────────────────────────────────────────────────────
function openEditModal(section, idx) {
  const item = idx === -1 ? {} : { ...siteData[section][idx] };
  const fields = FIELD_DEFS[section];
  const isNew = idx === -1;
  const label = SECTION_LABELS[section] || section;

  document.getElementById('modal-title').textContent = (isNew ? 'Add ' : 'Edit ') + label;
  const container = document.getElementById('modal-fields');
  container.innerHTML = '';

  fields.forEach(f => {
    let val = item[f.key] ?? '';
    // tech is an array — join for editing
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
  // Focus first input
  const first = container.querySelector('.modal-input');
  if (first) setTimeout(() => first.focus(), 50);

  document.getElementById('modal-save').onclick = () => {
    const updated = { ...item };
    if (isNew) updated.id = uid();

    container.querySelectorAll('.modal-input').forEach(el => {
      const key = el.dataset.key;
      let val = el.value.trim();
      // Convert tech back to array
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

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// ── Save all data to disk ────────────────────────────────────────────────────
async function saveAll(silent = false) {
  const saveBtn = document.getElementById('save-edit-btn');

  // Collect simple text editable fields
  document.querySelectorAll('[data-editable]').forEach(el => {
    const key = el.getAttribute('data-editable');
    siteData[key] = el.textContent;
  });

  if (!silent && saveBtn) {
    saveBtn.textContent = '⏳ Saving…';
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
        saveBtn.textContent = '✅ Saved!';
        setTimeout(() => {
          saveBtn.textContent = '💾 Save All';
          saveBtn.disabled = false;
          // Turn off edit mode
          isEditing = false;
          applyEditMode();
        }, 1200);
      } else {
        alert('Save failed: ' + result.error);
        saveBtn.textContent = '💾 Save All';
        saveBtn.disabled = false;
      }
    }
  } catch (e) {
    console.error(e);
    if (!silent && saveBtn) {
      alert('Save failed.');
      saveBtn.textContent = '💾 Save All';
      saveBtn.disabled = false;
    }
  }
}

// ── Apply / unapply edit mode visuals ────────────────────────────────────────
function applyEditMode() {
  const toggleBtn = document.getElementById('toggle-edit-btn');
  const publishBtn = document.getElementById('publish-btn');
  const saveBtn = document.getElementById('save-edit-btn');
  const avatarWrapper = document.getElementById('avatar-wrapper');
  const avatarOverlay = document.getElementById('avatar-overlay');

  if (isEditing) {
    toggleBtn.textContent = '✖ Cancel';
    publishBtn.style.display = 'inline-block';
    saveBtn.style.display = 'inline-block';
    document.body.classList.add('edit-mode');

    // Text editable fields
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'true';
      el.classList.add('editable-field');
      el.onblur = () => saveAll(true);
    });

    // Avatar
    if (avatarWrapper) avatarWrapper.classList.add('editable');
    if (avatarOverlay) avatarOverlay.style.display = 'flex';
  } else {
    toggleBtn.textContent = '✏️ Edit Mode';
    publishBtn.style.display = 'none';
    saveBtn.style.display = 'none';
    document.body.classList.remove('edit-mode');

    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'false';
      el.classList.remove('editable-field');
    });

    if (avatarWrapper) avatarWrapper.classList.remove('editable');
    if (avatarOverlay) avatarOverlay.style.display = 'none';
  }

  renderAll(); // re-render with/without edit controls
}

// ── Scroll animations ────────────────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
  });
}

// ── Profile photo upload ─────────────────────────────────────────────────────
function initPhotoUpload() {
  const avatarWrapper = document.getElementById('avatar-wrapper');
  const profilePicInput = document.getElementById('profile-pic-input');
  const profilePicImg = document.getElementById('profile-pic');

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
        const res = await fetch('/api/upload-photo', { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
          profilePicImg.src = result.path + '?t=' + Date.now();
        } else {
          alert('Photo upload failed: ' + result.error);
        }
      } catch (err) {
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
    const btn = contactForm.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = 'Message Sent!';
      btn.style.backgroundColor = 'rgba(69, 243, 255, 0.2)';
      contactForm.reset();

      setTimeout(() => {
        btn.textContent = orig;
        btn.style.backgroundColor = '';
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

  // Subtle mouse-reactive background glow
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  });

  initScrollAnimations();
  initContactForm();
  initSmoothScroll();
  initPhotoUpload();

  // DEV-ONLY: admin panel
  if (import.meta.env.DEV) {
    const adminControls = document.getElementById('admin-controls');
    const toggleBtn = document.getElementById('toggle-edit-btn');
    const saveBtn = document.getElementById('save-edit-btn');

    const publishBtn = document.getElementById('publish-btn');

    adminControls.style.display = 'flex';

    toggleBtn.addEventListener('click', () => {
      isEditing = !isEditing;
      applyEditMode();
    });

    saveBtn.addEventListener('click', saveAll);
    
    publishBtn.addEventListener('click', async () => {
      publishBtn.textContent = '⏳ Publishing…';
      publishBtn.disabled = true;
      try {
        const res = await fetch('/api/deploy', { method: 'POST' });
        const result = await res.json();
        if (result.success) {
          publishBtn.textContent = '✅ Published!';
        } else {
          publishBtn.textContent = '❌ Failed';
          alert('Publish failed: ' + result.error);
        }
      } catch (e) {
        publishBtn.textContent = '❌ Error';
      }
      setTimeout(() => {
        publishBtn.textContent = '🚀 Publish to Live';
        publishBtn.disabled = false;
      }, 3000);
    });

    // Add buttons
    document.getElementById('add-experience-btn').addEventListener('click', () => openEditModal('experience', -1));
    document.getElementById('add-skill-btn').addEventListener('click', () => openEditModal('skills', -1));
    document.getElementById('add-project-btn').addEventListener('click', () => openEditModal('projects', -1));

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') document.getElementById('edit-modal').style.display = 'none';
    });
  }
});
