// ============================================
// CAPEMC — MAIN JAVASCRIPT
// ============================================


// 1. CAPE DATA

// The cape list now lives in capes.json. Edit it with the admin page.
let capes = [];
let publicCapes = [];
let siteSettings = {};

// Tool pages: #tools/<name> opens the page with this id.
const TOOL_PAGES = { gradient: "toolGradient", skin: "toolSkin", chibi: "toolChibi", banner: "toolBanner", skinart: "toolSkinArt" };


// ========================================
// SETTINGS (ADDED)
// ========================================

// FIXED: placeholder entries (29, 30) were showing on the live site.
// Set to true while you're editing if you want to see them.
const SHOW_PLACEHOLDERS = false;

const PAGE_TITLES = {
    home: "CapeMC — Minecraft Cape Archive",
    capes: "Capes — CapeMC",
    about: "About — CapeMC",
    players: "Players — CapeMC",
    tools: "Tools — CapeMC",
    skinDetail: "Skin — CapeMC",
    servers: "Servers — CapeMC",
    toolGradient: "Gradient Generator — CapeMC",
    toolSkin: "Skin Editor — CapeMC",
    toolChibi: "Chibi Maker — CapeMC",
    toolBanner: "Banner Designer — CapeMC",
    toolSkinArt: "Skin Art Maker — CapeMC",
    capeDetails: "CapeMC"
};

async function fetchJson(path) {
    try {
        const response = await fetch(path, { cache: "no-cache" });
        return response.ok ? await response.json() : null;
    } catch (error) {
        return null;
    }
}

async function loadSiteData() {
    const [capeData, settings] = await Promise.all([
        fetchJson("capes.json"),
        fetchJson("settings.json")
    ]);

    capes = Array.isArray(capeData?.capes) ? capeData.capes : (Array.isArray(capeData) ? capeData : []);

    // A cape doesn't need an "id". If it has none, one is made from its name
    // (Aurora Cape becomes "aurora-cape"), so you can just add capes.
    const slug = text => String(text || "cape").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cape";
    const used = new Set(capes.filter(cape => cape && cape.id).map(cape => cape.id));

    capes = capes.filter(cape => cape && typeof cape === "object" && cape.name);

    capes.forEach(cape => {
        if (cape.id) return;

        const base = slug(cape.name);
        let id = base;
        let count = 2;

        while (used.has(id)) id = `${base}-${count++}`;

        cape.id = id;
        used.add(id);
    });
    siteSettings = settings && typeof settings === "object" ? settings : {};

    const showPlaceholders = SHOW_PLACEHOLDERS || siteSettings.showPlaceholders === true;
    publicCapes = capes.filter(cape => showPlaceholders || !cape.placeholder);
}

function getYear(cape) {
    const match = (cape.releaseDate || "").match(/\b(?:19|20)\d{2}\b/);
    return match ? match[0] : "";
}


// ========================================
// CAPEMC — WEBSITE CONTROLS
// ========================================

document.body.classList.add("cm-layout");

// ========================================
// SIDEBAR
// ========================================

const menuButton = document.createElement("button");
menuButton.className = "cm-menu-toggle";
menuButton.type = "button";
menuButton.textContent = "☰";
menuButton.setAttribute("aria-label", "Open navigation menu");
menuButton.setAttribute("aria-expanded", "false");

const sidebar = document.createElement("aside");
sidebar.className = "cm-sidebar";
sidebar.setAttribute("aria-label", "Sidebar");

sidebar.innerHTML = `
    <div class="cm-sidebar-search" id="cmSidebarSearch">
        <label class="cm-sidebar-label" for="cmCapeSearch">
            Search capes or players
        </label>
        <input type="search" id="cmCapeSearch"
               class="cm-search"
               placeholder="Search capes or players..."
               autocomplete="off">
    </div>

    <nav class="cm-side-nav" aria-label="Sidebar navigation">
        <button class="cm-side-link active" data-page="home"
                type="button" aria-current="page">Home</button>
        <button class="cm-side-link" data-page="capes"
                type="button">Capes</button>
        <button class="cm-side-link" data-page="players"
                type="button">Players</button>
        <button class="cm-side-link" data-page="servers"
                type="button">Servers</button>
        <button class="cm-side-link" data-page="tools"
                type="button">Tools</button>
        <button class="cm-side-link" data-page="about"
                type="button">About</button>
    </nav>

    <div class="cm-sidebar-bottom">
        <a class="cm-nav-link" href="#" id="cmDonateButton" role="button">
            ❤️ Donate
        </a>

        <button type="button" id="cmThemeButton" aria-pressed="false">
            🌙 Dark mode
        </button>

        <a class="cm-nav-link cm-discord-link"
           href="https://discord.gg/Zr6xneyRKj"
           target="_blank" rel="noopener noreferrer">
            Join our Discord
        </a>

        <p class="cm-sidebar-credit">CapeMC · Cape archive</p>
    </div>
`;

const navbar = document.querySelector(".navbar");

// FIXED: the menu button lives inside the navbar now, so it stays
// attached to it (beside CAPEMC) instead of floating on the screen.
(navbar || document.body).appendChild(menuButton);

if (navbar) {
    navbar.insertAdjacentElement("afterend", sidebar);
} else {
    document.body.appendChild(sidebar);
}

const overlay = document.createElement("div");
overlay.className = "cm-sidebar-overlay";
document.body.appendChild(overlay);

// ========================================
// SIDEBAR OPEN / CLOSE
// ========================================

function openSidebar() {
    document.body.classList.add("cm-sidebar-open");
    menuButton.textContent = "×";
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close navigation menu");
}

function closeSidebar() {
    document.body.classList.remove("cm-sidebar-open");
    menuButton.textContent = "☰";
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
}

