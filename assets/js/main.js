//function to select elements
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

let hoursDetailsById = {};

//menu toggle
const navToggle = $('.nav-toggle');
const navMenu = $('#primary-nav');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !expanded);
        navMenu.classList.toggle('show');
    });

    // close menu when clicking a link
    $all('#primary-nav a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.setAttribute('aria-expanded', false);
            navMenu.classList.remove('show');
        });
    });
}

function markActiveNavLink() {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    $all('#primary-nav a').forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (!href || href.startsWith('#')) {
            return;
        }

        const normalizedHref = new URL(href, window.location.origin + window.location.pathname).pathname.replace(/\/$/, '');
        if (normalizedHref === currentPath) {
            link.setAttribute('aria-current', 'page');
        }
    });
}

function initRevealAnimations() {
    const targets = $all('main section, .projet');
    if (targets.length === 0) {
        return;
    }

    if (!('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-visible'));
        return;
    }

    targets.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    targets.forEach((el) => observer.observe(el));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toNumber(value) {
    const numericValue = Number(String(value).trim().replace(',', '.'));
    return Number.isFinite(numericValue) ? numericValue : null;
}

function getProjectId(project) {
    return String(project?.id ?? project?.projet ?? '').trim();
}

function createSlug(value) {
    return String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function normalizeDetailsById(data) {
    const source = Array.isArray(data) ? data : (Array.isArray(data?.projects) ? data.projects : []);
    const detailsMap = {};

    source.forEach((item) => {
        const id = getProjectId(item) || createSlug(item?.titre);
        if (id) {
            detailsMap[id] = item;
        }
    });

    return detailsMap;
}

function getImageItem(image) {
    if (typeof image === 'string') {
        return { src: image, alt: 'Illustration du projet', caption: '' };
    }
    if (image && typeof image === 'object') {
        return {
            src: image.src ?? '',
            alt: image.alt ?? 'Illustration du projet',
            caption: image.caption ?? ''
        };
    }
    return { src: '', alt: '', caption: '' };
}

function openProjectModal(project, details) {
    const modal = $('#project-modal');
    if (!modal) {
        return;
    }

    const titleEl = $('#project-modal-title', modal);
    const textEl = $('#project-modal-text', modal);
    const galleryEl = $('#project-modal-gallery', modal);

    const title = details?.titre ?? project?.projet ?? 'Details du projet';
    const text = details?.details ?? project?.description ?? 'Aucun detail disponible.';

    if (titleEl) {
        titleEl.textContent = title;
    }
    if (textEl) {
        textEl.textContent = text;
    }

    if (galleryEl) {
        const images = Array.isArray(details?.images) ? details.images : [];
        if (images.length === 0) {
            galleryEl.innerHTML = '<p class="project-modal__empty">Aucune image pour ce projet.</p>';
        } else {
            galleryEl.innerHTML = images.map((image) => {
                const item = getImageItem(image);
                if (!item.src) {
                    return '';
                }

                return `
                    <figure class="project-modal__figure">
                        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy">
                        ${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ''}
                    </figure>
                `;
            }).join('');
        }
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeProjectModal() {
    const modal = $('#project-modal');
    if (!modal) {
        return;
    }

    closeImageLightbox();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
}

function openImageLightbox(src, alt, caption = '') {
    const lightbox = $('#image-lightbox');
    const imageEl = $('#image-lightbox-img');
    const captionEl = $('#image-lightbox-caption');

    if (!lightbox || !imageEl || !captionEl || !src) {
        return;
    }

    imageEl.src = src;
    imageEl.alt = alt || 'Image du projet';
    captionEl.textContent = caption || alt || '';

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
}

function closeImageLightbox() {
    const lightbox = $('#image-lightbox');
    const imageEl = $('#image-lightbox-img');
    const captionEl = $('#image-lightbox-caption');

    if (!lightbox || !imageEl || !captionEl) {
        return;
    }

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    imageEl.src = '';
    imageEl.alt = '';
    captionEl.textContent = '';
}

function initProjectModalInteractions() {
    const modal = $('#project-modal');
    const lightbox = $('#image-lightbox');
    if (!modal) {
        return;
    }

    const closeBtn = $('#project-modal-close', modal);
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProjectModal);
    }

    modal.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof Element && target.matches('.project-modal__gallery img')) {
            const figcaption = target.closest('figure')?.querySelector('figcaption');
            const caption = figcaption ? figcaption.textContent.trim() : '';
            openImageLightbox(target.getAttribute('src') || '', target.getAttribute('alt') || '', caption);
            return;
        }

        if (target instanceof Element && target.closest('[data-close-modal="true"]')) {
            closeProjectModal();
        }
    });

    if (lightbox) {
        const lightboxCloseBtn = $('#image-lightbox-close', lightbox);
        if (lightboxCloseBtn) {
            lightboxCloseBtn.addEventListener('click', closeImageLightbox);
        }

        lightbox.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof Element && target.closest('[data-close-lightbox="true"]')) {
                closeImageLightbox();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (lightbox && lightbox.classList.contains('is-open')) {
                closeImageLightbox();
                return;
            }

            closeProjectModal();
        }
    });
}

