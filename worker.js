// CapeMC API (Cloudflare Worker + D1 database)
//
//   GET /api/player/<name>   fetches the player's CURRENT profile from Mojang,
//                            saves any change (name / skin / cape), and returns
//                            the saved history.
//   GET /api/capes/stats     how many tracked players have worn each cape.
//
// The data always comes from Mojang on the server, never from the visitor,
// so nobody can send fake history.

const NAME_LOOKUPS = [
    name => `https://api.minecraftservices.com/minecraft/profile/lookup/name/${name}`,
    name => `https://api.mojang.com/users/profiles/minecraft/${name}`
];
const SESSION = "https://sessionserver.mojang.com/session/minecraft/profile";

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/")) {
            return handleApi(request, env, url);
        }

        // Everything else is the normal website.
        return env.ASSETS.fetch(request);
    }
};

function json(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
    });
}

async function handleApi(request, env, url) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const parts = url.pathname.split("/").filter(Boolean);

    try {
        if (parts[1] === "player" && parts[2]) {
            return await playerRoute(env, decodeURIComponent(parts[2]));
        }

        if (parts[1] === "capes" && parts[2] === "stats") {
            return await statsRoute(env);
        }

        if (parts[1] === "skins") {
            if (parts[2] === "random") return await randomSkinsRoute(env);
            if (parts[2]) return await skinDetailRoute(env, parts[2].toLowerCase());

            return await skinsRoute(env);
        }
    } catch (error) {
        return json({ error: "The lookup service is having problems." }, 502);
    }

    return json({ error: "Not found" }, 404);
}

// ---------- Mojang ----------

async function getJson(url) {
    try {
        const response = await fetch(url, { headers: { "user-agent": "CapeMC/1.0" } });

        if (response.status === 404) return { status: 404 };
        if (!response.ok) return { status: response.status };

        return { status: 200, data: await response.json() };
    } catch (error) {
        return { status: 0 };
    }
}

const hashOf = url => {
    const match = typeof url === "string" ? url.match(/\/texture\/([0-9a-f]+)/i) : null;
    return match ? match[1].toLowerCase() : null;
};

function fromSession(id, name, data) {
    const property = (data.properties || []).find(item => item.name === "textures");
    let textures = {};

    try {
        textures = JSON.parse(atob(property.value)).textures || {};
    } catch (error) {
        textures = {};
    }

    return {
        uuid: id.replace(/-/g, "").toLowerCase(),
        name: data.name || name,
        skinHash: hashOf(textures.SKIN?.url),
        capeHash: hashOf(textures.CAPE?.url)
    };
}

function fromMcApi(doc) {
    let textures = doc.decodedTexture?.textures;

    if (!textures && doc.textures?.value) {
        try {
            textures = JSON.parse(atob(doc.textures.value)).textures;
        } catch (error) {
            textures = null;
        }
    }

    return {
        uuid: String(doc.uuid).replace(/-/g, "").toLowerCase(),
        name: doc.name,
        skinHash: hashOf(textures?.SKIN?.url),
        capeHash: hashOf(textures?.CAPE?.url)
    };
}

// Returns a profile, null if the player doesn't exist, or throws if every
// source is down.
async function fetchProfile(name) {
    let id = null;
    let realName = name;
    let notFound = false;

    for (const build of NAME_LOOKUPS) {
        const result = await getJson(build(encodeURIComponent(name)));

        if (result.status === 200 && result.data && result.data.id) {
            id = result.data.id;
            realName = result.data.name || name;
            break;
        }

        if (result.status === 404) notFound = true;
    }

    if (id) {
        const session = await getJson(`${SESSION}/${id}`);

        if (session.status === 200 && session.data) return fromSession(id, realName, session.data);
    }

    if (!id && notFound) return null;

    // Mojang is busy or rate limiting: use mc-api.io as a backup.
    const backup = await getJson(`https://mc-api.io/profile/${encodeURIComponent(name)}/JAVA`);

    if (backup.status === 200 && backup.data && backup.data.uuid) return fromMcApi(backup.data);
    if (backup.status === 404 || backup.status === 400) return null;

    throw new Error("All sources are unavailable");
}

// A one-minute memory so a busy player isn't re-fetched constantly.
async function cachedProfile(name) {
    const key = new Request(`https://capemc-cache.invalid/profile/${name.toLowerCase()}`);
    const hit = await caches.default.match(key);

    if (hit) return hit.json();

    const profile = await fetchProfile(name);

    await caches.default.put(key, new Response(JSON.stringify(profile), {
        headers: { "cache-control": "max-age=60" }
    }));

    return profile;
}

// ---------- laby.net (older names, best effort) ----------
// Laby keeps name history from years back. If its API doesn't answer (or
// blocks this request) we just return an empty list and carry on.
async function labyNames(uuid) {
    try {
        const dashed = uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
        const response = await fetch(`https://laby.net/api/v3/user/${dashed}/profile`, {
            headers: { "user-agent": "CapeMC/1.0", accept: "application/json" },
            signal: AbortSignal.timeout(4000)
        });

        if (!response.ok) return [];

        const data = await response.json();

        return (Array.isArray(data.name_history) ? data.name_history : [])
            .filter(entry => entry && typeof entry.name === "string")
            .map(entry => ({
                name: entry.name,
                changed_at: entry.changed_at ? (Date.parse(entry.changed_at) || null) : null,
                accurate: entry.accurate !== false
            }));
    } catch (error) {
        return [];
    }
}

// ---------- Database ----------