menuButton.addEventListener("click", () => {
    if (document.body.classList.contains("cm-sidebar-open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

overlay.addEventListener("click", closeSidebar);

// ========================================
// PAGE ELEMENTS
// ========================================

const homePage = document.getElementById("home");
const capesPage = document.getElementById("capes");
const capeGrid = document.getElementById("capeGrid");
const homeGrid = document.getElementById("homeGrid");
const sidebarSearch = document.getElementById("cmSidebarSearch");
const sidebarSearchInput = document.getElementById("cmCapeSearch");
const capeDetailContent = document.getElementById("capeDetailContent");

const navButtons = document.querySelectorAll(".nav-btn");
const sidebarButtons = document.querySelectorAll(".cm-side-link");
const pages = document.querySelectorAll(".page");

// ========================================
// SEARCH BARS
// ========================================

function createPageSearch(page, id) {
    if (!page) return null;

    const wrapper = document.createElement("div");
    wrapper.className = "cm-page-search";

    const input = document.createElement("input");
    input.type = "search";
    input.id = id;
    input.className = "cm-search";
    input.placeholder = "Search capes or players...";
    input.setAttribute("aria-label", "Search capes or players");
    input.autocomplete = "off";

    wrapper.appendChild(input);

    const heading = page.querySelector(".page-heading");

    if (heading) {
        heading.insertAdjacentElement("afterend", wrapper);
    } else {
        page.insertBefore(wrapper, page.firstChild);
    }

    return { wrapper, input };
}

const homeSearch = createPageSearch(homePage, "cmHomeSearch");
const capesSearch = createPageSearch(capesPage, "cmCapesSearch");

// FIXED: only touch an input if its value actually differs,
// so typing never resets the caret.
function syncSearchInputs(value) {
    [sidebarSearchInput, homeSearch?.input, capesSearch?.input]
        .filter(Boolean)
        .forEach(input => {
            if (input.value !== value) input.value = value;
        });
}

// ========================================
// PAGE NAVIGATION
// ========================================

function showPage(pageName, options = {}) {
    const closeMenu = options.closeMenu !== false;
    const scroll = options.scroll !== false;
    const focus = options.focus !== false;

    // FIXED: the Capes tab stays highlighted while viewing a cape.
    const navKey = pageName === "capeDetails"
        ? "capes"
        : pageName === "skinDetail"
            ? "players"
            : (/^tool[A-Z]/.test(pageName) ? "tools" : pageName);

    pages.forEach(page => {
        page.classList.toggle("hidden", page.id !== pageName);
    });

    [...navButtons, ...sidebarButtons].forEach(button => {
        const isActive = button.dataset.page === navKey;
        button.classList.toggle("active", isActive);

        if (isActive) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (homeSearch) {
        homeSearch.wrapper.classList.toggle("visible", pageName === "home");
    }

    if (capesSearch) {
        capesSearch.wrapper.classList.toggle("visible", pageName === "capes");
    }

    // FIXED: the sidebar search used to hide on Tools, About and other pages.
    if (sidebarSearch) {
        sidebarSearch.classList.add("visible");
    }

    // ADDED: tab title changes per page (cape pages set their own).
    if (pageName !== "capeDetails") {
        document.title = PAGE_TITLES[pageName] || PAGE_TITLES.home;
    }

    if (closeMenu) closeSidebar();

    if (scroll) {
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    // ADDED: move focus to the page heading so keyboard and
    // screen-reader users land on the new content.
    if (focus) {
        const heading = document.querySelector(`#${pageName} h1`);

        if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
        }
    }
}

// ========================================
// ROUTING (ADDED)
// Back/forward buttons and shareable links now work:
//   #home   #capes   #about   #cape/cape-1
// ========================================

function route(options = {}) {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));

    if (hash.startsWith("cape/")) {
        if (openCape(hash.slice(5), options)) return;

        // Unknown cape id: fall back to the list instead of a blank page.
        history.replaceState(null, "", "#capes");
        showPage("capes", options);
        return;
    }

    if (hash.startsWith("player/")) {
        showPage("players", { ...options, focus: false });
        lookupPlayer(hash.slice(7));
        return;
    }

    if (hash.startsWith("skin/")) {
        const skinHash = hash.slice(5).toLowerCase();

        if (/^[0-9a-f]{16,64}$/.test(skinHash)) {
            showPage("skinDetail", { ...options, focus: false });
            openSkin(skinHash);
            return;
        }
    }

    if (hash.startsWith("tools/")) {
        const toolPage = TOOL_PAGES[hash.slice(6)];

        if (toolPage) {
            showPage(toolPage, options);
            if (toolPage === "toolSkin") startEditorViewer();
            return;
        }
    }

    const pageName = ["home", "capes", "players", "servers", "tools", "about"].includes(hash) ? hash : "home";
    showPage(pageName, options);

    if (pageName === "servers") refreshServerStatuses(false);
    if (pageName === "players") refreshPlayerSkins();
}

function go(hash) {
    if (location.hash === hash) {
        route();
    } else {
        location.hash = hash;
    }
}

window.addEventListener("hashchange", () => route());

function clearSearch() {
    syncSearchInputs("");
    renderCapeCards("");
}

[...navButtons, ...sidebarButtons].forEach(button => {
    button.addEventListener("click", () => {
        clearSearch();
        go(`#${button.dataset.page}`);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        clearSearch();
        go(`#${button.dataset.go}`);
    });
});

const homeLogo = document.getElementById("homeLogo");

if (homeLogo) {
    homeLogo.addEventListener("click", event => {
        event.preventDefault();
        clearSearch();
        go("#home");
    });
}

// ========================================
// CAPE CARDS
// ========================================

let searchStatus = null;
let lookupLink = null;

// Owner counts live in cape-stats.json so you can update them
// without touching this file. Capes with no number simply show none.
let capeStats = {};
let capeStatLabels = {};
let trackedPlayers = null;
let capeSort = "default";
let sortSelect = null;

function sortCapes(list) {
    const year = cape => Number(getYear(cape)) || null;
    const owners = cape => capeStats[cape.id] ?? -1;
    const sorted = [...list];

    const byYear = direction => sorted.sort((a, b) => {
        const yearA = year(a);
        const yearB = year(b);

        if (yearA === null && yearB === null) return 0;
        if (yearA === null) return 1;
        if (yearB === null) return -1;

        return (yearA - yearB) * direction;
    });

    if (capeSort === "newest") return byYear(-1);
    if (capeSort === "oldest") return byYear(1);
    if (capeSort === "name") return sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (capeSort === "owners") return sorted.sort((a, b) => owners(b) - owners(a));

    return list;
}

if (capeGrid) {
    searchStatus = document.createElement("p");
    searchStatus.className = "cm-search-status";
    searchStatus.hidden = true;
    searchStatus.setAttribute("role", "status");
    capeGrid.insertAdjacentElement("beforebegin", searchStatus);

    // ADDED: search handles players too. Shows a link to look the text
    // up as a Bedrock gamertag.
    lookupLink = document.createElement("button");
    lookupLink.type = "button";
    lookupLink.className = "cm-lookup-link";
    lookupLink.hidden = true;
    searchStatus.insertAdjacentElement("afterend", lookupLink);

    lookupLink.addEventListener("click", () => {
        const name = lookupLink.dataset.name;
        clearSearch();
        go(`#player/${encodeURIComponent(name)}`);
    });
}

// ADDED: sort control on the Capes page
if (capesSearch) {
    const sortWrap = document.createElement("div");
    sortWrap.className = "cm-sort";

    const sortLabel = document.createElement("label");
    sortLabel.htmlFor = "cmSort";
    sortLabel.textContent = "Sort by";

    sortSelect = document.createElement("select");
    sortSelect.id = "cmSort";

    [["default", "Default"], ["newest", "Newest"], ["oldest", "Oldest"], ["name", "A–Z"]]
        .forEach(([value, text]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = text;
            sortSelect.appendChild(option);
        });

    sortSelect.addEventListener("change", () => {
        capeSort = sortSelect.value;
        renderCapeCards(capesSearch.input.value);
    });

    sortWrap.append(sortLabel, sortSelect);
    capesSearch.wrapper.insertAdjacentElement("afterend", sortWrap);
}

// "51 capes archived · 120 players tracked" under the home title.
function updateHomeStats() {
    const line = document.getElementById("homeStats");

    if (!line) return;

    const parts = [];

    if (publicCapes.length) {
        parts.push(`${publicCapes.length} cape${publicCapes.length === 1 ? "" : "s"} archived`);
    }

    if (trackedPlayers) {
        parts.push(`${trackedPlayers.toLocaleString()} player${trackedPlayers === 1 ? "" : "s"} tracked`);
    }

    line.textContent = parts.join(" · ");
    line.hidden = parts.length === 0;
}

async function loadCapeStats() {
    const [manual, live] = await Promise.all([
        fetchJson("cape-stats.json"),
        fetchJson("/api/capes/stats")
    ]);

    const stats = {};
    const labels = {};

    // Numbers you typed in the admin page.
    Object.entries(manual?.owners || {}).forEach(([id, count]) => {
        if (typeof count === "number") {
            stats[id] = count;
            labels[id] = "owners";
        }
    });

    // Numbers counted by your database. A cape needs its texture "hash"
    // set in the admin page to be matched.
    capes.forEach(cape => {
        const count = live?.owners?.[cape.hash];

        if (cape.hash && typeof count === "number") {
            stats[cape.id] = count;
            labels[cape.id] = "tracked";
        }
    });

    trackedPlayers = typeof live?.players === "number" ? live.players : null;
    updateHomeStats();

    if (!Object.keys(stats).length) return;

    capeStats = stats;
    capeStatLabels = labels;

    if (sortSelect && !sortSelect.querySelector('[value="owners"]')) {
        const option = document.createElement("option");
        option.value = "owners";
        option.textContent = "Most owners";
        sortSelect.appendChild(option);
    }

    renderCapeCards(capesSearch ? capesSearch.input.value : "");
    fillGrid(homeGrid, publicCapes.slice(0, 3));

    // If a cape page is open (shared link), redraw it with the numbers.
    if (location.hash.startsWith("#cape/")) route({ focus: false, scroll: false });
}

// CHANGED: cards are real links (was a div-style "button"), so
// middle-click, open-in-new-tab and Enter all work natively.
function buildCapeCard(cape) {
    const card = document.createElement("a");
    card.className = "cape-card";
    card.href = `#cape/${encodeURIComponent(cape.id)}`;
    card.setAttribute("aria-label", `View ${cape.name}`);

    const imageArea = document.createElement("div");
    imageArea.className = "cape-image";

    if (cape.image) {
        const image = document.createElement("img");
        image.src = cape.image;
        image.alt = cape.name;
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", () => {
            image.remove();
            imageArea.textContent = "Image unavailable";
        }, { once: true });

        imageArea.appendChild(image);
    } else {
        imageArea.textContent = "Image placeholder";
    }

    const info = document.createElement("div");
    info.className = "cape-info";

    const name = document.createElement("h2");
    name.className = "cape-name";
    name.textContent = cape.name;
    info.appendChild(name);

    const year = getYear(cape);

    if (year) {
        const yearText = document.createElement("p");
        yearText.className = "cape-year";
        yearText.textContent = year;
        info.appendChild(yearText);
    }

    if (typeof capeStats[cape.id] === "number") {
        const ownersText = document.createElement("p");
        ownersText.className = "cape-owners";
        ownersText.textContent = `${capeStats[cape.id].toLocaleString()} ${capeStatLabels[cape.id] || "owners"}`;
        info.appendChild(ownersText);
    }

    card.append(imageArea, info);
    return card;
}

function fillGrid(grid, list) {
    if (!grid) return;
    grid.replaceChildren(...list.map(buildCapeCard));
}

function renderCapeCards(searchTerm = "") {
    if (!capeGrid) return;

    const query = searchTerm.trim().toLowerCase();

    // FIXED: search used to match the whole release-date text, so typing
    // "verify" or "date" matched every unfinished entry. Now it matches
    // the cape name or its year only.
    let results = publicCapes.filter(cape =>
        !query ||
        cape.name.toLowerCase().includes(query) ||
        getYear(cape).includes(query)
    );

    results = sortCapes(results);

    if (searchStatus) {
        searchStatus.hidden = !query;
        searchStatus.textContent =
            `${results.length} cape${results.length === 1 ? "" : "s"} found`;
    }

    if (lookupLink) {
        const name = searchTerm.trim();
        lookupLink.hidden = !name || name.length > 16;
        lookupLink.dataset.name = name;
        lookupLink.textContent = `Look up player “${name}” →`;
    }

    if (results.length === 0) {
        const message = document.createElement("p");
        message.className = "cm-no-results";
        message.textContent = "No capes found. Try another search.";
        capeGrid.replaceChildren(message);
        return;
    }

    fillGrid(capeGrid, results);
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function handleSearch(value, source) {
    syncSearchInputs(value);
    renderCapeCards(value);

    if (value.trim()) {
        const alreadyOnCapes =
            capesPage && !capesPage.classList.contains("hidden");

        if (!alreadyOnCapes) {
            history.pushState(null, "", "#capes");

            // Keep the sidebar open while searching from it.
            showPage("capes", {
                closeMenu: false,
                scroll: false,
                focus: false
            });

            // FIXED: typing in the Home search hid that input after one
            // letter, so focus was lost. Hand focus to the Capes search.
            if (source === homeSearch?.input && capesSearch) {
                capesSearch.input.focus();
                const end = capesSearch.input.value.length;
                capesSearch.input.setSelectionRange(end, end);
            }
        }
    }
}

[
    sidebarSearchInput,
    homeSearch?.input,
    capesSearch?.input
].filter(Boolean).forEach(input => {
    input.addEventListener("input", () => {
        handleSearch(input.value, input);
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            clearSearch();
        }

        if (event.key === "Enter" && input.value.trim()) {
            const firstCard = capeGrid?.querySelector(".cape-card");

            if (firstCard) {
                firstCard.click();
            } else if (lookupLink && !lookupLink.hidden) {
                lookupLink.click();
            }
        }
    });
});

// ========================================
// CAPE DETAIL PAGES
// ========================================

function addDetailSection(container, heading, content) {
    if (typeof content !== "string" || !content.trim()) return;

    const section = document.createElement("div");
    section.className = "cape-detail-section";

    const title = document.createElement("h2");
    title.textContent = heading;

    const paragraph = document.createElement("p");
    paragraph.textContent = content;

    section.append(title, paragraph);
    container.appendChild(section);
}

// CHANGED: returns true/false so the router can handle unknown ids.
function openCape(capeId, options = {}) {
    const cape = capes.find(item => item.id === capeId);

    if (!cape || !capeDetailContent) return false;

    capeDetailContent.replaceChildren();

    const container = document.createElement("div");
    container.className = "cape-detail";

    const title = document.createElement("h1");
    title.textContent = cape.name;
    container.appendChild(title);

    const imageFrame = document.createElement("div");
    imageFrame.className = "cape-detail-image-frame";

    if (cape.image) {
        const image = document.createElement("img");
        image.className = "cape-detail-image-content";
        image.src = cape.image;
        image.alt = cape.name;
        image.decoding = "async";

        image.addEventListener("error", () => {
            image.remove();

            const fallback = document.createElement("p");
            fallback.className = "cape-detail-image-fallback";
            fallback.textContent = "Image unavailable";
            imageFrame.appendChild(fallback);
        }, { once: true });

        imageFrame.appendChild(image);
    } else {
        const fallback = document.createElement("p");
        fallback.className = "cape-detail-image-fallback";
        fallback.textContent = "Cape image placeholder";
        imageFrame.appendChild(fallback);
    }

    container.appendChild(imageFrame);

    if (cape.placeholder) {
        addDetailSection(
            container,
            "Status",
            "This is a placeholder entry. Add verified cape information before publishing."
        );
    }

    addDetailSection(container, "Release Date", cape.releaseDate);

    if (typeof capeStats[cape.id] === "number") {
        addDetailSection(
            container,
            "Owners",
            capeStatLabels[cape.id] === "tracked"
                ? `${capeStats[cape.id].toLocaleString()} players tracked by CapeMC have worn this cape.`
                : `${capeStats[cape.id].toLocaleString()} players own this cape.`
        );
    }
    addDetailSection(container, "How to Obtain", cape.obtain);
    addDetailSection(container, "Description", cape.description);
    addDetailSection(container, "Additional Information", cape.details);

    capeDetailContent.appendChild(container);
    showPage("capeDetails", options);
    document.title = `${cape.name} — CapeMC`;

    return true;
}

const backButton = document.getElementById("backToCapes");

if (backButton) {
    backButton.addEventListener("click", () => {
        go("#capes");
    });
}

// ========================================
// DONATION POPUP
// ========================================

const donationOverlay = document.createElement("div");
donationOverlay.className = "cm-donation-overlay";
donationOverlay.id = "cmDonationOverlay";

// PAYPAL: paste your PayPal.me link here (for example
// "https://www.paypal.me/YourName"). No email address is needed.
// While this is empty, the PayPal option stays hidden.
const PAYPAL_URL = "";

const paypalOption = /^https:\/\//.test(PAYPAL_URL)
    ? `<a class="cm-donation-option"
               href="${encodeURI(PAYPAL_URL)}"
               target="_blank" rel="noopener noreferrer">
                <span class="cm-donation-icon">💙</span>
                <span>
                    <strong>Donate with PayPal</strong>
                    <small>Support us through PayPal</small>
                </span>
                <span class="cm-donation-arrow">↗</span>
            </a>`
    : "";

donationOverlay.innerHTML = `
    <div class="cm-donation-panel" role="dialog"
         aria-modal="true" aria-labelledby="cmDonationTitle">

        <button class="cm-donation-close" id="cmDonationClose"
                type="button" aria-label="Close donations">
            &times;
        </button>

        <div class="cm-donation-heart">❤️</div>
        <h2 id="cmDonationTitle">Support CapeMC</h2>

        <p class="cm-donation-message">
            Help us keep the Minecraft cape archive alive.
        </p>

        <div class="cm-donation-options">

            ${paypalOption}

            <div class="cm-crypto-option">
                <div class="cm-crypto-info">
                    <span class="cm-donation-icon">₿</span>
                    <span>
                        <strong>Bitcoin (BTC)</strong>
                        <small class="cm-wallet-address">bc1qyw5a76kp4fzm2r5vfgz2yjnn5zf83zgdegvagn</small>
                    </span>
                </div>
                <button class="cm-copy-wallet" type="button"
                        data-wallet="bc1qyw5a76kp4fzm2r5vfgz2yjnn5zf83zgdegvagn">
                    Copy
                </button>
            </div>

            <div class="cm-crypto-option">
                <div class="cm-crypto-info">
                    <span class="cm-donation-icon">Ł</span>
                    <span>
                        <strong>Litecoin (LTC)</strong>
                        <small class="cm-wallet-address">LLeW8X48gChzcZegFsJfNkkxqS8qsEzcYJ</small>
                    </span>
                </div>
                <button class="cm-copy-wallet" type="button"
                        data-wallet="LLeW8X48gChzcZegFsJfNkkxqS8qsEzcYJ">
                    Copy
                </button>
            </div>

            <div class="cm-crypto-option">
                <div class="cm-crypto-info">
                    <span class="cm-donation-icon">Ξ</span>
                    <span>
                        <strong>Ethereum (ETH)</strong>
                        <small class="cm-wallet-address">0x7B354ad6f8AB87A2E03F00791D1DF7E057C74f73</small>
                    </span>
                </div>
                <button class="cm-copy-wallet" type="button"
                        data-wallet="0x7B354ad6f8AB87A2E03F00791D1DF7E057C74f73">
                    Copy
                </button>
            </div>

        </div>

        <p class="cm-donation-note">
            Donations are optional and appreciated.
            Double-check the cryptocurrency and network before sending.
        </p>

        <p class="cm-copy-status" id="cmCopyStatus"
           role="status" aria-live="polite"></p>
    </div>
`;

document.body.appendChild(donationOverlay);

const donateButton = document.getElementById("cmDonateButton");
const donationClose = document.getElementById("cmDonationClose");
const copyStatus = document.getElementById("cmCopyStatus");

let lastFocused = null;

function isDonationOpen() {
    return donationOverlay.classList.contains("cm-donation-visible");
}

function openDonations() {
    lastFocused = document.activeElement;
    closeSidebar();
    donationOverlay.classList.add("cm-donation-visible");
    document.body.classList.add("cm-donation-open");
    copyStatus.textContent = "";
    donationClose.focus();
}

function closeDonations() {
    if (!isDonationOpen()) return;

    donationOverlay.classList.remove("cm-donation-visible");
    document.body.classList.remove("cm-donation-open");

    // ADDED: give focus back to whatever opened the popup.
    if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus();
    }
}

if (donateButton) {
    donateButton.addEventListener("click", event => {
        event.preventDefault();
        openDonations();
    });
}

donationClose.addEventListener("click", closeDonations);

donationOverlay.addEventListener("click", event => {
    if (event.target === donationOverlay) {
        closeDonations();
    }
});

// ADDED: Tab stays inside the popup while it's open.
donationOverlay.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;

    const focusable = donationOverlay.querySelectorAll("a[href], button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

// ========================================
// COPY CRYPTO ADDRESSES
// ========================================

async function copyWalletAddress(wallet) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(wallet);
            return true;
        } catch (error) {
            // FIXED: a blocked clipboard used to end here. Fall through
            // to the older method instead of failing.
        }
    }

    const textArea = document.createElement("textarea");
    textArea.value = wallet;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.fontSize = "16px"; // stops iOS zooming in

    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, wallet.length); // iOS needs this

    let copied = false;

    try {
        copied = document.execCommand("copy");
    } catch (error) {
        copied = false;
    }

    textArea.remove();
    return copied;
}

let copyStatusTimer = null;

function setCopyStatus(message) {
    copyStatus.textContent = message;
    clearTimeout(copyStatusTimer);
    copyStatusTimer = setTimeout(() => {
        copyStatus.textContent = "";
    }, 3000);
}

donationOverlay.querySelectorAll(".cm-copy-wallet").forEach(button => {
    button.addEventListener("click", async () => {
        try {
            const copied = await copyWalletAddress(button.dataset.wallet);

            if (!copied) {
                setCopyStatus("Copy unavailable. Please copy the address manually.");
                return;
            }

            button.textContent = "Copied!";
            setCopyStatus("Wallet address copied.");

            setTimeout(() => {
                button.textContent = "Copy";
            }, 1800);
        } catch (error) {
            setCopyStatus("Copy failed. Please copy the address manually.");
        }
    });
});

// ========================================
// KEYBOARD CONTROLS
// ========================================

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (isDonationOpen()) {
        closeDonations();
    } else if (document.body.classList.contains("cm-sidebar-open")) {
        closeSidebar();
        menuButton.focus();
    }
});

// ========================================
// PLAYER PROFILES (ADDED)
// Java usernames + equipped cape via the public PlayerDB API.
// The Bedrock tab is a placeholder until a Bedrock API is added.
// ========================================