function renderHoursRows(hoursTable, projects) {
    const tbody = hoursTable.querySelector('tbody');
    if (!tbody) {
        return;
    }

    if (!Array.isArray(projects) || projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Aucune donnee disponible.</td></tr>';
        return;
    }

    const rowsHtml = projects.map((project) => {
        const projectId = getProjectId(project) || createSlug(project.projet);
        const realHoursValue = toNumber(project.heures_reelles ?? project.heuresReelles ?? project.heures);
        const accountedHoursValue = toNumber(project.heures_comptabilisees ?? project.heuresComptabilisees ?? project.heures);
        const displayRealHours = realHoursValue === null ? '/' : realHoursValue;
        const displayAccountedHours = accountedHoursValue === null ? '/' : accountedHoursValue;

        return `
            <tr class="hours-row" data-project-id="${escapeHtml(projectId)}">
                <td class="hours-project-cell">${escapeHtml(project.projet ?? '/')}</td>
                <td>${escapeHtml(project.description ?? '/')}</td>
                <td class="hours-count">${escapeHtml(displayRealHours)}</td>
                <td class="hours-count">${escapeHtml(displayAccountedHours)}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rowsHtml;
}

function bindHoursRowClicks(hoursTable, projects) {
    const tbody = $('tbody', hoursTable);
    if (!tbody) {
        return;
    }

    const projectMap = {};
    projects.forEach((project) => {
        const projectId = getProjectId(project) || createSlug(project.projet);
        if (projectId) {
            projectMap[projectId] = project;
        }
    });

    tbody.addEventListener('click', (event) => {
        const targetRow = event.target instanceof Element ? event.target.closest('tr[data-project-id]') : null;
        if (!targetRow) {
            return;
        }

        const projectId = targetRow.getAttribute('data-project-id') ?? '';
        const project = projectMap[projectId];
        if (!project) {
            return;
        }

        const details = hoursDetailsById[projectId] ?? {};
        openProjectModal(project, details);
    });
}

// Calculate total hours from the accounted-hours column and update the footer cell.
function updateHoursTotal(hoursTable = document.querySelector('#table-hours table')) {
    if (!hoursTable) {
        return;
    }

    const hourCells = hoursTable.querySelectorAll('tbody td:last-child');
    const total = [...hourCells].reduce((sum, cell) => {
        const rawValue = cell.textContent.trim().replace(',', '.');
        const value = Number(rawValue);
        return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const totalCell = hoursTable.querySelector('tfoot td:last-child');
    if (totalCell) {
        totalCell.textContent = total.toString();
    }
}

async function populateHoursTableFromJson() {
    const hoursTable = document.querySelector('#table-hours table');
    if (!hoursTable) {
        return;
    }

    const dataSource = hoursTable.dataset.source;
    const detailsSource = hoursTable.dataset.detailsSource;
    if (!dataSource) {
        updateHoursTotal(hoursTable);
        return;
    }

    try {
        const [response, detailsResponse] = await Promise.all([
            fetch(dataSource),
            detailsSource ? fetch(detailsSource) : Promise.resolve(null)
        ]);

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const data = await response.json();
        const projects = Array.isArray(data) ? data : data.projects;
        if (detailsResponse && detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            hoursDetailsById = normalizeDetailsById(detailsData);
        } else {
            hoursDetailsById = {};
        }

        renderHoursRows(hoursTable, projects);
        bindHoursRowClicks(hoursTable, projects);
    } catch (error) {
        const tbody = hoursTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4">Impossible de charger les donnees.</td></tr>';
        }
        console.error('Erreur de chargement du JSON des heures:', error);
    }

    updateHoursTotal(hoursTable);
}

initProjectModalInteractions();
populateHoursTableFromJson();
markActiveNavLink();
initRevealAnimations();