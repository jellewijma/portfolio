(function () {
    const apiBase = (window.PORTFOLIO_API_BASE || "").replace(/\/$/, "");
    const tokenKey = "portfolioAdminToken";
    let content = { photos: [], projects: [] };

    const status = document.getElementById("admin-status");
    const loginForm = document.getElementById("login-form");
    const adminPanel = document.getElementById("admin-panel");
    const logoutButton = document.getElementById("logout-button");
    const homeImageSlots = [
        {
            slot: "hero",
            label: "Hero image",
            title: "Hero portrait",
            alt: "Jelle standing in front of mountains",
            imageUrl: "/assets/images/optimized/hero-mountain-portrait-1200.jpg",
        },
        {
            slot: "selected-1",
            label: "Selected photo 1",
            title: "Car work",
            alt: "Classic car detail photographed in warm light",
            imageUrl: "/assets/images/optimized/classic-car-warm-scene-480.jpg",
        },
        {
            slot: "selected-2",
            label: "Selected photo 2",
            title: "Automotive",
            alt: "Car photographed from a low angle",
            imageUrl: "/assets/images/optimized/low-angle-automotive-480.jpg",
        },
        {
            slot: "selected-3",
            label: "Selected photo 3",
            title: "Street",
            alt: "Street scene captured on film",
            imageUrl: "/assets/images/optimized/street-quiet-corner-480.jpg",
        },
        {
            slot: "selected-4",
            label: "Selected photo 4",
            title: "Landscape",
            alt: "Landscape photograph with strong contrast",
            imageUrl: "/assets/images/optimized/landscape-open-light-480.jpg",
        },
        {
            slot: "category-car",
            label: "Car category image",
            title: "Car",
            alt: "Automotive category image",
            imageUrl: "/assets/images/optimized/low-angle-automotive-768.jpg",
        },
        {
            slot: "category-landscape",
            label: "Landscape category image",
            title: "Landscape",
            alt: "Landscape category image",
            imageUrl: "/assets/images/optimized/landscape-open-light-768.jpg",
        },
        {
            slot: "category-street",
            label: "Street category image",
            title: "Street",
            alt: "Street category image",
            imageUrl: "/assets/images/optimized/street-quiet-corner-768.jpg",
        },
    ];

    function token() {
        return localStorage.getItem(tokenKey);
    }

    function setStatus(message) {
        status.textContent = message;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    async function api(path, options) {
        const headers = {
            ...(options && options.body ? { "Content-Type": "application/json" } : {}),
            ...(token() ? { Authorization: "Bearer " + token() } : {}),
            ...(options && options.headers ? options.headers : {}),
        };

        Object.keys(headers).forEach(function (key) {
            if (headers[key] === undefined) {
                delete headers[key];
            }
        });

        const response = await fetch(apiBase + path, {
            ...options,
            headers,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || "Request failed.");
        }

        return data;
    }

    async function uploadFile(file) {
        if (!file) return null;

        const { uploadUrl } = await api("/api/upload-url", { method: "POST", body: "{}" });
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error("Upload failed.");
        }

        return data.storageId;
    }

    function showAdmin() {
        loginForm.classList.add("hidden");
        adminPanel.classList.remove("hidden");
        logoutButton.classList.remove("hidden");
    }

    function showLogin() {
        loginForm.classList.remove("hidden");
        adminPanel.classList.add("hidden");
        logoutButton.classList.add("hidden");
    }

    function resetPhotoForm() {
        document.getElementById("photo-form").reset();
        document.getElementById("photo-id").value = "";
        document.getElementById("photo-order").value = content.photos.length;
        document.getElementById("photo-published").checked = true;
        hideForm("photo-form");
    }

    function resetProjectForm() {
        document.getElementById("project-form").reset();
        document.getElementById("project-id").value = "";
        document.getElementById("project-order").value = content.projects.length;
        document.getElementById("project-featured").checked = content.projects.length === 0;
        document.getElementById("project-published").checked = true;
        hideForm("project-form");
    }

    function resetHomeImageForm() {
        document.getElementById("home-image-form").reset();
        document.getElementById("home-image-slot").value = "";
        document.getElementById("home-image-label").textContent = "Home image";
        document.getElementById("home-image-heading").textContent = "Change image";
        hideForm("home-image-form");
    }

    function showForm(id) {
        const form = document.getElementById(id);
        form.classList.remove("hidden");
        form.classList.add("grid");
        form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function hideForm(id) {
        const form = document.getElementById(id);
        form.classList.add("hidden");
        form.classList.remove("grid");
    }

    function renderListItem(item, type) {
        const element = document.createElement("div");
        element.className = "overflow-hidden border border-[#ffffff26]";
        element.innerHTML = `
            <img src="${escapeHtml(item.imageUrl || "/assets/icons/favicon.svg")}" alt="" class="aspect-square w-full object-cover">
            <div class="p-4">
                <h3 class="text-lg font-semibold">${escapeHtml(item.title)}</h3>
                <p class="mt-2 truncate text-sm text-[#ffffff99]">${escapeHtml(type === "photo" ? item.category : item.url)}</p>
                <p class="mt-1 text-sm text-[#ffffff99]">${item.published ? "Published" : "Draft"} · Order ${Number(item.order)}</p>
            </div>
            <div class="grid grid-cols-2 border-t border-[#ffffff26]">
                <button type="button" data-action="edit" class="border-r border-[#ffffff26] px-4 py-3 text-sm uppercase tracking-[0.2em]">Edit</button>
                <button type="button" data-action="delete" class="px-4 py-3 text-sm uppercase tracking-[0.2em]">Delete</button>
            </div>
        `;

        element.querySelector('[data-action="edit"]').addEventListener("click", function () {
            if (type === "photo") {
                document.getElementById("photo-id").value = item.id;
                document.getElementById("photo-title").value = item.title;
                document.getElementById("photo-alt").value = item.alt;
                document.getElementById("photo-category").value = item.category;
                document.getElementById("photo-order").value = item.order;
                document.getElementById("photo-published").checked = item.published;
                showForm("photo-form");
            } else {
                document.getElementById("project-id").value = item.id;
                document.getElementById("project-title").value = item.title;
                document.getElementById("project-description").value = item.description;
                document.getElementById("project-url").value = item.url;
                document.getElementById("project-image-alt").value = item.imageAlt;
                document.getElementById("project-order").value = item.order;
                document.getElementById("project-featured").checked = item.featured;
                document.getElementById("project-published").checked = item.published;
                showForm("project-form");
            }
        });

        element.querySelector('[data-action="delete"]').addEventListener("click", async function () {
            const path = type === "photo" ? "/api/photos/delete" : "/api/projects/delete";
            await api(path, { method: "POST", body: JSON.stringify({ id: item.id }) });
            await loadContent();
        });

        return element;
    }

    function homeImageForSlot(slot) {
        const saved = (content.homeImages || []).find((item) => item.slot === slot.slot);
        return { ...slot, ...(saved || {}) };
    }

    function renderHomeImageItem(slot) {
        const item = homeImageForSlot(slot);
        const element = document.createElement("div");
        element.className = "overflow-hidden border border-[#ffffff26]";
        element.innerHTML = `
            <img src="${escapeHtml(item.imageUrl)}" alt="" class="aspect-square w-full object-cover">
            <div class="p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-[#ffffff99]">${escapeHtml(slot.label)}</p>
                <h3 class="mt-2 text-lg font-semibold">${escapeHtml(item.title)}</h3>
            </div>
            <button type="button" data-action="change" class="w-full border-t border-[#ffffff26] px-4 py-3 text-sm uppercase tracking-[0.2em]">Change</button>
        `;

        element.querySelector('[data-action="change"]').addEventListener("click", function () {
            document.getElementById("home-image-slot").value = slot.slot;
            document.getElementById("home-image-label").textContent = slot.label;
            document.getElementById("home-image-heading").textContent = item.title;
            document.getElementById("home-image-title").value = item.title;
            document.getElementById("home-image-alt").value = item.alt;
            showForm("home-image-form");
        });

        return element;
    }

    function renderContent() {
        const photoList = document.getElementById("photo-list");
        const projectList = document.getElementById("project-list");
        const homeImageList = document.getElementById("home-image-list");
        photoList.innerHTML = "";
        projectList.innerHTML = "";
        homeImageList.innerHTML = "";

        content.photos
            .slice()
            .sort((a, b) => a.order - b.order)
            .forEach((photo) => photoList.appendChild(renderListItem(photo, "photo")));
        homeImageSlots.forEach((slot) => homeImageList.appendChild(renderHomeImageItem(slot)));
        content.projects
            .slice()
            .sort((a, b) => a.order - b.order)
            .forEach((project) => projectList.appendChild(renderListItem(project, "project")));
    }

    async function loadContent() {
        content = await api("/api/admin/content", { method: "GET" });
        renderContent();
        resetPhotoForm();
        resetHomeImageForm();
        resetProjectForm();
        setStatus("Signed in. Changes publish immediately when saved.");
    }

    async function verifyMagicLink() {
        const params = new URLSearchParams(window.location.search);
        const magicToken = params.get("token");

        if (!magicToken) {
            return false;
        }

        setStatus("Verifying sign-in link...");
        const session = await api("/api/login/verify", {
            method: "POST",
            body: JSON.stringify({ token: magicToken }),
        });
        localStorage.setItem(tokenKey, session.token);
        window.history.replaceState({}, document.title, window.location.pathname);
        showAdmin();
        await loadContent();
        return true;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            setStatus("Sending sign-in link...");
            const email = document.getElementById("admin-email").value;
            await api("/api/login", { method: "POST", body: JSON.stringify({ email }) });
            loginForm.reset();
            setStatus("Check your email for a sign-in link. It expires in 15 minutes.");
        } catch (error) {
            setStatus(error.message);
        }
    });

    logoutButton.addEventListener("click", async function () {
        try {
            await api("/api/logout", { method: "POST", body: "{}" });
        } catch {
            // The local token should be cleared even if the remote session is already gone.
        }
        localStorage.removeItem(tokenKey);
        showLogin();
        setStatus("Signed out.");
    });

    document.getElementById("photo-add").addEventListener("click", function () {
        document.getElementById("photo-form").reset();
        document.getElementById("photo-id").value = "";
        document.getElementById("photo-order").value = content.photos.length;
        document.getElementById("photo-published").checked = true;
        showForm("photo-form");
    });
    document.getElementById("project-add").addEventListener("click", function () {
        document.getElementById("project-form").reset();
        document.getElementById("project-id").value = "";
        document.getElementById("project-order").value = content.projects.length;
        document.getElementById("project-featured").checked = content.projects.length === 0;
        document.getElementById("project-published").checked = true;
        showForm("project-form");
    });
    document.getElementById("photo-reset").addEventListener("click", resetPhotoForm);
    document.getElementById("home-image-reset").addEventListener("click", resetHomeImageForm);
    document.getElementById("project-reset").addEventListener("click", resetProjectForm);

    document.getElementById("photo-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        setStatus("Saving photo...");

        try {
            const storageId = await uploadFile(document.getElementById("photo-file").files[0]);
            await api("/api/photos", {
                method: "POST",
                body: JSON.stringify({
                    id: document.getElementById("photo-id").value || undefined,
                    title: document.getElementById("photo-title").value,
                    alt: document.getElementById("photo-alt").value,
                    category: document.getElementById("photo-category").value,
                    storageId: storageId || undefined,
                    order: Number(document.getElementById("photo-order").value),
                    published: document.getElementById("photo-published").checked,
                }),
            });
            await loadContent();
        } catch (error) {
            setStatus(error.message);
        }
    });

    document.getElementById("home-image-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        setStatus("Saving home image...");

        try {
            const slot = document.getElementById("home-image-slot").value;
            const storageId = await uploadFile(document.getElementById("home-image-file").files[0]);
            const saved = (content.homeImages || []).find((item) => item.slot === slot);
            const defaultSlot = homeImageSlots.find((item) => item.slot === slot);

            await api("/api/home-images", {
                method: "POST",
                body: JSON.stringify({
                    slot,
                    title: document.getElementById("home-image-title").value,
                    alt: document.getElementById("home-image-alt").value,
                    storageId: storageId || undefined,
                    imageUrl: !storageId && !saved ? defaultSlot.imageUrl : undefined,
                }),
            });
            await loadContent();
        } catch (error) {
            setStatus(error.message);
        }
    });

    document.getElementById("project-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        setStatus("Saving project...");

        try {
            const imageStorageId = await uploadFile(document.getElementById("project-file").files[0]);
            await api("/api/projects", {
                method: "POST",
                body: JSON.stringify({
                    id: document.getElementById("project-id").value || undefined,
                    title: document.getElementById("project-title").value,
                    description: document.getElementById("project-description").value,
                    url: document.getElementById("project-url").value,
                    imageStorageId: imageStorageId || undefined,
                    imageAlt: document.getElementById("project-image-alt").value,
                    featured: document.getElementById("project-featured").checked,
                    order: Number(document.getElementById("project-order").value),
                    published: document.getElementById("project-published").checked,
                }),
            });
            await loadContent();
        } catch (error) {
            setStatus(error.message);
        }
    });

    if (!apiBase) {
        setStatus("Set window.PORTFOLIO_API_BASE in assets/js/runtime-config.js before using admin.");
        return;
    }

    verifyMagicLink()
        .then(function (handled) {
            if (handled || !token()) {
                return;
            }

            showAdmin();
            return loadContent().catch(function () {
                localStorage.removeItem(tokenKey);
                showLogin();
                setStatus("Session expired. Sign in again.");
            });
        })
        .catch(function (error) {
            localStorage.removeItem(tokenKey);
            window.history.replaceState({}, document.title, window.location.pathname);
            showLogin();
            setStatus(error.message);
        });

})();