const PLAYER_API = "https://playerdb.co/api/player/minecraft/";
const GEYSER_API = "https://api.geysermc.org/v2";
const playerForm = document.getElementById("playerForm");
const playerInput = document.getElementById("playerInput");
const playerResult = document.getElementById("playerResult");
let playerRequestId = 0;

function showPlayerMessage(text) {
    const message = document.createElement("p");
    message.className = "player-message";
    message.textContent = text;
    playerResult.replaceChildren(message);
}

function secureUrl(url) {
    return url ? String(url).replace(/^http:/, "https:") : null;
}

// The skin and cape live in a base64 "textures" property.
function readTextures(player) {
    const result = { skin: null, cape: null };
    const property = (player.properties || []).find(item => item.name === "textures");

    if (property) {
        try {
            const textures = JSON.parse(atob(property.value)).textures || {};
            result.skin = textures.SKIN?.url || null;
            result.cape = textures.CAPE?.url || null;
        } catch (error) {
            // Fall back to the plain fields below.
        }
    }

    result.skin = secureUrl(result.skin || player.skin_texture);
    result.cape = secureUrl(result.cape || player.cape_texture);
    return result;
}

function loadImage(url, onLoad) {
    const image = new Image();
    image.addEventListener("load", () => onLoad(image));
    image.src = url;
}

function drawHead(canvas, skinUrl) {
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    loadImage(skinUrl, skin => {
        ctx.drawImage(skin, 8, 8, 8, 8, 0, 0, 8, 8);   // face
        ctx.drawImage(skin, 40, 8, 8, 8, 0, 0, 8, 8);  // hat layer
    });
}

// Draws the front of the cape (works for 64x32 and HD sizes).
function drawCape(canvas, capeUrl) {
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    loadImage(capeUrl, cape => {
        const k = cape.width / 64;
        ctx.drawImage(cape, k, k, 10 * k, 16 * k, 0, 0, 10, 16);
    });
}

function buildInfoRow(label, value, copyable) {
    const row = document.createElement("div");
    row.className = "profile-row";

    const labelEl = document.createElement("strong");
    labelEl.textContent = label;

    const valueEl = document.createElement("code");
    valueEl.textContent = value;

    row.append(labelEl, valueEl);

    if (copyable) {
        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "profile-copy";
        copy.textContent = "Copy";
        copy.addEventListener("click", async () => {
            const copied = await copyWalletAddress(value);
            copy.textContent = copied ? "Copied!" : "Failed";
            setTimeout(() => { copy.textContent = "Copy"; }, 1800);
        });
        row.appendChild(copy);
    }

    return row;
}

function buildCapesPanel(textures, names = [], history = [], trackedSince = null) {
    const panel = document.createElement("div");

    if (!textures.cape) {
        const empty = document.createElement("p");
        empty.className = "player-message";
        empty.textContent = names.length || history.length
            ? "No cape equipped right now."
            : "No cape equipped. Only the cape a player is wearing can be shown; a full list of owned capes isn't public.";
        panel.appendChild(empty);
    } else {
        const grid = document.createElement("div");
        grid.className = "cape-tiles";

        const tile = document.createElement("div");
        tile.className = "cape-tile";

        const canvas = document.createElement("canvas");
        canvas.width = 10;
        canvas.height = 16;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", "Equipped cape");
        drawCape(canvas, textures.cape);

        const label = document.createElement("p");
        label.textContent = "Equipped";

        tile.append(canvas, label);
        grid.appendChild(tile);
        panel.appendChild(grid);
    }

    // Cape history recorded by CapeMC's own database.
    if (history.length) {
        const heading = document.createElement("span");
        heading.className = "tool-label";
        heading.textContent = `Cape history (${history.length})`;

        const grid = document.createElement("div");
        grid.className = "cape-tiles";

        history.forEach(entry => {
            const known = capes.find(cape => cape.hash && cape.hash === entry.cape_hash);
            const tile = document.createElement("div");
            tile.className = "cape-tile";

            const canvas = document.createElement("canvas");
            canvas.width = 10;
            canvas.height = 16;
            canvas.setAttribute("role", "img");
            canvas.setAttribute("aria-label", known ? known.name : "Unlisted cape");
            drawCape(canvas, `https://textures.minecraft.net/texture/${entry.cape_hash}`);

            const label = document.createElement("p");
            label.textContent = known ? known.name : "Unlisted cape";

            const date = document.createElement("p");
            date.textContent = `Seen ${formatDate(entry.first_seen)}`;

            tile.append(canvas, label, date);
            grid.appendChild(tile);
        });

        panel.append(heading, grid);

        if (trackedSince) {
            const note = document.createElement("p");
            note.className = "player-note";
            note.textContent = `CapeMC has tracked this player since ${formatDate(trackedSince)}. Capes worn before that aren't recorded.`;
            panel.appendChild(note);
        }
    }

    // Cape names from ViewMC (names only, no pictures).
    if (names.length) {
        const heading = document.createElement("span");
        heading.className = "tool-label";
        heading.textContent = "Capes on record";

        const list = document.createElement("div");
        list.className = "badge-row";

        names.forEach(name => {
            const chip = document.createElement("span");
            chip.className = "badge badge-cape";
            chip.textContent = name;
            list.appendChild(chip);
        });

        panel.append(heading, list);
    }

    return panel;
}

function buildBedrockPanel(bedrock) {
    const panel = document.createElement("div");
    const note = document.createElement("p");
    note.className = "player-message";

    if (!bedrock) {
        note.textContent = "No Bedrock profile found. Only players who have joined a Geyser server can be found.";
        panel.appendChild(note);
        return panel;
    }

    if (bedrock.capeUrl) {
        panel.appendChild(buildCapesPanel({ cape: bedrock.capeUrl }));
    } else {
        note.textContent = "No Bedrock cape found. Bedrock cape data isn't available for every player.";
        panel.appendChild(note);
    }

    if (bedrock.skinUrl) {
        const link = document.createElement("a");
        link.className = "profile-link";
        link.href = bedrock.skinUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "View Bedrock skin texture ↗";
        panel.appendChild(link);
    }

    return panel;
}

// ---------- 3D skin viewer (skinview3d) ----------

let activeViewer = null;

function disposeViewer() {
    if (activeViewer) {
        try { activeViewer.dispose(); } catch (error) { /* already gone */ }
        activeViewer = null;
    }
}

function createViewer(canvas, width, height) {
    const viewer = new skinview3d.SkinViewer({ canvas, width, height });

    if (!viewer.controls && skinview3d.createOrbitControls) {
        skinview3d.createOrbitControls(viewer);
    }

    if (viewer.controls) {
        viewer.controls.enableZoom = false;
        viewer.controls.enablePan = false;
    }

    return viewer;
}

function buildViewerFrame({ skinSources, capeUrl, fallbackSrc, label }) {
    const frame = document.createElement("div");
    frame.className = "profile-skin-frame";

    // Used when WebGL or the skin download isn't available.
    const showFallback = () => {
        disposeViewer();

        if (!fallbackSrc) {
            frame.remove();
            return;
        }

        const image = document.createElement("img");
        image.src = fallbackSrc;
        image.alt = `${label}'s skin`;
        image.addEventListener("error", () => frame.remove(), { once: true });
        frame.replaceChildren(image);
    };

    if (typeof skinview3d === "undefined") {
        showFallback();
        return frame;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "profile-skin-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${label}'s skin. Drag to rotate.`);

    let viewer;

    try {
        viewer = createViewer(canvas, 300, 380);
    } catch (error) {
        showFallback();
        return frame;
    }

    activeViewer = viewer;

    // One place holds what's switched on; the buttons just change it.
    const state = { spin: true, walk: true, back: capeUrl ? "cape" : "none" };

    function applyMotion() {
        viewer.autoRotate = state.spin;

        if (state.walk) {
            viewer.animation = new skinview3d.WalkingAnimation();
        } else if (skinview3d.IdleAnimation) {
            viewer.animation = new skinview3d.IdleAnimation();
        } else {
            viewer.animation = null;
        }
    }

    async function applyBack() {
        try {
            if (state.back === "none" || !capeUrl) {
                await viewer.loadCape(null);
            } else {
                await viewer.loadCape(capeUrl, { backEquipment: state.back });
            }
        } catch (error) {
            // Cape texture failed to load; the skin still shows.
        }
    }

    applyMotion();

    (async () => {
        for (const source of skinSources) {
            try {
                await viewer.loadSkin(source);
                applyBack();
                return;
            } catch (error) {
                // Try the next source.
            }
        }

        if (activeViewer === viewer) showFallback();
    })();

    // ----- Buttons -----
    const controls = document.createElement("div");
    controls.className = "viewer-controls";

    const buttons = [];

    function refreshButtons() {
        buttons.forEach(({ button, isOn }) => {
            button.setAttribute("aria-pressed", String(isOn()));
        });
    }

    function addGroup(label, items) {
        const group = document.createElement("div");
        group.className = "viewer-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", label);

        items.forEach(({ text, isOn, onClick }) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "viewer-btn";
            button.textContent = text;

            button.addEventListener("click", () => {
                onClick();
                refreshButtons();
            });

            buttons.push({ button, isOn });
            group.appendChild(button);
        });

        controls.appendChild(group);
    }

    addGroup("Motion", [
        { text: "Spin", isOn: () => state.spin, onClick: () => { state.spin = !state.spin; applyMotion(); } },
        { text: "Walk", isOn: () => state.walk, onClick: () => { state.walk = !state.walk; applyMotion(); } }
    ]);

    if (capeUrl) {
        const toggleBack = type => () => {
            state.back = state.back === type ? "none" : type;
            applyBack();
        };

        addGroup("Back item", [
            { text: "Cape", isOn: () => state.back === "cape", onClick: toggleBack("cape") },
            { text: "Elytra", isOn: () => state.back === "elytra", onClick: toggleBack("elytra") }
        ]);
    }

    refreshButtons();
    frame.append(canvas, controls);
    return frame;
}

// ---------- Badges ----------
// Badges come from badges.json. Use admin.html to build that file.

const SVG_NS = "http://www.w3.org/2000/svg";

// Each badge: icon drawn from `paths` (24x24 outline), or your own image
// at `image` if that file exists in the badges/ folder.
const BADGE_TYPES = {
    dev: {
        label: "Developer",
        tag: "Website developer",
        text: "This user helps build and run CapeMC.",
        image: "badges/dev.png",
        paths: ["M8 6 2 12l6 6", "M16 6l6 6-6 6", "M14 4l-4 16"]
    },
    supporter: {
        label: "Supporter",
        tag: "Donor reward",
        text: "This user supported CapeMC with a donation of more than $5.",
        image: "badges/supporter.png",
        paths: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"]
    },
    contributor: {
        label: "Contributor",
        tag: "Helps improve the site",
        text: "This user helped improve CapeMC.",
        image: "badges/contributor.png",
        paths: ["M3 6h5.5a2.5 2.5 0 1 1 5 0H19v4a2.5 2.5 0 1 1 0 5v5H3z"]
    }
};

function buildBadgeIcon(type) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    BADGE_TYPES[type].paths.forEach(d => {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
    });

    return svg;
}

let badgesPromise = null;

function loadBadges() {
    if (!badgesPromise) {
        badgesPromise = fetch("badges.json", { cache: "no-cache" })
            .then(response => (response.ok ? response.json() : { players: [] }))
            .then(data => (Array.isArray(data.players) ? data.players : []))
            .catch(() => []);
    }

    return badgesPromise;
}

function normalizeId(id) {
    return String(id || "").replace(/-/g, "").toLowerCase();
}

function fillBadges(row, ids) {
    const wanted = ids.map(normalizeId).filter(Boolean);
    const buttons = [];
    let popup = null;
    let openType = null;

    function closePopup() {
        if (popup) popup.hidden = true;
        openType = null;
        buttons.forEach(button => button.setAttribute("aria-expanded", "false"));
    }

    function togglePopup(type, button) {
        if (openType === type) {
            closePopup();
            return;
        }

        const info = BADGE_TYPES[type];

        if (!popup) {
            popup = document.createElement("div");
            popup.className = "badge-pop";
            popup.setAttribute("role", "status");
            row.parentElement.insertAdjacentElement("afterend", popup);
        }

        const title = document.createElement("strong");
        title.textContent = info.label;

        const tag = document.createElement("span");
        tag.className = "badge-tag";
        tag.textContent = info.tag;

        const text = document.createElement("p");
        text.textContent = info.text;

        popup.dataset.type = type;
        popup.hidden = false;
        popup.replaceChildren(title, tag, text);
        openType = type;

        buttons.forEach(item => {
            item.setAttribute("aria-expanded", String(item === button));
        });
    }

    // Tap anywhere else to close. Stops itself once the profile is gone.
    function closeOnOutsideTap(event) {
        if (!document.contains(row)) {
            document.removeEventListener("click", closeOnOutsideTap);
            return;
        }

        if (!row.contains(event.target) && !(popup && popup.contains(event.target))) {
            closePopup();
        }
    }

    document.addEventListener("click", closeOnOutsideTap);

    loadBadges().then(players => {
        const found = new Set();

        players.forEach(player => {
            if (wanted.includes(normalizeId(player.id))) {
                (player.badges || []).forEach(badge => found.add(badge));
            }
        });

        Object.keys(BADGE_TYPES).forEach(type => {
            if (!found.has(type)) return;

            const info = BADGE_TYPES[type];
            const button = document.createElement("button");
            button.type = "button";
            button.className = "badge-btn";
            button.dataset.type = type;
            button.setAttribute("aria-label", `${info.label} badge: ${info.tag}`);
            button.setAttribute("aria-expanded", "false");
            button.appendChild(buildBadgeIcon(type));

            // Use your own picture if badges/<name>.png exists.
            const picture = new Image();
            picture.alt = "";
            picture.addEventListener("load", () => button.replaceChildren(picture));
            picture.src = info.image;

            button.addEventListener("click", () => togglePopup(type, button));
            buttons.push(button);
            row.appendChild(button);
        });
    });
}

