(function () {
    const apiBase = (window.PORTFOLIO_API_BASE || "").replace(/\/$/, "");
    const tokenKey = "portfolioAdminToken";
    let content = { photos: [], projects: [] };

    const status = document.getElementById("admin-status");
    const loginForm = document.getElementById("login-form");
    const adminPanel = document.getElementById("admin-panel");
    const logoutButton = document.getElementById("logout-button");

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
    }

    function resetProjectForm() {
        document.getElementById("project-form").reset();
        document.getElementById("project-id").value = "";
        document.getElementById("project-order").value = content.projects.length;
        document.getElementById("project-featured").checked = content.projects.length === 0;
        document.getElementById("project-published").checked = true;
    }

    function renderListItem(item, type) {
        const element = document.createElement("div");
        element.className = "grid gap-3 border border-[#ffffff26] p-4 sm:grid-cols-[96px_1fr_auto]";
        element.innerHTML = `
            <img src="${escapeHtml(item.imageUrl || "/assets/icons/favicon.svg")}" alt="" class="h-24 w-24 object-cover">
            <div>
                <h3 class="text-xl font-semibold">${escapeHtml(item.title)}</h3>
                <p class="mt-2 text-sm text-[#ffffff99]">${escapeHtml(type === "photo" ? item.category : item.url)}</p>
                <p class="mt-1 text-sm text-[#ffffff99]">${item.published ? "Published" : "Draft"} · Order ${Number(item.order)}</p>
            </div>
            <div class="flex gap-2 sm:flex-col">
                <button type="button" data-action="edit" class="border border-[#ffffff40] px-4 py-2 text-sm uppercase tracking-[0.2em]">Edit</button>
                <button type="button" data-action="delete" class="border border-[#ffffff40] px-4 py-2 text-sm uppercase tracking-[0.2em]">Delete</button>
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
            } else {
                document.getElementById("project-id").value = item.id;
                document.getElementById("project-title").value = item.title;
                document.getElementById("project-description").value = item.description;
                document.getElementById("project-url").value = item.url;
                document.getElementById("project-image-alt").value = item.imageAlt;
                document.getElementById("project-order").value = item.order;
                document.getElementById("project-featured").checked = item.featured;
                document.getElementById("project-published").checked = item.published;
            }
        });

        element.querySelector('[data-action="delete"]').addEventListener("click", async function () {
            const path = type === "photo" ? "/api/photos/delete" : "/api/projects/delete";
            await api(path, { method: "POST", body: JSON.stringify({ id: item.id }) });
            await loadContent();
        });

        return element;
    }

    function renderContent() {
        const photoList = document.getElementById("photo-list");
        const projectList = document.getElementById("project-list");
        photoList.innerHTML = "";
        projectList.innerHTML = "";

        content.photos
            .slice()
            .sort((a, b) => a.order - b.order)
            .forEach((photo) => photoList.appendChild(renderListItem(photo, "photo")));
        content.projects
            .slice()
            .sort((a, b) => a.order - b.order)
            .forEach((project) => projectList.appendChild(renderListItem(project, "project")));
    }

    async function loadContent() {
        content = await api("/api/admin/content", { method: "GET" });
        renderContent();
        resetPhotoForm();
        resetProjectForm();
        setStatus("Signed in. Changes publish immediately when saved.");
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            setStatus("Signing in...");
            const password = document.getElementById("admin-password").value;
            const session = await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
            localStorage.setItem(tokenKey, session.token);
            showAdmin();
            await loadContent();
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

    document.getElementById("photo-reset").addEventListener("click", resetPhotoForm);
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
        setStatus("Set window.PORTFOLIO_API_BASE in config.js before using admin.");
        return;
    }

    if (token()) {
        showAdmin();
        loadContent().catch(function () {
            localStorage.removeItem(tokenKey);
            showLogin();
            setStatus("Session expired. Sign in again.");
        });
    }
})();
