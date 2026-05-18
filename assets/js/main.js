(function () {
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const siteMenu = document.getElementById("site-menu");

    function closeMenu() {
        if (!siteMenu || !mobileMenuButton) return;

        siteMenu.classList.add("hidden");
        mobileMenuButton.setAttribute("aria-expanded", "false");
    }

    if (mobileMenuButton && siteMenu) {
        mobileMenuButton.addEventListener("click", function () {
            const isOpen = !siteMenu.classList.contains("hidden");

            siteMenu.classList.toggle("hidden");
            mobileMenuButton.setAttribute("aria-expanded", String(!isOpen));
        });

        siteMenu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });
    }

    const apiBase = (window.PORTFOLIO_API_BASE || "").replace(/\/$/, "");
    const filterButtons = document.querySelectorAll(".filter-button");
    let galleryItems = document.querySelectorAll(".gallery-item");
    const lightbox = document.getElementById("lightbox");
    const lightboxClose = document.getElementById("lightbox-close");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxTitle = document.getElementById("lightbox-title");
    const lightboxCategory = document.getElementById("lightbox-category");
    const pageShell = document.getElementById("page-shell");
    let activeLightboxTrigger = null;

    function setActiveFilter(activeButton) {
        filterButtons.forEach(function (button) {
            button.setAttribute("aria-pressed", String(button === activeButton));
        });
    }

    function filterGallery(filter) {
        galleryItems = document.querySelectorAll(".gallery-item");
        galleryItems.forEach(function (item) {
            const shouldShow = filter === "all" || item.dataset.category === filter;

            item.classList.toggle("hidden", !shouldShow);
        });
    }

    function getFocusableElements(container) {
        return Array.from(
            container.querySelectorAll(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(function (element) {
            return element.offsetParent !== null || element === document.activeElement;
        });
    }

    function openLightbox(item) {
        if (!lightbox || !lightboxImage || !lightboxTitle || !lightboxCategory || !lightboxClose) return;

        activeLightboxTrigger = item;
        lightboxImage.src = item.dataset.image;
        lightboxImage.srcset = item.dataset.srcset || "";
        lightboxImage.sizes = "100vw";
        lightboxImage.alt = item.querySelector("img").alt;
        lightboxTitle.textContent = item.dataset.title;
        lightboxCategory.textContent = item.dataset.category;
        lightbox.classList.remove("hidden");
        document.body.classList.add("lightbox-open");

        if (pageShell) {
            pageShell.setAttribute("inert", "");
        }

        lightboxClose.focus();
    }

    function closeLightbox() {
        if (!lightbox) return;

        lightbox.classList.add("hidden");
        document.body.classList.remove("lightbox-open");

        if (pageShell) {
            pageShell.removeAttribute("inert");
        }

        if (activeLightboxTrigger) {
            activeLightboxTrigger.focus();
            activeLightboxTrigger = null;
        }
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            setActiveFilter(button);
            filterGallery(button.dataset.filter);
        });
    });

    function bindGalleryItems() {
        galleryItems = document.querySelectorAll(".gallery-item");
        galleryItems.forEach(function (item) {
            item.addEventListener("click", function () {
                openLightbox(item);
            });
        });
    }

    bindGalleryItems();

    if (lightbox && lightboxClose) {
        lightboxClose.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", function (event) {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (!lightbox || lightbox.classList.contains("hidden")) return;

        if (event.key === "Escape") {
            closeLightbox();
            return;
        }

        if (event.key !== "Tab") return;

        const focusableElements = getFocusableElements(lightbox);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    });

    if (filterButtons.length > 0) {
        const allowedFilters = ["all", "car", "landscape", "street"];
        const initialFilter = new URLSearchParams(window.location.search).get("filter");
        const initialButton = allowedFilters.includes(initialFilter)
            ? document.querySelector('[data-filter="' + initialFilter + '"]')
            : document.querySelector('[data-filter="all"]');

        if (initialButton) {
            setActiveFilter(initialButton);
            filterGallery(initialButton.dataset.filter);
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    function renderDynamicGallery(photos) {
        const grid = document.getElementById("gallery-grid");
        if (!grid || photos.length === 0) return;

        grid.innerHTML = photos
            .map(function (photo) {
                const title = escapeHtml(photo.title);
                const category = escapeHtml(photo.category);
                const imageUrl = escapeHtml(photo.imageUrl);
                const alt = escapeHtml(photo.alt || photo.title);

                return `
                    <button type="button" data-category="${category}" data-image="${imageUrl}" data-srcset="${imageUrl} 1200w" data-title="${title}"
                        class="gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left sm:border-r">
                        <img src="${imageUrl}" alt="${alt}" width="1200" height="1200"
                            class="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" decoding="async">
                        <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
                            <span class="block text-sm uppercase tracking-[0.24em] text-[#ffffff99]">${category}</span>
                            <span class="mt-2 block text-2xl font-bold">${title}</span>
                        </span>
                    </button>
                `;
            })
            .join("");

        bindGalleryItems();
        const activeButton = Array.from(filterButtons).find(function (button) {
            return button.getAttribute("aria-pressed") === "true";
        });
        filterGallery(activeButton ? activeButton.dataset.filter : "all");
    }

    function renderDynamicProject(projects) {
        const project = projects.find(function (item) {
            return item.featured;
        }) || projects[0];

        if (!project) return;

        const title = document.getElementById("featured-project-title");
        const description = document.getElementById("featured-project-description");
        const link = document.getElementById("featured-project-link");
        const image = document.getElementById("featured-project-image");

        if (title) title.textContent = project.title;
        if (description) description.textContent = project.description;
        if (link) link.href = project.url;
        if (image && project.imageUrl) {
            image.removeAttribute("srcset");
            image.removeAttribute("sizes");
            image.src = project.imageUrl;
            image.alt = project.imageAlt || project.title;
        }
    }

    async function loadDynamicContent() {
        if (!apiBase) return;

        try {
            const response = await fetch(apiBase + "/api/content");
            if (!response.ok) return;

            const content = await response.json();
            renderDynamicGallery(content.photos || []);
            renderDynamicProject(content.projects || []);
        } catch {
            // Keep the static content available when Convex is not reachable.
        }
    }

    loadDynamicContent();
})();