function renderProfile(java, bedrock) {
    disposeViewer();
    const displayName = java ? java.player.username : bedrock.gamertag;
    const headSkin = (java && java.textures.skin) || (bedrock && bedrock.skinUrl) || null;

    const wrapper = document.createElement("div");
    wrapper.className = "profile";

    // Header card
    const card = document.createElement("div");
    card.className = "player-card";

    const head = document.createElement("canvas");
    head.className = "player-head";
    head.width = 8;
    head.height = 8;
    head.setAttribute("role", "img");
    head.setAttribute("aria-label", `${displayName}'s skin head`);
    if (headSkin) drawHead(head, headSkin);

    const info = document.createElement("div");
    info.className = "player-info";

    const nameRow = document.createElement("div");
    nameRow.className = "profile-name-row";

    const name = document.createElement("h2");
    name.textContent = displayName;

    const badgeRow = document.createElement("div");
    badgeRow.className = "badge-row";

    nameRow.append(name, badgeRow);
    info.appendChild(nameRow);
    fillBadges(badgeRow, [java?.player.id, java?.player.raw_id, bedrock?.xuid]);

    if (java) info.appendChild(buildInfoRow("UUID", java.player.id, true));
    if (bedrock) info.appendChild(buildInfoRow("XUID", bedrock.xuid, true));

    if (java) {
        const nameMc = document.createElement("a");
        nameMc.className = "profile-link";
        nameMc.href = `https://namemc.com/profile/${encodeURIComponent(java.player.username)}`;
        nameMc.target = "_blank";
        nameMc.rel = "noopener noreferrer";
        nameMc.textContent = "View on NameMC ↗";
        info.appendChild(nameMc);
    }

    // Shows how fresh the data is, so a stale cape is easy to spot.
    const updated = (java && java.cachedAt) || (bedrock && bedrock.cachedAt);

    if (updated) {
        const updatedLine = document.createElement("p");
        updatedLine.className = "profile-updated";
        updatedLine.textContent = `Data updated ${timeAgo(updated)}`;
        info.appendChild(updatedLine);
    }

    card.append(head, info);
    wrapper.appendChild(card);

    // 3D skin viewer (drag to rotate)
    const skinSources = java
        ? [java.textures.skin, `https://mc-heads.net/skin/${encodeURIComponent(java.player.raw_id || java.player.id)}`].filter(Boolean)
        : [bedrock.skinUrl].filter(Boolean);

    if (skinSources.length) {
        wrapper.appendChild(buildViewerFrame({
            skinSources,
            capeUrl: java ? java.textures.cape : null,
            fallbackSrc: java ? `https://mc-heads.net/body/${encodeURIComponent(java.player.raw_id || java.player.id)}/right` : null,
            label: displayName
        }));
    }

    // Java / Bedrock tabs
    const panel = document.createElement("div");
    const tabs = document.createElement("div");
    tabs.className = "profile-tabs";
    tabs.setAttribute("role", "tablist");

    const javaMissing = () => {
        const empty = document.createElement("p");
        empty.className = "player-message";
        empty.textContent = "No Java account found with this name.";
        const box = document.createElement("div");
        box.appendChild(empty);
        return box;
    };

    const tabData = [
        {
            id: "java",
            label: "Java",
            count: java ? Math.max((java.capeNames || []).length, (java.tracked?.capes || []).length, java.textures.cape ? 1 : 0) : 0,
            build: () => (java ? buildCapesPanel(java.textures, java.capeNames || [], java.tracked?.capes || [], java.tracked?.trackedSince) : javaMissing())
        },
        {
            id: "bedrock",
            label: "Bedrock",
            count: bedrock && bedrock.capeUrl ? 1 : 0,
            build: () => buildBedrockPanel(bedrock)
        }
    ];

    if (java) {
        tabData.push({
            id: "history",
            label: "History",
            count: (java.nameHistory || []).length + (java.skinHistory || []).length,
            build: () => buildHistoryPanel(java)
        });
    }

    function selectTab(selected) {
        tabs.querySelectorAll(".profile-tab").forEach(tab => {
            const isActive = tab.dataset.tab === selected.id;
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
        });

        panel.replaceChildren(selected.build());
    }

    tabData.forEach(item => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "profile-tab";
        tab.dataset.tab = item.id;
        tab.setAttribute("role", "tab");
        tab.textContent = item.label;

        const count = document.createElement("span");
        count.textContent = item.count;
        tab.appendChild(count);

        tab.addEventListener("click", () => selectTab(item));
        tabs.appendChild(tab);
    });

    wrapper.append(tabs, panel);
    selectTab(java ? tabData[0] : tabData[1]);

    playerResult.replaceChildren(wrapper);
}

// Java: PlayerDB (reads Mojang's public profile data).
async function fetchJavaFromPlayerDb(name) {
    if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) return { status: "none" };

    try {
        const response = await fetch(PLAYER_API + encodeURIComponent(name), { cache: "no-store" });
        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        const player = data?.data?.player;

        if (player && player.username) {
            return { status: "found", player, textures: readTextures(player) };
        }

        return { status: response.status >= 500 ? "error" : "none" };
    } catch (error) {
        return { status: "error" };
    }
}

// Bedrock: GeyserMC Global API. Only knows players who have joined
// a Geyser server, and has no cape data.
async function fetchBedrockFromGeyser(name) {
    try {
        const response = await fetch(`${GEYSER_API}/xbox/xuid/${encodeURIComponent(name)}`);

        if (!response.ok) return { status: "none" };

        // Read as text so the long XUID is never rounded.
        const match = (await response.text()).match(/"xuid"\s*:\s*"?(\d+)/);

        if (!match) return { status: "none" };

        const xuid = match[1];
        let skinUrl = null;

        try {
            const skinResponse = await fetch(`${GEYSER_API}/skin/${xuid}`);

            if (skinResponse.ok) {
                const skinData = await skinResponse.json();

                if (skinData.texture_id) {
                    skinUrl = `https://textures.minecraft.net/texture/${encodeURIComponent(skinData.texture_id)}`;
                }
            }
        } catch (error) {
            // Skin is optional.
        }

        return { status: "found", gamertag: name, xuid, skinUrl };
    } catch (error) {
        return { status: "error" };
    }
}

// ---------- mc-api.io (main source for Java + Bedrock) ----------
// Open CORS, supports both editions, and reports when its data was
// last refreshed (cachedAt). PlayerDB / Geyser stay as backups.

const MC_API = "https://mc-api.io";

function mcApiTextures(doc) {
    let skin = doc.decodedTexture?.textures?.SKIN?.url || null;
    let cape = doc.decodedTexture?.textures?.CAPE?.url || null;

    if (!skin && !cape && doc.textures?.value) {
        try {
            const textures = JSON.parse(atob(doc.textures.value)).textures || {};
            skin = textures.SKIN?.url || null;
            cape = textures.CAPE?.url || null;
        } catch (error) {
            // No readable textures.
        }
    }

    return { skin: secureUrl(skin), cape: secureUrl(cape) };
}

async function fetchMcApi(name, edition) {
    try {
        const response = await fetch(
            `${MC_API}/profile/${encodeURIComponent(name)}/${edition}`,
            { cache: "no-store" }
        );

        if (response.status === 404 || response.status === 400) return { status: "none" };
        if (!response.ok) return { status: "error" };

        return { status: "found", doc: await response.json() };
    } catch (error) {
        return { status: "error" };
    }
}

function timeAgo(ms) {
    const seconds = Math.max(0, Math.round((Date.now() - ms) / 1000));

    if (seconds < 60) return "just now";

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 48) return `${hours} h ago`;

    return `${Math.round(hours / 24)} days ago`;
}

async function fetchJavaProfile(name) {
    if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) return { status: "none" };

    const result = await fetchMcApi(name, "JAVA");

    if (result.status === "found" && result.doc.uuid && result.doc.name) {
        const doc = result.doc;

        return {
            status: "found",
            cachedAt: doc.cachedAt || null,
            textures: mcApiTextures(doc),
            apiNames: doc.names,
            player: {
                username: doc.name,
                id: doc.uuid,
                raw_id: doc.uuid.replace(/-/g, "")
            }
        };
    }

    if (result.status === "none") return result;

    // mc-api was unreachable or rate limited: use the backup.
    return fetchJavaFromPlayerDb(name);
}

async function fetchBedrockProfile(name) {
    const result = await fetchMcApi(name, "BEDROCK");

    if (result.status === "found" && result.doc.xuid) {
        const doc = result.doc;
        const textures = mcApiTextures(doc);

        return {
            status: "found",
            gamertag: doc.name || name,
            xuid: String(doc.xuid),
            skinUrl: textures.skin,
            capeUrl: textures.cape,
            cachedAt: doc.cachedAt || null
        };
    }

    return fetchBedrockFromGeyser(name);
}

// ---------- ViewMC (cape history names) ----------
// Its docs list a "capes" endpoint that returns cape names. It's an
// extra: if it's slow or down, the profile still loads without it.

const VIEWMC_API = "https://api.viewmc.com/user";

async function fetchViewMcList(path, uuid, key) {
    try {
        const options = { cache: "no-store" };

        if (AbortSignal.timeout) options.signal = AbortSignal.timeout(5000);

        const response = await fetch(`${VIEWMC_API}/${path}/${encodeURIComponent(uuid)}`, options);

        if (!response.ok) return [];

        const data = await response.json();

        return Array.isArray(data[key]) ? data[key] : [];
    } catch (error) {
        return [];
    }
}

async function fetchViewMcCapes(uuid) {
    const capes = await fetchViewMcList("minecon", uuid, "capes");
    return capes.filter(name => typeof name === "string");
}

// A skin entry might be a PNG in base64, a data URL, a plain URL or the
// "textures" JSON. This turns any of those into something an image can load.
function skinSource(texture) {
    if (typeof texture !== "string" || !texture) return null;

    if (/^https?:/.test(texture)) return secureUrl(texture);
    if (texture.startsWith("data:")) return texture;

    try {
        const decoded = atob(texture);

        if (decoded.startsWith("\x89PNG")) return `data:image/png;base64,${texture}`;

        const url = JSON.parse(decoded).textures?.SKIN?.url;
        return url ? secureUrl(url) : null;
    } catch (error) {
        return null;
    }
}

function formatDate(ms) {
    return new Date(ms).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric"
    });
}

// Name order: dated changes newest first, then undated ones, then the original name.
function nameRank(entry) {
    if (entry.timestamp === 0) return -2;
    if (typeof entry.timestamp !== "number") return -1;
    return entry.timestamp;
}

// Shows the first few rows and tucks the rest behind a "Show more" button.
function limitList(container, nodes, limit, noun) {
    nodes.forEach((node, index) => {
        if (index >= limit) node.classList.add("hidden");
        container.appendChild(node);
    });

    if (nodes.length <= limit) return null;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "hist-more";
    button.textContent = `Show ${nodes.length - limit} more ${noun}`;

    let open = false;

    button.addEventListener("click", () => {
        open = !open;
        nodes.slice(limit).forEach(node => node.classList.toggle("hidden", !open));
        button.textContent = open ? "Show less" : `Show ${nodes.length - limit} more ${noun}`;
    });

    return button;
}

function historyHeading(title, count) {
    const head = document.createElement("div");
    head.className = "hist-head";

    const text = document.createElement("span");
    text.className = "hist-title";
    text.textContent = title;

    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = count;

    head.append(text, pill);
    return head;
}

function buildHistoryPanel(java) {
    const panel = document.createElement("div");

    const names = [...(java.nameHistory || [])]
        .filter(entry => entry && typeof entry.username === "string")
        .sort((x, y) => nameRank(y) - nameRank(x));
    const skins = [...(java.skinHistory || [])]
        .filter(entry => entry && skinSource(entry.texture))
        .sort((x, y) => (y.timestamp || 0) - (x.timestamp || 0));

    if (!names.length && !skins.length) {
        const empty = document.createElement("p");
        empty.className = "player-message";
        empty.textContent = "No history found for this player yet. CapeMC starts recording the first time it sees them.";
        panel.appendChild(empty);
        return panel;
    }

    if (names.length) {
        panel.appendChild(historyHeading("Names", names.length));

        const timeline = document.createElement("div");
        timeline.className = "timeline";

        const items = names.map((entry, index) => {
            const item = document.createElement("div");
            item.className = "timeline-item";

            const dot = document.createElement("span");
            dot.className = index === 0 ? "timeline-dot current" : "timeline-dot";

            const main = document.createElement("div");
            main.className = "timeline-main";

            const name = document.createElement("strong");
            name.textContent = entry.username;
            main.appendChild(name);

            [[index === 0, "Current"], [entry.timestamp === 0, "Original"]].forEach(([show, label]) => {
                if (!show) return;

                const pill = document.createElement("span");
                pill.className = "pill";
                pill.textContent = label;
                main.appendChild(pill);
            });

            const date = document.createElement("span");
            date.className = "timeline-date";

            if (typeof entry.timestamp === "number" && entry.timestamp > 0) {
                date.textContent = `${entry.tracked ? "Seen " : entry.approx ? "About " : ""}${formatDate(entry.timestamp)}`;
            } else if (entry.timestamp !== 0) {
                date.textContent = "Date unknown";
            }

            item.append(dot, main, date);
            return item;
        });

        const more = limitList(timeline, items, 8, "names");
        panel.appendChild(timeline);
        if (more) panel.appendChild(more);
    }

    if (skins.length) {
        panel.appendChild(historyHeading("Skins", skins.length));

        const grid = document.createElement("div");
        grid.className = "skin-history";

        const cards = skins.map((entry, index) => {
            const card = document.createElement("div");
            card.className = "skin-card";

            const canvas = document.createElement("canvas");
            canvas.width = 8;
            canvas.height = 8;
            canvas.setAttribute("role", "img");
            canvas.setAttribute("aria-label", "Past skin");
            drawHead(canvas, skinSource(entry.texture));

            const date = document.createElement("p");
            date.textContent = entry.timestamp ? formatDate(entry.timestamp) : "Unknown date";

            card.append(canvas, date);

            if (index === 0) {
                const pill = document.createElement("span");
                pill.className = "pill";
                pill.textContent = "Latest";
                card.appendChild(pill);
            }

            return card;
        });

        const more = limitList(grid, cards, 12, "skins");
        panel.appendChild(grid);
        if (more) panel.appendChild(more);
    }

    const note = document.createElement("p");
    note.className = "player-note";
    note.textContent = "\"Seen\" dates are when CapeMC first saw a change. Older names come from ViewMC, mc-api.io and laby.net when they have them.";
    panel.appendChild(note);

    return panel;
}

// ---------- CapeMC database (Cloudflare Worker) ----------
// Fresh data straight from Mojang plus the history CapeMC has recorded.
// If the API isn't there (for example when testing on your phone's files)
// the profile still works without it.

function textureUrl(hash) {
    return hash ? `https://textures.minecraft.net/texture/${hash}` : null;
}