async function record(env, profile) {
    const now = Date.now();
    const db = env.DB;

    const statements = [
        db.prepare(
            "INSERT INTO players (uuid, name, first_seen, last_seen) VALUES (?, ?, ?, ?) " +
            "ON CONFLICT(uuid) DO UPDATE SET name = excluded.name, last_seen = excluded.last_seen"
        ).bind(profile.uuid, profile.name, now, now),
        db.prepare("INSERT OR IGNORE INTO name_history (uuid, name, seen_at) VALUES (?, ?, ?)")
            .bind(profile.uuid, profile.name, now)
    ];

    if (profile.capeHash) {
        statements.push(db.prepare(
            "INSERT INTO cape_history (uuid, cape_hash, first_seen, last_seen) VALUES (?, ?, ?, ?) " +
            "ON CONFLICT(uuid, cape_hash) DO UPDATE SET last_seen = excluded.last_seen"
        ).bind(profile.uuid, profile.capeHash, now, now));
    }

    if (profile.skinHash) {
        statements.push(db.prepare(
            "INSERT INTO skin_history (uuid, skin_hash, first_seen, last_seen) VALUES (?, ?, ?, ?) " +
            "ON CONFLICT(uuid, skin_hash) DO UPDATE SET last_seen = excluded.last_seen"
        ).bind(profile.uuid, profile.skinHash, now, now));
    }

    await db.batch(statements);
}

async function readHistory(env, profile) {
    const db = env.DB;

    const [player, names, capes, skins] = await Promise.all([
        db.prepare("SELECT first_seen FROM players WHERE uuid = ?").bind(profile.uuid).first(),
        db.prepare("SELECT name, seen_at FROM name_history WHERE uuid = ? ORDER BY seen_at DESC LIMIT 50").bind(profile.uuid).all(),
        db.prepare("SELECT cape_hash, first_seen, last_seen FROM cape_history WHERE uuid = ? ORDER BY last_seen DESC LIMIT 50").bind(profile.uuid).all(),
        db.prepare("SELECT skin_hash, first_seen, last_seen FROM skin_history WHERE uuid = ? ORDER BY last_seen DESC LIMIT 50").bind(profile.uuid).all()
    ]);

    return {
        uuid: profile.uuid,
        name: profile.name,
        skinHash: profile.skinHash,
        capeHash: profile.capeHash,
        trackedSince: player ? player.first_seen : null,
        names: names.results || [],
        capes: capes.results || [],
        skins: skins.results || []
    };
}

async function playerRoute(env, name) {
    if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) return json({ error: "Invalid name" }, 400);

    const profile = await cachedProfile(name);

    if (!profile) return json({ error: "Player not found" }, 404);

    const [history, laby] = await Promise.all([
        record(env, profile).then(() => readHistory(env, profile)),
        labyNames(profile.uuid)
    ]);

    history.labyNames = laby;

    return json(history);
}

async function statsRoute(env) {
    const [rows, total] = await Promise.all([
        env.DB.prepare("SELECT cape_hash, COUNT(DISTINCT uuid) AS owners FROM cape_history GROUP BY cape_hash ORDER BY owners DESC").all(),
        env.DB.prepare("SELECT COUNT(*) AS players FROM players").first()
    ]);

    const owners = {};
    (rows.results || []).forEach(row => { owners[row.cape_hash] = row.owners; });

    return json({ owners, players: total ? total.players : 0 }, 200, { "cache-control": "public, max-age=300" });
}

// Skins: how many tracked players have worn each one.
async function skinsRoute(env) {
    const [popular, latest] = await Promise.all([
        env.DB.prepare(
            "SELECT skin_hash, COUNT(DISTINCT uuid) AS players FROM skin_history " +
            "GROUP BY skin_hash ORDER BY players DESC, MAX(last_seen) DESC LIMIT 12"
        ).all(),
        env.DB.prepare(
            "SELECT skin_hash, COUNT(DISTINCT uuid) AS players, MIN(first_seen) AS first_seen FROM skin_history " +
            "GROUP BY skin_hash ORDER BY first_seen DESC LIMIT 12"
        ).all()
    ]);

    return json(
        { popular: popular.results || [], latest: latest.results || [] },
        200,
        { "cache-control": "public, max-age=60" }
    );
}

async function randomSkinsRoute(env) {
    const rows = await env.DB.prepare(
        "SELECT skin_hash, COUNT(DISTINCT uuid) AS players FROM skin_history " +
        "GROUP BY skin_hash ORDER BY RANDOM() LIMIT 6"
    ).all();

    return json({ skins: rows.results || [] });
}

// One skin: how many tracked players have worn it, and who.
async function skinDetailRoute(env, hash) {
    if (!/^[0-9a-f]{16,64}$/.test(hash)) return json({ error: "Invalid skin" }, 400);

    const [summary, wearers] = await Promise.all([
        env.DB.prepare(
            "SELECT COUNT(DISTINCT uuid) AS players, MIN(first_seen) AS first_seen, MAX(last_seen) AS last_seen " +
            "FROM skin_history WHERE skin_hash = ?"
        ).bind(hash).first(),
        env.DB.prepare(
            "SELECT p.uuid AS uuid, p.name AS name, s.first_seen AS first_seen, s.last_seen AS last_seen " +
            "FROM skin_history s JOIN players p ON p.uuid = s.uuid WHERE s.skin_hash = ? " +
            "ORDER BY s.last_seen DESC LIMIT 50"
        ).bind(hash).all()
    ]);

    return json({
        hash,
        players: summary ? summary.players : 0,
        first_seen: summary ? summary.first_seen : null,
        last_seen: summary ? summary.last_seen : null,
        wearers: wearers.results || []
    }, 200, { "cache-control": "public, max-age=60" });
}