async function fetchTracked(name) {
    try {
        const options = { cache: "no-store" };

        if (AbortSignal.timeout) options.signal = AbortSignal.timeout(8000);

        const response = await fetch(`/api/player/${encodeURIComponent(name)}`, options);

        if (!response.ok) return null;

        const data = await response.json();
        return data && data.uuid ? data : null;
    } catch (error) {
        return null;
    }
}

// Reads a list of names from mc-api.io (only if it sends one we recognise).
function normalizeApiNames(raw) {
    if (!Array.isArray(raw)) return [];

    return raw.map(item => {
        if (typeof item === "string") return { username: item, timestamp: null };

        const name = item && (item.name || item.username);
        const time = item && (item.changedToAt ?? item.changed_at ?? item.timestamp);
        const stamp = typeof time === "number" ? time : (Date.parse(time) || null);

        return name ? { username: name, timestamp: stamp } : null;
    }).filter(Boolean);
}

// If a name shows up in several places, keep the entry that knows the date best.
function mergeNames(...lists) {
    const score = entry => {
        if (typeof entry.timestamp === "number" && entry.timestamp > 0) return entry.tracked ? 1 : 3;
        return entry.timestamp === 0 ? 2 : 0;
    };

    const byName = new Map();

    lists.flat().forEach(entry => {
        if (!entry || typeof entry.username !== "string" || !entry.username) return;

        const key = entry.username.toLowerCase();
        const existing = byName.get(key);

        if (!existing || score(entry) > score(existing)) byName.set(key, entry);
    });

    return [...byName.values()];
}

function applyTracked(java) {
    const tracked = java.tracked;

    // Older names from mc-api.io, if it sent any.
    const apiNames = normalizeApiNames(java.apiNames);

    if (!tracked) {
        java.nameHistory = mergeNames(java.nameHistory || [], apiNames);
        return;
    }

    // Straight from Mojang, so it beats any older saved copy.
    java.textures.cape = textureUrl(tracked.capeHash);
    if (tracked.skinHash) java.textures.skin = textureUrl(tracked.skinHash);

    // Older names from laby.net (looked up by the Worker).
    let originalSeen = false;
    const labyNames = (tracked.labyNames || []).map(entry => {
        const changed = typeof entry.changed_at === "number" ? entry.changed_at : null;
        let timestamp = changed;

        if (changed === null && !originalSeen) {
            timestamp = 0;
            originalSeen = true;
        }

        return { username: entry.name, timestamp, approx: entry.accurate === false };
    });

    const seenNames = (tracked.names || []).map(entry => ({
        username: entry.name,
        timestamp: entry.seen_at,
        tracked: true
    }));

    java.nameHistory = mergeNames(java.nameHistory || [], labyNames, apiNames, seenNames);

    java.skinHistory = [
        ...(java.skinHistory || []),
        ...(tracked.skins || []).map(entry => ({
            texture: textureUrl(entry.skin_hash),
            timestamp: entry.first_seen
        }))
    ];
}

async function lookupPlayer(raw) {
    // Floodgate servers prefix Bedrock names with "." — drop it.
    const username = String(raw || "").trim().replace(/^[.*]/, "").replace(/\s+/g, " ");

    if (!username) {
        playerResult.replaceChildren();
        return;
    }

    if (!/^[A-Za-z0-9_ ]{1,16}$/.test(username)) {
        showPlayerMessage("Names use letters, numbers, spaces and underscores, up to 16 characters.");
        return;
    }

    playerInput.value = username;
    document.title = `${username} — CapeMC`;
    showPlayerMessage("Looking up player…");

    const requestId = ++playerRequestId;

    const [java, bedrock] = await Promise.all([
        fetchJavaProfile(username),
        fetchBedrockProfile(username)
    ]);

    if (requestId !== playerRequestId) return;

    const javaFound = java.status === "found" ? java : null;
    const bedrockFound = bedrock.status === "found" ? bedrock : null;

    if (javaFound) {
        const uuid = javaFound.player.raw_id;

        [javaFound.capeNames, javaFound.nameHistory, javaFound.skinHistory, javaFound.tracked] = await Promise.all([
            fetchViewMcCapes(uuid),
            fetchViewMcList("names", uuid, "names"),
            fetchViewMcList("skins", uuid, "skins"),
            fetchTracked(javaFound.player.username)
        ]);

        applyTracked(javaFound);

        if (requestId !== playerRequestId) return;
    }

    if (javaFound || bedrockFound) {
        if (javaFound) rememberPlayer(javaFound.player.username);
        if (bedrockFound) rememberPlayer(bedrockFound.gamertag);

        renderProfile(javaFound, bedrockFound);
        return;
    }

    if (java.status === "error" && bedrock.status === "error") {
        showPlayerMessage("Couldn't reach the lookup services. Please try again in a moment.");
        return;
    }

    showPlayerMessage(`No Java or Bedrock player found for “${username}”.`);
}

if (playerForm) {
    playerForm.addEventListener("submit", event => {
        event.preventDefault();

        const username = playerInput.value.trim();

        if (username) go(`#player/${encodeURIComponent(username)}`);
    });
}

// ========================================
// TOOLS (ADDED) — gradient generator + skin editor
// ========================================

const byId = id => document.getElementById(id);

let editorViewer = null;

// ----- Gradient generator -----
const gradText = byId("gradText");
const gradColors = byId("gradColors");

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorAt(stops, t) {
    if (stops.length === 1) return stops[0];

    const position = t * (stops.length - 1);
    const index = Math.min(Math.floor(position), stops.length - 2);
    const fraction = position - index;
    const from = hexToRgb(stops[index]);
    const to = hexToRgb(stops[index + 1]);

    return "#" + from
        .map((value, k) => Math.round(value + (to[k] - value) * fraction).toString(16).padStart(2, "0"))
        .join("");
}

function renderGradient() {
    const text = gradText.value;
    const chars = [...text];
    const stops = [...gradColors.querySelectorAll("input")].map(input => input.value);
    const bold = byId("gradBold").checked;
    const italic = byId("gradItalic").checked;
    const format = byId("gradFormat").value;
    const style = (bold ? "&l" : "") + (italic ? "&o" : "");

    const preview = byId("gradPreview");
    preview.replaceChildren();

    chars.forEach((char, i) => {
        const span = document.createElement("span");
        span.textContent = char;
        span.style.color = colorAt(stops, i / Math.max(chars.length - 1, 1));
        if (bold) span.style.fontWeight = "700";
        if (italic) span.style.fontStyle = "italic";
        preview.appendChild(span);
    });

    let output;

    if (format === "mini") {
        output = `<gradient:${stops.join(":")}>${bold ? "<b>" : ""}${italic ? "<i>" : ""}${text}${italic ? "</i>" : ""}${bold ? "</b>" : ""}</gradient>`;
    } else {
        output = chars.map((char, i) => {
            if (char === " ") return char;

            const hex = colorAt(stops, i / Math.max(chars.length - 1, 1)).slice(1);
            const code = format === "x"
                ? "&x" + [...hex].map(c => "&" + c).join("")
                : "&#" + hex;

            return code + style + char;
        }).join("");
    }

    byId("gradOutput").value = output;
}

byId("gradAdd").addEventListener("click", () => {
    const inputs = gradColors.querySelectorAll("input");

    if (inputs.length >= 5) return;

    const input = document.createElement("input");
    input.type = "color";
    input.value = inputs[inputs.length - 1].value;
    input.setAttribute("aria-label", `Color ${inputs.length + 1}`);
    gradColors.appendChild(input);
    renderGradient();
});

byId("gradRemove").addEventListener("click", () => {
    const inputs = gradColors.querySelectorAll("input");

    if (inputs.length <= 2) return;

    inputs[inputs.length - 1].remove();
    renderGradient();
});

byId("gradCopy").addEventListener("click", async event => {
    const button = event.currentTarget;
    const copied = await copyWalletAddress(byId("gradOutput").value);
    button.textContent = copied ? "Copied!" : "Copy failed";
    setTimeout(() => { button.textContent = "Copy"; }, 1800);
});

[gradText, byId("gradFormat"), byId("gradBold"), byId("gradItalic")].forEach(el => {
    el.addEventListener("input", renderGradient);
});

gradColors.addEventListener("input", renderGradient);
renderGradient();

// ----- Skin editor -----
const skinCanvas = byId("skinCanvas");
const skinCtx = skinCanvas.getContext("2d", { willReadFrequently: true });
const skinColor = byId("skinColor");
const skinMsg = byId("skinMsg");
let skinTool = "pencil";
let painting = false;
let lastPoint = null;
let previewTimer = null;
const undoStack = [];

function startEditorViewer() {
    if (editorViewer || typeof skinview3d === "undefined") return;

    try {
        editorViewer = createViewer(byId("skinPreview"), 240, 320);
        editorViewer.autoRotate = true;
        editorViewer.loadSkin(skinCanvas);
    } catch (error) {
        skinMsg.textContent = "3D preview isn't available on this device.";
    }
}

function updatePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
        if (editorViewer) editorViewer.loadSkin(skinCanvas);
    }, 120);
}

function pushUndo() {
    undoStack.push(skinCtx.getImageData(0, 0, 64, 64));
    if (undoStack.length > 30) undoStack.shift();
}

function drawGuides() {
    const guides = byId("skinGuides");
    const ctx = guides.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);

    if (!byId("skinGuideToggle").checked) return;

    ctx.strokeStyle = "rgba(127, 90, 240, 0.9)";
    ctx.lineWidth = 1;

    // x, y, width, height of the front faces on a 64x64 skin
    [[8, 8, 8, 8], [20, 20, 8, 12], [44, 20, 4, 12],
     [36, 52, 4, 12], [4, 20, 4, 12], [20, 52, 4, 12]]
        .forEach(([x, y, w, h]) => ctx.strokeRect(x * 8 + 0.5, y * 8 + 0.5, w * 8, h * 8));
}

function pixelFromEvent(event) {
    const rect = skinCanvas.getBoundingClientRect();
    const clamp = value => Math.max(0, Math.min(63, value));

    return [
        clamp(Math.floor(((event.clientX - rect.left) / rect.width) * 64)),
        clamp(Math.floor(((event.clientY - rect.top) / rect.height) * 64))
    ];
}

function paintPixel(x, y) {
    if (skinTool === "eraser") {
        skinCtx.clearRect(x, y, 1, 1);
    } else {
        skinCtx.fillStyle = skinColor.value;
        skinCtx.fillRect(x, y, 1, 1);
    }
}

// Paints every pixel between two points so fast strokes have no gaps.
function paintLine(from, to) {
    let [x, y] = from;
    const dx = Math.abs(to[0] - x);
    const dy = Math.abs(to[1] - y);
    const sx = x < to[0] ? 1 : -1;
    const sy = y < to[1] ? 1 : -1;
    let error = dx - dy;

    for (;;) {
        paintPixel(x, y);

        if (x === to[0] && y === to[1]) break;

        const doubled = error * 2;

        if (doubled > -dy) { error -= dy; x += sx; }
        if (doubled < dx) { error += dx; y += sy; }
    }
}

skinCanvas.addEventListener("pointerdown", event => {
    event.preventDefault();
    const point = pixelFromEvent(event);

    if (skinTool === "picker") {
        const [r, g, b, a] = skinCtx.getImageData(point[0], point[1], 1, 1).data;

        if (a > 0) {
            skinColor.value = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
        }

        setSkinTool("pencil");
        return;
    }

    pushUndo();
    painting = true;
    lastPoint = point;
    skinCanvas.setPointerCapture(event.pointerId);
    paintPixel(point[0], point[1]);
});

skinCanvas.addEventListener("pointermove", event => {
    if (!painting) return;

    const point = pixelFromEvent(event);
    paintLine(lastPoint, point);
    lastPoint = point;
});

["pointerup", "pointercancel"].forEach(type => {
    skinCanvas.addEventListener(type, () => {
        if (!painting) return;

        painting = false;
        updatePreview();
    });
});

function setSkinTool(tool) {
    skinTool = tool;

    document.querySelectorAll("[data-skin-tool]").forEach(button => {
        button.setAttribute("aria-pressed", String(button.dataset.skinTool === tool));
    });
}

document.querySelectorAll("[data-skin-tool]").forEach(button => {
    button.addEventListener("click", () => setSkinTool(button.dataset.skinTool));
});

byId("skinUndo").addEventListener("click", () => {
    const previous = undoStack.pop();

    if (previous) {
        skinCtx.putImageData(previous, 0, 0);
        updatePreview();
    }
});

byId("skinClear").addEventListener("click", () => {
    pushUndo();
    skinCtx.clearRect(0, 0, 64, 64);
    updatePreview();
});

byId("skinGuideToggle").addEventListener("change", drawGuides);

function drawSkinImage(image) {
    if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) {
        skinMsg.textContent = "Please use a 64×64 (or 64×32) skin PNG.";
        return;
    }

    pushUndo();
    skinCtx.clearRect(0, 0, 64, 64);
    skinCtx.drawImage(image, 0, 0);
    skinMsg.textContent = "";
    updatePreview();
}

byId("skinFile").addEventListener("change", event => {
    const file = event.target.files[0];
    event.target.value = "";

    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.addEventListener("load", () => {
        drawSkinImage(image);
        URL.revokeObjectURL(url);
    });

    image.addEventListener("error", () => {
        skinMsg.textContent = "That file couldn't be read as an image.";
        URL.revokeObjectURL(url);
    });

    image.src = url;
});

byId("skinLoadUser").addEventListener("click", async () => {
    const name = byId("skinUser").value.trim();

    if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) {
        skinMsg.textContent = "Enter a valid Java username.";
        return;
    }

    skinMsg.textContent = "Loading skin…";
    const result = await fetchJavaProfile(name);

    if (result.status !== "found" || !result.textures.skin) {
        skinMsg.textContent = result.status === "error"
            ? "Couldn't reach the lookup service."
            : "No skin found for that name.";
        return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => drawSkinImage(image));
    image.addEventListener("error", () => {
        skinMsg.textContent = "That skin can't be loaded here. Download it and use Upload PNG instead.";
    });
    image.src = result.textures.skin;
});

byId("skinDownload").addEventListener("click", () => {
    skinCanvas.toBlob(blob => {
        if (!blob) return;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "skin.png";
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    });
});

drawGuides();

// ----- Chibi maker -----
// Draws a big-headed pixel version of a skin: the head is doubled in size
// and the body and legs are squashed. Everything happens in your browser.
const chibiCanvas = byId("chibiCanvas");
const chibiCtx = chibiCanvas.getContext("2d", { willReadFrequently: true });
const chibiMsg = byId("chibiMsg");
const CHIBI_W = 16;
const CHIBI_H = 26;
const CHIBI_PAD = 1;
const CHIBI_BODY_ROWS = [0, 2, 4, 6, 8, 11];
const CHIBI_LEG_ROWS = [0, 4, 8, 11];
let chibiSkin = null;

function chibiRows(ctx, skin, sx, sy, width, rows, dx, dy, mirror) {
    ctx.save();

    if (mirror) {
        ctx.translate(dx + width, 0);
        ctx.scale(-1, 1);
    }

    rows.forEach((row, index) => {
        ctx.drawImage(skin, sx, sy + row, width, 1, mirror ? 0 : dx, dy + index, width, 1);
    });

    ctx.restore();
}

function renderChibi() {
    if (!chibiSkin) return;

    const arm = byId("chibiSlim").checked ? 3 : 4;
    const legacy = chibiSkin.height === 32;

    const sprite = document.createElement("canvas");
    sprite.width = CHIBI_W;
    sprite.height = CHIBI_H;

    const s = sprite.getContext("2d", { willReadFrequently: true });
    s.imageSmoothingEnabled = false;

    // Head (face + hat layer), drawn twice as big.
    s.drawImage(chibiSkin, 8, 8, 8, 8, 0, 0, 16, 16);
    s.drawImage(chibiSkin, 40, 8, 8, 8, 0, 0, 16, 16);

    // Body
    chibiRows(s, chibiSkin, 20, 20, 8, CHIBI_BODY_ROWS, 4, 16, false);
    if (!legacy) chibiRows(s, chibiSkin, 20, 36, 8, CHIBI_BODY_ROWS, 4, 16, false);

    // Arms (the character's right arm is on the left of the picture)
    chibiRows(s, chibiSkin, 44, 20, arm, CHIBI_BODY_ROWS, 4 - arm, 16, false);
    if (!legacy) chibiRows(s, chibiSkin, 44, 36, arm, CHIBI_BODY_ROWS, 4 - arm, 16, false);

    if (legacy) {
        chibiRows(s, chibiSkin, 44, 20, arm, CHIBI_BODY_ROWS, 12, 16, true);
    } else {
        chibiRows(s, chibiSkin, 36, 52, arm, CHIBI_BODY_ROWS, 12, 16, false);
        chibiRows(s, chibiSkin, 52, 52, arm, CHIBI_BODY_ROWS, 12, 16, false);
    }

    // Legs
    chibiRows(s, chibiSkin, 4, 20, 4, CHIBI_LEG_ROWS, 4, 22, false);
    if (!legacy) chibiRows(s, chibiSkin, 4, 36, 4, CHIBI_LEG_ROWS, 4, 22, false);

    if (legacy) {
        chibiRows(s, chibiSkin, 4, 20, 4, CHIBI_LEG_ROWS, 8, 22, true);
    } else {
        chibiRows(s, chibiSkin, 20, 52, 4, CHIBI_LEG_ROWS, 8, 22, false);
        chibiRows(s, chibiSkin, 4, 52, 4, CHIBI_LEG_ROWS, 8, 22, false);
    }

    // Final picture: background, outline, then the character.
    const width = CHIBI_W + CHIBI_PAD * 2;
    const height = CHIBI_H + CHIBI_PAD * 2;
    chibiCanvas.width = width;
    chibiCanvas.height = height;
    chibiCtx.imageSmoothingEnabled = false;
    chibiCtx.clearRect(0, 0, width, height);

    const background = byId("chibiBg").value;

    if (background) {
        chibiCtx.fillStyle = background;
        chibiCtx.fillRect(0, 0, width, height);
    }

    if (byId("chibiOutline").checked) {
        try {
            const pixels = s.getImageData(0, 0, CHIBI_W, CHIBI_H).data;
            const solid = (x, y) => x >= 0 && y >= 0 && x < CHIBI_W && y < CHIBI_H && pixels[(y * CHIBI_W + x) * 4 + 3] > 0;

            chibiCtx.fillStyle = "#1b1b1f";

            for (let y = -1; y <= CHIBI_H; y++) {
                for (let x = -1; x <= CHIBI_W; x++) {
                    if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) {
                        chibiCtx.fillRect(x + CHIBI_PAD, y + CHIBI_PAD, 1, 1);
                    }
                }
            }
        } catch (error) {
            chibiMsg.textContent = "The outline needs a skin you upload yourself.";
        }
    }

    chibiCtx.drawImage(sprite, CHIBI_PAD, CHIBI_PAD);
}

function loadChibiSkin(image) {
    if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) {
        chibiMsg.textContent = "Please use a 64×64 (or 64×32) skin PNG.";
        return;
    }

    chibiSkin = image;
    chibiMsg.textContent = "";
    renderChibi();
}

byId("chibiFile").addEventListener("change", event => {
    const file = event.target.files[0];
    event.target.value = "";

    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.addEventListener("load", () => {
        loadChibiSkin(image);
        URL.revokeObjectURL(url);
    });

    image.addEventListener("error", () => {
        chibiMsg.textContent = "That file couldn't be read as an image.";
        URL.revokeObjectURL(url);
    });

    image.src = url;
});

byId("chibiLoad").addEventListener("click", async () => {
    const name = byId("chibiUser").value.trim();

    if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) {
        chibiMsg.textContent = "Enter a valid Java username.";
        return;
    }

    chibiMsg.textContent = "Loading skin…";
    const result = await fetchJavaProfile(name);

    if (result.status !== "found" || !result.textures.skin) {
        chibiMsg.textContent = result.status === "error"
            ? "Couldn't reach the lookup service."
            : "No skin found for that name.";
        return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => loadChibiSkin(image));
    image.addEventListener("error", () => {
        chibiMsg.textContent = "That skin can't be loaded here. Download it and use Upload instead.";
    });
    image.src = result.textures.skin;
});

["chibiSlim", "chibiOutline", "chibiBg"].forEach(id => byId(id).addEventListener("change", renderChibi));

byId("chibiDownload").addEventListener("click", () => {
    if (!chibiSkin) {
        chibiMsg.textContent = "Load a skin first.";
        return;
    }

    const scale = Number(byId("chibiScale").value) || 16;
    const out = document.createElement("canvas");
    out.width = chibiCanvas.width * scale;
    out.height = chibiCanvas.height * scale;

    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(chibiCanvas, 0, 0, out.width, out.height);

    out.toBlob(blob => {
        if (!blob) return;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "chibi.png";
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    });
});

// ----- Banner designer -----
// Patterns are drawn on Minecraft's 20x40 banner grid. The shapes are
// simplified; the pattern names in the command are the real ones.
const BANNER_COLORS = [
    ["white", "#f9fffe"], ["orange", "#f9801d"], ["magenta", "#c74ebd"], ["light_blue", "#3ab3da"],
    ["yellow", "#fed83d"], ["lime", "#80c71f"], ["pink", "#f38baa"], ["gray", "#474f52"],
    ["light_gray", "#9d9d97"], ["cyan", "#169c9c"], ["purple", "#8932b8"], ["blue", "#3c44aa"],
    ["brown", "#835432"], ["green", "#5e7c16"], ["red", "#b02e26"], ["black", "#1d1d21"]
];
const BANNER_W = 20;
const BANNER_H = 40;
const bannerZig = x => Math.abs((x % 6) - 3);
const bannerFade = value => Math.max(0, Math.min(1, value));
const chevronTop = x => 13 + Math.abs(x - 9.5) * 1.8;
const invChevronBottom = x => 27 - Math.abs(x - 9.5) * 1.8;

const BANNER_PATTERNS = {
    stripe_bottom: ["Base", (x, y) => y >= 33],
    stripe_top: ["Chief", (x, y) => y <= 6],
    stripe_left: ["Pale Dexter", x => x <= 6],
    stripe_right: ["Pale Sinister", x => x >= 13],
    stripe_center: ["Pale", x => x >= 7 && x <= 12],
    stripe_middle: ["Fess", (x, y) => y >= 17 && y <= 22],
    stripe_downright: ["Bend", (x, y) => Math.abs(y - 2 * x - 1) <= 6],
    stripe_downleft: ["Bend Sinister", (x, y) => Math.abs(y - 2 * (19 - x) - 1) <= 6],
    small_stripes: ["Paly", x => x % 4 < 2],
    cross: ["Saltire", (x, y) => Math.abs(y - 2 * x - 1) <= 4 || Math.abs(y - 2 * (19 - x) - 1) <= 4],
    straight_cross: ["Cross", (x, y) => (x >= 7 && x <= 12) || (y >= 17 && y <= 22)],
    half_vertical: ["Per Pale", x => x < 10],
    half_vertical_right: ["Per Pale Inverted", x => x >= 10],
    half_horizontal: ["Per Fess", (x, y) => y < 20],
    half_horizontal_bottom: ["Per Fess Inverted", (x, y) => y >= 20],
    square_top_left: ["Canton Dexter", (x, y) => x < 8 && y < 8],
    square_top_right: ["Canton Sinister", (x, y) => x >= 12 && y < 8],
    square_bottom_left: ["Base Dexter Canton", (x, y) => x < 8 && y >= 32],
    square_bottom_right: ["Base Sinister Canton", (x, y) => x >= 12 && y >= 32],
    triangle_bottom: ["Chevron", (x, y) => y >= chevronTop(x) && y <= chevronTop(x) + 10],
    triangle_top: ["Inverted Chevron", (x, y) => y <= invChevronBottom(x) && y >= invChevronBottom(x) - 10],
    triangles_bottom: ["Base Indented", (x, y) => y >= 31 + bannerZig(x)],
    triangles_top: ["Chief Indented", (x, y) => y <= 8 - bannerZig(x)],
    circle: ["Roundel", (x, y) => (x - 9.5) ** 2 + (y - 19.5) ** 2 <= 42],
    rhombus: ["Lozenge", (x, y) => Math.abs(x - 9.5) / 9.5 + Math.abs(y - 19.5) / 19.5 <= 0.85],
    border: ["Bordure", (x, y) => x <= 1 || x >= 18 || y <= 1 || y >= 38],
    gradient: ["Gradient", (x, y) => bannerFade(1 - y / 26)],
    gradient_up: ["Base Gradient", (x, y) => bannerFade(1 - (39 - y) / 26)],
    bricks: ["Field Masoned", (x, y) => y % 5 === 0 || (x + (Math.floor(y / 5) % 2) * 5) % 10 === 0]
};

const banner = { base: "white", color: "red", layers: [] };
const bannerCanvas = byId("bannerCanvas");
const bannerCtx = bannerCanvas.getContext("2d");
const bannerHex = name => BANNER_COLORS.find(([id]) => id === name)[1];

function buildSwatches(container, getSelected, onPick) {
    container.replaceChildren();

    BANNER_COLORS.forEach(([name, hex]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "swatch";
        button.style.background = hex;
        button.setAttribute("aria-label", name.replace("_", " "));
        button.setAttribute("aria-pressed", String(getSelected() === name));
        button.addEventListener("click", () => {
            onPick(name);
            container.querySelectorAll(".swatch").forEach((item, index) => {
                item.setAttribute("aria-pressed", String(BANNER_COLORS[index][0] === name));
            });
        });
        container.appendChild(button);
    });
}

function renderBanner() {
    const image = bannerCtx.createImageData(BANNER_W, BANNER_H);
    const data = image.data;
    const base = hexToRgb(bannerHex(banner.base));

    for (let i = 0; i < data.length; i += 4) {
        data[i] = base[0];
        data[i + 1] = base[1];
        data[i + 2] = base[2];
        data[i + 3] = 255;
    }

    banner.layers.forEach(layer => {
        const mask = BANNER_PATTERNS[layer.pattern][1];
        const rgb = hexToRgb(bannerHex(layer.color));

        for (let y = 0; y < BANNER_H; y++) {
            for (let x = 0; x < BANNER_W; x++) {
                let alpha = mask(x, y);
                if (alpha === true) alpha = 1;
                if (!alpha) continue;

                const i = (y * BANNER_W + x) * 4;
                data[i] = data[i] * (1 - alpha) + rgb[0] * alpha;
                data[i + 1] = data[i + 1] * (1 - alpha) + rgb[1] * alpha;
                data[i + 2] = data[i + 2] * (1 - alpha) + rgb[2] * alpha;
            }
        }
    });

    bannerCtx.putImageData(image, 0, 0);

    // Layer list
    const list = byId("bannerLayers");
    list.replaceChildren();

    if (!banner.layers.length) {
        const empty = document.createElement("p");
        empty.className = "player-message";
        empty.textContent = "No layers yet.";
        list.appendChild(empty);
    }

    banner.layers.forEach((layer, index) => {
        const row = document.createElement("div");
        row.className = "layer-row";

        const dot = document.createElement("span");
        dot.className = "layer-dot";
        dot.style.background = bannerHex(layer.color);

        const name = document.createElement("span");
        name.className = "layer-name";
        name.textContent = `${BANNER_PATTERNS[layer.pattern][0]} · ${layer.color.replace("_", " ")}`;

        row.append(dot, name);

        [["↑", -1], ["↓", 1], ["✕", 0]].forEach(([label, move]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "profile-copy";
            button.textContent = label;
            button.setAttribute("aria-label", move === 0 ? "Remove layer" : move < 0 ? "Move layer up" : "Move layer down");
            button.addEventListener("click", () => {
                if (move === 0) {
                    banner.layers.splice(index, 1);
                } else if (index + move >= 0 && index + move < banner.layers.length) {
                    [banner.layers[index], banner.layers[index + move]] = [banner.layers[index + move], banner.layers[index]];
                }
                renderBanner();
            });
            row.appendChild(button);
        });

        list.appendChild(row);
    });

    // Give command (1.20.5+ item component format)
    const patterns = banner.layers.map(layer => `{pattern:"minecraft:${layer.pattern}",color:"${layer.color}"}`).join(",");
    byId("bannerCmd").value = banner.layers.length
        ? `/give @p minecraft:${banner.base}_banner[banner_patterns=[${patterns}]]`
        : `/give @p minecraft:${banner.base}_banner`;
}

buildSwatches(byId("bannerBase"), () => banner.base, name => { banner.base = name; renderBanner(); });
buildSwatches(byId("bannerColors"), () => banner.color, name => { banner.color = name; });

Object.entries(BANNER_PATTERNS).forEach(([id, [label]]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    byId("bannerPattern").appendChild(option);
});

byId("bannerAdd").addEventListener("click", () => {
    banner.layers.push({ pattern: byId("bannerPattern").value, color: banner.color });
    renderBanner();
});

byId("bannerClear").addEventListener("click", () => {
    banner.layers = [];
    renderBanner();
});

byId("bannerCopy").addEventListener("click", async event => {
    const button = event.currentTarget;
    const copied = await copyWalletAddress(byId("bannerCmd").value);
    button.textContent = copied ? "Copied!" : "Copy failed";
    setTimeout(() => { button.textContent = "Copy command"; }, 1800);
});

byId("bannerDownload").addEventListener("click", () => {
    const scale = 16;
    const out = document.createElement("canvas");
    out.width = BANNER_W * scale;
    out.height = BANNER_H * scale;

    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bannerCanvas, 0, 0, out.width, out.height);

    out.toBlob(blob => {
        if (!blob) return;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "banner.png";
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    });
});

renderBanner();

// ----- Skin art maker -----
// NameMC shows a player's skin history as a grid of small faces, 9 per row,
// newest first. This splits a 72x24 picture (9 x 3 squares of 8x8) into 26
// skins whose face is one square each. The top-left square is the newest
// skin, so it's left for your main skin.
const ART_W = 72;
const ART_H = 24;
const ART_COLS = 9;
const ART_COUNT = 26;
const artCanvas = byId("artCanvas");
const artCtx = artCanvas.getContext("2d");
const artMsg = byId("artMsg");
const artBuffer = document.createElement("canvas");
artBuffer.width = ART_W;
artBuffer.height = ART_H;
const artBufferCtx = artBuffer.getContext("2d", { willReadFrequently: true });
let artSource = null;
let artBase = null;

function drawArt() {
    const bg = byId("artBg").value;
    artBufferCtx.fillStyle = bg;
    artBufferCtx.fillRect(0, 0, ART_W, ART_H);

    if (artSource) {
        const w = artSource.width;
        const h = artSource.height;
        const mode = byId("artFit").value;
        let dw = ART_W;
        let dh = ART_H;

        if (mode !== "stretch") {
            const scale = mode === "contain" ? Math.min(ART_W / w, ART_H / h) : Math.max(ART_W / w, ART_H / h);
            dw = w * scale;
            dh = h * scale;
        }

        // Already 72x24? Keep it razor sharp instead of smoothing it.
        artBufferCtx.imageSmoothingEnabled = !(w === ART_W && h === ART_H);
        artBufferCtx.drawImage(artSource, (ART_W - dw) / 2, (ART_H - dh) / 2, dw, dh);
    }

    // Preview = the picture plus a hatch over the unused first square.
    artCtx.imageSmoothingEnabled = false;
    artCtx.clearRect(0, 0, ART_W, ART_H);
    artCtx.drawImage(artBuffer, 0, 0);
    artCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
    artCtx.fillRect(0, 0, 8, 8);
    artCtx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    artCtx.lineWidth = 1;
    artCtx.beginPath();
    artCtx.moveTo(0, 0);
    artCtx.lineTo(8, 8);
    artCtx.moveTo(8, 0);
    artCtx.lineTo(0, 8);
    artCtx.stroke();
}

function readArtImage(file, onLoad, onFail) {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.addEventListener("load", () => {
        onLoad(image);
        URL.revokeObjectURL(url);
    });

    image.addEventListener("error", () => {
        onFail();
        URL.revokeObjectURL(url);
    });

    image.src = url;
}

byId("artFile").addEventListener("change", event => {
    const file = event.target.files[0];
    event.target.value = "";

    if (!file) return;

    readArtImage(file, image => {
        artSource = image;
        artMsg.textContent = "";
        drawArt();
    }, () => {
        artMsg.textContent = "That file couldn't be read as an image.";
    });
});

byId("artBase").addEventListener("change", event => {
    const file = event.target.files[0];
    event.target.value = "";

    if (!file) return;

    readArtImage(file, image => {
        if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) {
            artMsg.textContent = "A base skin must be a 64×64 (or 64×32) PNG.";
            return;
        }

        artBase = image;
        artMsg.textContent = "Base skin added.";
    }, () => {
        artMsg.textContent = "That file couldn't be read as an image.";
    });
});

byId("artBaseClear").addEventListener("click", () => {
    artBase = null;
    artMsg.textContent = "Base skin removed.";
});

["artFit", "artBg"].forEach(id => byId(id).addEventListener("input", drawArt));

// Skin number k (1 to 26) shows square k of the picture on its face.
function buildArtSkin(k) {
    const skin = document.createElement("canvas");
    skin.width = 64;
    skin.height = 64;

    const ctx = skin.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    if (artBase) {
        ctx.drawImage(artBase, 0, 0);
    } else {
        ctx.fillStyle = byId("artBody").value;
        ctx.fillRect(0, 0, 64, 64);
    }

    ctx.clearRect(32, 0, 32, 16); // hat layer off, so it can't cover the face

    const column = k % ART_COLS;
    const row = Math.floor(k / ART_COLS);
    ctx.drawImage(artBuffer, column * 8, row * 8, 8, 8, 8, 8, 8, 8);

    return skin;
}

// A small zip writer (no compression), so 26 files download as one.
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);

    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }

    return table;
})();

function crc32(bytes) {
    let crc = 0xffffffff;

    for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);

    return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(files) {
    const encoder = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;

    files.forEach(file => {
        const name = encoder.encode(file.name);
        const crc = crc32(file.data);

        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(10, 0, true);
        local.setUint16(12, 33, true); // date: 1980-01-01
        local.setUint32(14, crc, true);
        local.setUint32(18, file.data.length, true);
        local.setUint32(22, file.data.length, true);
        local.setUint16(26, name.length, true);

        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(14, 33, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, file.data.length, true);
        entry.setUint32(24, file.data.length, true);
        entry.setUint16(28, name.length, true);
        entry.setUint32(42, offset, true);

        parts.push(local, name, file.data);
        central.push(entry, name);
        offset += 30 + name.length + file.data.length;
    });

    const centralSize = central.reduce((total, part) => total + part.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);

    return new Blob([...parts, ...central, end], { type: "application/zip" });
}

byId("artDownload").addEventListener("click", async () => {
    if (!artSource) {
        artMsg.textContent = "Choose an image first.";
        return;
    }

    artMsg.textContent = "Building skins…";

    const files = [];

    for (let k = 1; k <= ART_COUNT; k++) {
        const blob = await new Promise(resolve => buildArtSkin(k).toBlob(resolve));

        if (!blob) {
            artMsg.textContent = "Couldn't build the skins in this browser.";
            return;
        }

        files.push({
            name: `skin-${String(k).padStart(2, "0")}.png`,
            data: new Uint8Array(await blob.arrayBuffer())
        });
    }

    files.push({
        name: "README.txt",
        data: new TextEncoder().encode(
            "Apply skin-26 first, then 25, 24 ... down to skin-01, then your normal skin.\n" +
            "After each one, open your NameMC profile and wait until it shows in your history.\n"
        )
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(makeZip(files));
    link.download = "skin-art.zip";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    artMsg.textContent = "Done. Apply skin-26 first and finish with skin-01.";
});

drawArt();

// ========================================
// PLAYER SUGGESTIONS (ADDED)
// Shows exact matches (Java / Bedrock) plus names looked up before on
// this device. A list of similar names would need a player database.
// ========================================

const RECENT_KEY = "capemc-recent";

function getRecent() {
    try {
        const list = JSON.parse(localStorage.getItem(RECENT_KEY));
        return Array.isArray(list) ? list.filter(name => typeof name === "string") : [];
    } catch (error) {
        return [];
    }
}

function rememberPlayer(name) {
    if (!name) return;

    try {
        const list = getRecent().filter(item => item.toLowerCase() !== name.toLowerCase());
        list.unshift(name);
        localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20)));
    } catch (error) {
        // Storage blocked: suggestions just won't remember names.
    }
}

function pickPlayer(name) {
    clearSearch();
    go(`#player/${encodeURIComponent(name)}`);
}

function attachSuggest(input) {
    if (!input) return;

    const host = document.createElement("div");
    host.className = "suggest-wrap";
    input.replaceWith(host);
    host.appendChild(input);

    const list = document.createElement("div");
    list.className = "suggest-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    host.appendChild(list);

    let token = 0;
    let timer = null;

    function draw(items) {
        list.replaceChildren(...items.map(item => {
            const row = document.createElement("button");
            row.type = "button";
            row.className = "suggest-row";
            row.setAttribute("role", "option");

            const head = document.createElement("canvas");
            head.className = "suggest-head";
            head.width = 8;
            head.height = 8;
            if (item.skin) drawHead(head, item.skin);

            const name = document.createElement("span");
            name.className = "suggest-name";
            name.textContent = item.name;

            const tag = document.createElement("span");
            tag.className = "suggest-tag";
            tag.textContent = item.label;

            row.append(head, name, tag);
            row.addEventListener("click", () => {
                list.hidden = true;
                pickPlayer(item.name);
            });

            return row;
        }));

        list.hidden = items.length === 0;
    }

    input.addEventListener("input", () => {
        clearTimeout(timer);

        const query = input.value.trim().replace(/^[.*]/, "");
        const current = ++token;

        if (query.length < 2) {
            list.hidden = true;
            return;
        }

        const recent = getRecent()
            .filter(name => name.toLowerCase().startsWith(query.toLowerCase()))
            .slice(0, 4)
            .map(name => ({ name, label: "Recent", skin: null }));

        draw(recent);

        if (!/^[A-Za-z0-9_ ]{3,16}$/.test(query)) return;

        timer = setTimeout(async () => {
            const [java, bedrock] = await Promise.all([
                fetchMcApi(query, "JAVA"),
                fetchMcApi(query, "BEDROCK")
            ]);

            if (current !== token) return;

            const exact = [];

            if (java.status === "found" && java.doc.name) {
                exact.push({ name: java.doc.name, label: "Java", skin: mcApiTextures(java.doc).skin });
            }

            if (bedrock.status === "found" && bedrock.doc.xuid) {
                exact.push({ name: bedrock.doc.name || query, label: "Bedrock", skin: mcApiTextures(bedrock.doc).skin });
            }

            const seen = new Set(exact.map(item => item.name.toLowerCase()));
            draw([...exact, ...recent.filter(item => !seen.has(item.name.toLowerCase()))]);
        }, 400);
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Escape") list.hidden = true;
    });

    document.addEventListener("click", event => {
        if (!host.contains(event.target)) list.hidden = true;
    });
}

[playerInput, homeSearch?.input, capesSearch?.input].forEach(attachSuggest);

// ========================================
// FOOTER (ADDED)
// ========================================

const footerDonate = document.getElementById("footerDonate");

if (footerDonate) {
    footerDonate.addEventListener("click", openDonations);
}

// ========================================
// THEME (ADDED) — light / dark
// ========================================

const THEME_KEY = "capemc-theme";
const themeButton = document.getElementById("cmThemeButton");

function applyTheme(theme, save) {
    document.documentElement.dataset.theme = theme;

    if (themeButton) {
        themeButton.textContent = theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
        themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#141414" : "#ffffff");

    if (save) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            // Storage blocked: the theme just won't be remembered.
        }
    }
}

if (themeButton) {
    themeButton.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(next, true);
    });
}

applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);

// ========================================
// SKINS GALLERY (ADDED)
// Most worn / latest skins on the Players page and random skins on Home.
// The numbers come from your database through the Worker.
// ========================================

// A flat front view of a skin (head, body, arms, legs and their outer layers).
function drawSkinFront(canvas, url) {
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    loadImage(url, skin => {
        const legacy = skin.height === 32;

        const part = (sx, sy, w, h, dx, dy, mirror) => {
            ctx.save();

            if (mirror) {
                ctx.translate(dx + w, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(skin, sx, sy, w, h, 0, dy, w, h);
            } else {
                ctx.drawImage(skin, sx, sy, w, h, dx, dy, w, h);
            }

            ctx.restore();
        };

        // Legs
        part(4, 20, 4, 12, 4, 20, false);
        if (!legacy) part(4, 36, 4, 12, 4, 20, false);

        if (legacy) {
            part(4, 20, 4, 12, 8, 20, true);
        } else {
            part(20, 52, 4, 12, 8, 20, false);
            part(4, 52, 4, 12, 8, 20, false);
        }

        // Body
        part(20, 20, 8, 12, 4, 8, false);
        if (!legacy) part(20, 36, 8, 12, 4, 8, false);

        // Arms
        part(44, 20, 4, 12, 0, 8, false);
        if (!legacy) part(44, 36, 4, 12, 0, 8, false);

        if (legacy) {
            part(44, 20, 4, 12, 12, 8, true);
        } else {
            part(36, 52, 4, 12, 12, 8, false);
            part(52, 52, 4, 12, 12, 8, false);
        }

        // Head and hat layer
        part(8, 8, 8, 8, 4, 0, false);
        part(40, 8, 8, 8, 4, 0, false);
    });
}

function buildSkinTile(entry, showDate) {
    const tile = document.createElement("a");
    tile.className = "skin-tile";
    tile.href = `#skin/${entry.skin_hash}`;
    tile.setAttribute("aria-label", `Skin worn by ${entry.players} player${entry.players === 1 ? "" : "s"}. Opens the skin page.`);

    const figure = document.createElement("canvas");
    figure.className = "skin-figure";
    figure.width = 16;
    figure.height = 32;
    drawSkinFront(figure, textureUrl(entry.skin_hash));

    const count = document.createElement("strong");
    count.textContent = `${Number(entry.players).toLocaleString()} player${entry.players === 1 ? "" : "s"}`;

    tile.append(figure, count);

    if (showDate && entry.first_seen) {
        const date = document.createElement("small");
        date.textContent = `New ${formatDate(entry.first_seen)}`;
        tile.appendChild(date);
    }

    return tile;
}

let skinLists = null;
let skinListsTime = 0;
let skinTab = "popular";
const skinsBox = document.getElementById("playerSkins");
const skinGrid = document.getElementById("skinGrid");
const skinsNote = document.getElementById("skinsNote");

function updateSkinsVisibility() {
    // Hidden while a player is shown, or if the database isn't connected.
    if (skinsBox) skinsBox.hidden = playerResult.childElementCount > 0 || !skinLists;
}

function renderPlayerSkins() {
    if (!skinsBox || !skinLists) return;

    const list = skinTab === "latest" ? skinLists.latest : skinLists.popular;

    if (!list || !list.length) {
        skinsNote.textContent = "No skins tracked yet. Search for a player and their skins will start appearing here.";
        skinGrid.replaceChildren();
    } else {
        skinsNote.textContent = skinTab === "latest"
            ? "Skins CapeMC saw for the first time most recently."
            : "Skins worn by the most tracked players. The number is how many have worn it.";
        skinGrid.replaceChildren(...list.map(entry => buildSkinTile(entry, skinTab === "latest")));
    }

    updateSkinsVisibility();
}

async function refreshPlayerSkins() {
    if (!skinLists || Date.now() - skinListsTime > 120000) {
        const data = await fetchJson("/api/skins");

        if (data && Array.isArray(data.popular)) {
            skinLists = data;
            skinListsTime = Date.now();
        }
    }

    renderPlayerSkins();
}

document.querySelectorAll("#skinTabs .profile-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        skinTab = tab.dataset.skins;

        document.querySelectorAll("#skinTabs .profile-tab").forEach(other => {
            other.classList.toggle("active", other === tab);
            other.setAttribute("aria-selected", String(other === tab));
        });

        renderPlayerSkins();
    });
});

new MutationObserver(updateSkinsVisibility).observe(playerResult, { childList: true });

// ---------- Skin page ----------
// #skin/<hash>: a 3D view of one skin and the players CapeMC has seen wearing it.
let skinPageToken = 0;

async function openSkin(hash) {
    const body = document.getElementById("skinDetailBody");
    const sub = document.getElementById("skinDetailSub");
    const token = ++skinPageToken;

    disposeViewer();
    sub.textContent = "";

    const loading = document.createElement("p");
    loading.className = "player-message";
    loading.textContent = "Loading skin…";
    body.replaceChildren(loading);

    const data = await fetchJson(`/api/skins/${hash}`);

    if (token !== skinPageToken) return;

    document.title = "Skin — CapeMC";
    const url = textureUrl(hash);
    const parts = [];

    // 3D view (drag to rotate). If the browser can't load it, the flat view below still works.
    parts.push(buildViewerFrame({ skinSources: [url], capeUrl: null, fallbackSrc: null, label: "This skin" }));

    // Summary card
    const card = document.createElement("div");
    card.className = "player-card";

    const figure = document.createElement("canvas");
    figure.className = "skin-figure skin-figure-lg";
    figure.width = 16;
    figure.height = 32;
    figure.setAttribute("role", "img");
    figure.setAttribute("aria-label", "Front view of the skin");
    drawSkinFront(figure, url);

    const info = document.createElement("div");
    info.className = "player-info";

    const headline = document.createElement("h2");
    const players = data ? Number(data.players) || 0 : 0;
    headline.textContent = data
        ? `${players.toLocaleString()} player${players === 1 ? "" : "s"}`
        : "Details unavailable";
    info.appendChild(headline);

    const line = document.createElement("p");

    if (!data) {
        line.textContent = "The database isn't connected, so who wears this skin can't be shown.";
    } else if (!players) {
        line.textContent = "CapeMC hasn't tracked this skin yet.";
    } else {
        line.textContent = `have worn this skin. First seen ${formatDate(data.first_seen)}, last seen ${formatDate(data.last_seen)}.`;
    }

    info.appendChild(line);

    const link = document.createElement("a");
    link.className = "profile-link";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open the skin image ↗";
    info.appendChild(link);

    card.append(figure, info);
    parts.push(card);

    // Who wears it
    const wearers = Array.isArray(data?.wearers) ? data.wearers : [];

    if (wearers.length) {
        parts.push(historyHeading("Players", players));

        const list = document.createElement("div");

        wearers.forEach(entry => {
            const row = document.createElement("div");
            row.className = "history-row";

            const name = document.createElement("a");
            name.className = "wearer-link";
            name.href = `#player/${encodeURIComponent(entry.name)}`;
            name.textContent = entry.name;

            const date = document.createElement("span");
            date.textContent = `Last seen ${formatDate(entry.last_seen)}`;

            row.append(name, date);
            list.appendChild(row);
        });

        parts.push(list);

        if (players > wearers.length) {
            const more = document.createElement("p");
            more.className = "player-note";
            more.textContent = `Showing the ${wearers.length} most recent of ${players.toLocaleString()} players.`;
            parts.push(more);
        }
    }

    body.replaceChildren(...parts);
}

// Home: random skins with a shuffle button.
async function loadRandomSkins() {
    const wrap = document.getElementById("homeSkinsWrap");
    const grid = document.getElementById("homeSkins");

    if (!wrap) return;

    const data = await fetchJson("/api/skins/random");
    const list = Array.isArray(data?.skins) ? data.skins : [];

    grid.replaceChildren(...list.map(entry => buildSkinTile(entry, false)));
    wrap.hidden = list.length === 0;
}

document.getElementById("shuffleSkins")?.addEventListener("click", loadRandomSkins);

// ========================================
// SERVERS + REALMS (ADDED)
// servers.json and realms.json are edited in the admin page. Player counts
// come live from the public mcstatus.io API.
// ========================================

let servers = [];
let realms = [];
let serverStatus = {};
let serverStatusTime = 0;
let serverRefresh = null;

async function loadServersAndRealms() {
    const [serverData, realmData] = await Promise.all([fetchJson("servers.json"), fetchJson("realms.json")]);

    servers = (serverData?.servers || []).filter(server =>
        server && server.name && /^[A-Za-z0-9.-]+(:\d{1,5})?$/.test(server.address || "")
    );

    realms = (realmData?.realms || []).filter(realm =>
        realm && realm.name && /^[A-Za-z0-9_-]{4,24}$/.test(realm.code || "")
    );

    renderRealms();
    renderServers();
    renderHomeServers();
}

async function fetchServerStatus(server) {
    try {
        const options = { cache: "no-store" };

        if (AbortSignal.timeout) options.signal = AbortSignal.timeout(7000);

        const response = await fetch(`https://api.mcstatus.io/v2/status/java/${server.address}`, options);

        if (!response.ok) return null;

        const data = await response.json();
        return data && typeof data === "object" ? data : null;
    } catch (error) {
        return null;
    }
}

function refreshServerStatuses(force) {
    if (serverRefresh) return serverRefresh;
    if (!force && Date.now() - serverStatusTime < 120000) return Promise.resolve();
    if (!servers.length) return Promise.resolve();

    serverRefresh = Promise.all(servers.map(async server => {
        serverStatus[server.address] = await fetchServerStatus(server);
    })).then(() => {
        serverStatusTime = Date.now();
        serverRefresh = null;
        renderServers();
        renderHomeServers();
    });

    return serverRefresh;
}

const serverPlayers = server => {
    const status = serverStatus[server.address];
    return status && status.online && status.players ? Number(status.players.online) || 0 : -1;
};

const sortedServers = () => [...servers].sort((a, b) => serverPlayers(b) - serverPlayers(a));

function buildServerCard(server, full) {
    const status = serverStatus[server.address];
    const card = document.createElement("div");
    card.className = "server-card";

    const icon = document.createElement("div");
    icon.className = "server-icon";

    if (status && typeof status.icon === "string" && status.icon.startsWith("data:image/")) {
        const image = document.createElement("img");
        image.src = status.icon;
        image.alt = "";
        icon.appendChild(image);
    } else {
        icon.textContent = server.name.charAt(0).toUpperCase();
    }

    const main = document.createElement("div");
    main.className = "server-main";

    const name = document.createElement("strong");
    name.textContent = server.name;

    const meta = document.createElement("div");
    meta.className = "server-meta";

    const dot = document.createElement("span");
    dot.className = "status-dot";

    let text;

    if (!status) {
        text = "Status unavailable";
    } else if (!status.online) {
        dot.classList.add("offline");
        text = "Offline";
    } else {
        dot.classList.add("online");
        const online = Number(status.players?.online) || 0;
        text = `${online.toLocaleString()} online`;

        const version = status.version?.name_clean;
        if (full && version) text += ` · ${version}`;
    }

    meta.append(dot, text);
    main.append(name, meta);

    if (full && server.description) {
        const description = document.createElement("div");
        description.className = "server-desc";
        description.textContent = server.description;
        main.appendChild(description);
    }

    const actions = document.createElement("div");
    actions.className = "server-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "profile-copy";
    copy.textContent = server.address;
    copy.setAttribute("aria-label", `Copy ${server.address}`);
    copy.addEventListener("click", async () => {
        const copied = await copyWalletAddress(server.address);
        copy.textContent = copied ? "Copied!" : "Copy failed";
        setTimeout(() => { copy.textContent = server.address; }, 1500);
    });
    actions.appendChild(copy);

    if (full && /^https:\/\//.test(server.website || "")) {
        const link = document.createElement("a");
        link.className = "profile-link";
        link.style.marginTop = "0";
        link.href = server.website;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Website ↗";
        actions.appendChild(link);
    }

    card.append(icon, main, actions);
    return card;
}

function renderServers() {
    const list = document.getElementById("serverList");

    if (!list) return;

    if (!servers.length) {
        const empty = document.createElement("p");
        empty.className = "player-message";
        empty.textContent = "No servers added yet.";
        list.replaceChildren(empty);
        return;
    }

    list.replaceChildren(...sortedServers().map(server => buildServerCard(server, true)));
}

function renderHomeServers() {
    const list = document.getElementById("homeServers");

    if (!list) return;

    list.replaceChildren(...sortedServers().slice(0, 3).map(server => buildServerCard(server, false)));
    list.previousElementSibling.hidden = servers.length === 0;
    list.hidden = servers.length === 0;
    const more = list.nextElementSibling;
    if (more) more.hidden = servers.length === 0;
}

function renderRealms() {
    const list = document.getElementById("realmList");

    if (!list) return;

    if (!realms.length) {
        const empty = document.createElement("p");
        empty.className = "player-message";
        empty.textContent = "No Realms added yet.";
        list.replaceChildren(empty);
        return;
    }

    list.replaceChildren(...realms.map(realm => {
        const card = document.createElement("div");
        card.className = "server-card";

        const icon = document.createElement("div");
        icon.className = "server-icon";
        icon.textContent = realm.name.charAt(0).toUpperCase();

        const main = document.createElement("div");
        main.className = "server-main";

        const name = document.createElement("strong");
        name.textContent = realm.name;

        const meta = document.createElement("div");
        meta.className = "server-meta";
        meta.textContent = realm.edition === "Bedrock" ? "Bedrock Realm" : "Java Realm";

        main.append(name, meta);

        if (realm.description) {
            const description = document.createElement("div");
            description.className = "server-desc";
            description.textContent = realm.description;
            main.appendChild(description);
        }

        const actions = document.createElement("div");
        actions.className = "server-actions";

        const join = document.createElement("a");
        join.className = "back-btn";
        join.style.margin = "0";
        join.style.textDecoration = "none";
        join.href = `https://realms.gg/${realm.code}`;
        join.target = "_blank";
        join.rel = "noopener noreferrer";
        join.textContent = "Join";

        actions.appendChild(join);
        card.append(icon, main, actions);
        return card;
    }));
}

document.querySelectorAll("#serverTabs .profile-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll("#serverTabs .profile-tab").forEach(other => {
            const active = other === tab;
            other.classList.toggle("active", active);
            other.setAttribute("aria-selected", String(active));
        });

        document.getElementById("serverPanelJava").classList.toggle("hidden", tab.dataset.stab !== "java");
        document.getElementById("serverPanelRealms").classList.toggle("hidden", tab.dataset.stab !== "realms");
    });
});

// ========================================
// SITE SETTINGS (ADDED) — from settings.json (set in the admin page)
// ========================================

function showBanner(text) {
    const key = `capemc-banner:${text}`;

    try {
        if (sessionStorage.getItem(key)) return;
    } catch (error) {
        // Storage blocked: the banner just shows every time.
    }

    const banner = document.createElement("div");
    banner.className = "site-banner";
    banner.setAttribute("role", "status");

    const message = document.createElement("span");
    message.textContent = text;

    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss announcement");
    close.textContent = "×";
    close.addEventListener("click", () => {
        banner.remove();

        try {
            sessionStorage.setItem(key, "1");
        } catch (error) {
            // Ignore.
        }
    });

    banner.append(message, close);
    document.body.insertBefore(banner, document.body.firstChild);
}

function applySettings() {
    const settings = siteSettings;
    const isHttps = value => typeof value === "string" && /^https:\/\//.test(value);

    if (isHttps(settings.discordUrl)) {
        document.querySelectorAll('a[href^="https://discord.gg"]').forEach(link => {
            link.href = settings.discordUrl;
        });
    }

    const options = donationOverlay.querySelector(".cm-donation-options");

    if (isHttps(settings.paypalUrl) && options && !options.querySelector("a.cm-donation-option")) {
        const link = document.createElement("a");
        link.className = "cm-donation-option";
        link.href = settings.paypalUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const icon = document.createElement("span");
        icon.className = "cm-donation-icon";
        icon.textContent = "💙";

        const text = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = "Donate with PayPal";
        const small = document.createElement("small");
        small.textContent = "Support us through PayPal";
        text.append(title, small);

        const arrow = document.createElement("span");
        arrow.className = "cm-donation-arrow";
        arrow.textContent = "↗";

        link.append(icon, text, arrow);
        options.prepend(link);
    }

    const announcement = settings.announcement;

    if (announcement && announcement.enabled && announcement.text) {
        showBanner(String(announcement.text));
    }
}

// ========================================
// START WEBSITE
// ========================================

loadSiteData().then(() => {
    applySettings();

    if (!capes.length) {
        const message = document.createElement("p");
        message.className = "cm-no-results";
        message.textContent = "The cape list couldn't be loaded. If you edited capes.json, check it for a missing bracket or an extra comma.";
        capeGrid.replaceChildren(message);
        homeGrid.replaceChildren(message.cloneNode(true));
    } else {
        fillGrid(homeGrid, publicCapes.slice(0, 3));
        renderCapeCards("");
        updateHomeStats();
    }

    // No focus jump or scroll on first load; reads the URL so shared links work.
    route({ focus: false, scroll: false });
    loadCapeStats();

    loadServersAndRealms().then(() => refreshServerStatuses(false));
    loadRandomSkins();
});
