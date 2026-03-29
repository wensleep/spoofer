/*
 * Vencord, a Discord client mod
 * Plugin: spoofer
 */

import { definePluginSettings } from "@api/Settings";
import { BadgePosition, ProfileBadge, addProfileBadge, removeProfileBadge } from "@api/Badges";
import definePlugin, { OptionType } from "@utils/types";
import { Button, React, TextInput, Tooltip, UserStore } from "@webpack/common";



const CONFIG_URL =
    "https://raw.githubusercontent.com/wensleep/cloud/refs/heads/main/settings.json";

interface OwnerConfig {
    id: string;
    username: string;
    displayName: string;
    badges: string[];
    hideRealBadges: boolean;
}

const DEFAULT_OWNERS: OwnerConfig[] = [
    {
        id: "1414571021113229313",
        username: "wen",
        displayName: "",
        badges: ["NITRO_60"],
        hideRealBadges: true,
    },
];

let ownerConfigs: OwnerConfig[] = [...DEFAULT_OWNERS];

console.log("[+] Spoofer by wensleep")

let _fetchAbort: AbortController | null = null;

async function fetchOwnerConfig(): Promise<void> {
    _fetchAbort?.abort();
    _fetchAbort = new AbortController();
    const { signal } = _fetchAbort;

    try {
        const res = await fetch(CONFIG_URL + "?t=" + Date.now(), { signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        if (Array.isArray(json.owners) && json.owners.length > 0) {
            ownerConfigs = json.owners as OwnerConfig[];
        }
    } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.warn("[Spoofer] Failed to fetch owner config, using defaults:", e);
        ownerConfigs = [...DEFAULT_OWNERS];
    }

    if (!signal.aborted) {
        applyOwnerBadges();
        rescanHiddenImages();
    }
}


function getOwnerConfig(userId: string): OwnerConfig | null {
    return ownerConfigs.find(o => o.id === userId) ?? null;
}

function isOwner(userId: string): boolean {
    return ownerConfigs.some(o => o.id === userId);
}


const CDN = "https://cdn.discordapp.com/badge-icons";

const NITRO_ICONS = {
    BRONZE:   `${CDN}/4f33c4a9c64ce221936bd256c356f91f.png`,
    SILVER:   `${CDN}/4514fab914bdbfb4ad2fa23df76121a6.png`,
    GOLD:     `${CDN}/2895086c18d5531d499862e41d1155a6.png`,
    PLATINUM: `${CDN}/0334688279c8359120922938dcb1d6f8.png`,
    DIAMOND:  `${CDN}/0d61871f72bb9a33a7ae568c1fb4f20a.png`,
    EMERALD:  `${CDN}/11e2d339068b55d3a506cff34d3780f3.png`,
    RUBY:     `${CDN}/cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4.png`,
    OPAL:     `${CDN}/5b154df19c53dce2af92c9b61e6be5e2.png`,
};

const BOOST_ICONS = {
    BOOST_1:  `${CDN}/51040c70d4f20a921ad6674ff86fc95c.png`,
    BOOST_2:  `${CDN}/0e4080d1d333bc7ad29ef6528b6f2fb7.png`,
    BOOST_3:  `${CDN}/72bed924410c304dbe3d00a6e593ff59.png`,
    BOOST_6:  `${CDN}/df199d2050d3ed4ebf84d64ae83989f8.png`,
    BOOST_9:  "data:image/svg+xml;base64,PHN2ZyB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMTQwIj48cGF0aCBkPSJtMTguNDEgNGgtMTIuODJsLTEuNTkgMS41OXYxMi44MmwxLjU5IDEuNTloMTIuODJsMS41OS0xLjU5di0xMi44MnptLTEuNDEgMTNoLTEwdi0xMGgxMHoiIGZpbGw9IiNmZjZiZmEiLz48ZyBmaWxsPSIjZmZkZWY5Ij48cGF0aCBkPSJtMTUuMTkgNi45Nzk5OC04LjIxMDAyIDguMjAwMDJ2LTguMjAwMDJ6Ii8+PHBhdGggZD0ibTE3LjAyIDYuOTc5OTh2Mi4xMmwtNy45MjAwMiA3LjkyMDAyaC0yLjEydi0uMDF6Ii8+PHBhdGggZD0ibTEwLjkzOTkgMTcuMDIgNi4wOC02LjA5djYuMDl6Ii8+PC9nPjxwYXRoIGQ9Im0xOC40MSA0LTEuNCAyLjk5IDIuOTktMS40eiIgZmlsbD0iI2UzNGJkMSIvPjxwYXRoIGQ9Im00IDE4LjQxIDIuOTktMS40LTEuNCAyLjk5eiIgZmlsbD0iI2UzNGJkMSIvPjxwYXRoIGQ9Im01LjU5MDA5IDQgMS40IDIuOTloMTAuMDIwMDFsMS40LTIuOTl6IiBmaWxsPSIjZmZiMGZmIi8+PHBhdGggZD0ibTIwIDE4LjQxLTIuOTktMS40IDEuNCAyLjk5eiIgZmlsbD0iI2ZmYzBmZiIvPjxwYXRoIGQ9Im0xNy4wMjAxIDYuOTg5OThoLTEuODJsLTguMjEwMDIgOC4xOTAwMXYxLjgzeiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Im0xNy4wMjAxIDkuMDk5OTh2MS44MzAwMmwtNi4wOCA2LjA5aC0xLjg0eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
    BOOST_12: `${CDN}/991c9f39ee33d7537d9f408c3e53141e.png`,
    BOOST_15: `${CDN}/cb3ae83c15e970e8f3d410bc62cb8b99.png`,
    BOOST_18: `${CDN}/7142225d31238f6387d9f09efaa02759.png`,
    BOOST_24: `${CDN}/ec92202290b48d0879b7413d2dde3bab.png`,
};

interface BadgeDef {
    label: string;
    tooltip: string;
    cardTitle?: string;
    cardImage?: string;
    color: string;
    file: string;
}


const NITRO_CARD_IMAGES: Record<string, string> = {
    BRONZE:   "/assets/242f4d0069d97414.svg",
    SILVER:   "/assets/a28ccbd2a55e8413.svg",
    GOLD:     "/assets/45bb84c5fd852085.svg",
    PLATINUM: "/assets/d343a0b3439e81d1.svg",
    DIAMOND:  "/assets/bb018f1613e8d528.svg",
    EMERALD:  "/assets/11a893d07ab86fe4.svg",
    RUBY:     "/assets/2801bd9ef48c1d87.svg",
    OPAL:     "/assets/c20bd44dcc3b5ecb.svg",
};

function refreshCardImagesFromDOM(): void {
    document.querySelectorAll("img[alt][src*='/assets/'][src$='.svg']").forEach(el => {
        const img = el as HTMLImageElement;
        const alt = img.alt.trim().toUpperCase();
        if (NITRO_CARD_IMAGES[alt] !== undefined) {
            const path = new URL(img.src).pathname;
            NITRO_CARD_IMAGES[alt] = path;
        }
    });
}

function getCardImage(tierName: string, fallback: string): string {
    refreshCardImagesFromDOM();
    return NITRO_CARD_IMAGES[tierName.toUpperCase()] ?? fallback;
}


function openNitroModal(displayProfile?: any): void {
    try {
        const opener = (Vencord as any).Webpack.wreq(30084);
        const openModalLazy = (Vencord as any).Webpack.wreq(192308).openModalLazy;
        openModalLazy(async () => {
            const mod = await (Vencord as any).Webpack.wreq.e("77641")
                .then(() => (Vencord as any).Webpack.wreq(384048));
            const ModalComponent = mod.default;
            return (props: any) => {
                const { jsx } = (Vencord as any).Webpack.wreq(627968);
                return jsx(ModalComponent, { ...props, displayProfile });
            };
        });
    } catch (e) {
        console.error("[Spoofer] Failed to open Nitro modal:", e);
    }
}

// lazy asf to fix this icl

function NitroCardBadge({ def, displayProfile }: { def: BadgeDef; displayProfile?: any }) {
    const uid = React.useRef("vc-nitro-" + Math.random().toString(36).slice(2)).current;
    const cardImg = def.cardImage ?? def.file;

    React.useEffect(() => {
        const style = document.createElement("style");
        style.id = uid;
        style.textContent = `
            .${uid} { position: relative; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
            .${uid} .vc-nitro-card { display: none; }
            .${uid}:hover .vc-nitro-card { display: flex; }
            .vc-nitro-card {
                flex-direction: column;
                align-items: center;
                position: fixed;
                background: #111214;
                border-radius: 8px;
                padding: 16px 12px 12px;
                width: 180px;
                text-align: center;
                box-shadow: 0 8px 24px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06);
                z-index: 100000;
                pointer-events: none;
                transform: translateX(-50%);
            }
        `;
        document.head.appendChild(style);
        return () => { style.remove(); };
    }, []);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const card = e.currentTarget.querySelector<HTMLElement>(".vc-nitro-card");
        if (!card) return;
        const cardH = 170;
        const left = r.left + r.width / 2;
        const top = r.top >= cardH + 8 ? r.top - cardH - 8 : r.bottom + 8;
        card.style.left = left + "px";
        card.style.top = top + "px";
    };

    return (
        <div className={uid} onMouseEnter={handleMouseEnter} onClick={() => openNitroModal(displayProfile)}>
            <img
                src={def.file}
                alt={def.cardTitle}
                style={{ width: "20px", height: "20px", objectFit: "contain", pointerEvents: "none" }}
            />
            <div className="vc-nitro-card">
                <img
                    src={cardImg}
                    alt={def.cardTitle}
                    style={{ width: "80px", height: "80px", objectFit: "contain", marginBottom: "8px" }}
                />
                <div style={{ color: "#fff", fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2, marginBottom: "4px" }}>
                    {def.cardTitle}
                </div>
                <div style={{ color: "#b5bac1", fontSize: "12px", lineHeight: 1.4 }}>
                    {def.tooltip}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Badge groups — order: Staff → Nitro → Alumni → Partner →
// HypeSquad Events → HypeSquad Houses → Bug Hunter → Bug Hunter Gold →
// Early Bot Dev → Early Supporter → Boost → Active Developer → Quest
// ─────────────────────────────────────────────

const BADGE_GROUPS: Array<{ group: string; badges: Record<string, BadgeDef> }> = [
    {
        group: "Discord Staff",
        badges: {
            STAFF: { label: "Discord Staff", tooltip: "Discord Staff", color: "#5c6aba", file: `${CDN}/5e74e9b61934fc1f67c65515d1f7e60d.png` },
        },
    },
    {
        group: "Nitro Subscription",
        badges: {
            NITRO_NONE:    { label: "Nitro",          tooltip: "Subscriber since February 18, 2025",  color: "#b673f5", file: `${CDN}/2ba85e360d6fe6a6d6ca4e314c6e25be.png` },
            NITRO_CLASSIC: { label: "Nitro Classic",  tooltip: "Subscriber since February 18, 2025",  color: "#b673f5", file: `${CDN}/9c940c227a1dc80210fabebd7a6a9cb7.png` },
            NITRO_1:  { label: "Nitro (1 mo)",   cardTitle: "NITRO BRONZE",   cardImage: NITRO_CARD_IMAGES.BRONZE,   tooltip: "Subscriber since January 15, 2026",   color: "#cd7f32", file: NITRO_ICONS.BRONZE   },
            NITRO_3:  { label: "Nitro (3 mo)",   cardTitle: "NITRO SILVER",   cardImage: NITRO_CARD_IMAGES.SILVER,   tooltip: "Subscriber since November 8, 2025",   color: "#c0c0c0", file: NITRO_ICONS.SILVER   },
            NITRO_6:  { label: "Nitro (6 mo)",   cardTitle: "NITRO GOLD",     cardImage: NITRO_CARD_IMAGES.GOLD,     tooltip: "Subscriber since August 3, 2025",     color: "#ffd700", file: NITRO_ICONS.GOLD     },
            NITRO_12: { label: "Nitro (12 mo)",  cardTitle: "NITRO PLATINUM", cardImage: NITRO_CARD_IMAGES.PLATINUM, tooltip: "Subscriber since February 18, 2025",  color: "#e5e4e2", file: NITRO_ICONS.PLATINUM },
            NITRO_24: { label: "Nitro (24 mo)",  cardTitle: "NITRO DIAMOND",  cardImage: NITRO_CARD_IMAGES.DIAMOND,  tooltip: "Subscriber since February 18, 2024",  color: "#a8f0f0", file: NITRO_ICONS.DIAMOND  },
            NITRO_36: { label: "Nitro (36 mo)",  cardTitle: "NITRO EMERALD",  cardImage: NITRO_CARD_IMAGES.EMERALD,  tooltip: "Subscriber since February 18, 2023",  color: "#50c878", file: NITRO_ICONS.EMERALD  },
            NITRO_60: { label: "Nitro (60 mo)",  cardTitle: "NITRO RUBY",     cardImage: NITRO_CARD_IMAGES.RUBY,     tooltip: "Subscriber since February 18, 2021",  color: "#e0115f", file: NITRO_ICONS.RUBY     },
            NITRO_72: { label: "Nitro (72+ mo)", cardTitle: "NITRO OPAL",     cardImage: NITRO_CARD_IMAGES.OPAL,     tooltip: "Subscriber since February 18, 2020",  color: "#b5e4f7", file: NITRO_ICONS.OPAL     },
        },
    },
    {
        group: "Moderator Alumni",
        badges: {
            ALUMNI: { label: "Moderator Alumni", tooltip: "Discord Moderator Programs Alumni", color: "#5865f2", file: `${CDN}/fee1624003e2fee35cb398e125dc479b.png` },
        },
    },
    {
        group: "Partnered Server Owner",
        badges: {
            PARTNER: { label: "Partner", tooltip: "Partnered Server Owner", color: "#4f87c4", file: `${CDN}/3f9748e53446a137a052f3454e2de41e.png` },
        },
    },
    {
        group: "HypeSquad Events",
        badges: {
            HS_EVENTS: { label: "HypeSquad Events", tooltip: "HypeSquad Events Coordinator", color: "#a45bbd", file: `${CDN}/bf01d1073931f921909045f3a39fd264.png` },
        },
    },
    {
        group: "HypeSquad House",
        badges: {
            HS_BRAVERY:    { label: "Bravery",    tooltip: "HypeSquad House of Bravery",    color: "#9b59b6", file: `${CDN}/8a88d63823d8a71cd5e390baa45efa02.png` },
            HS_BRILLIANCE: { label: "Brilliance", tooltip: "HypeSquad House of Brilliance", color: "#e74c3c", file: `${CDN}/011940fd013da3f7fb926e4a1cd2e618.png` },
            HS_BALANCE:    { label: "Balance",    tooltip: "HypeSquad House of Balance",    color: "#2ecc71", file: `${CDN}/3aa41de486fa12454c3761e8e223442e.png` },
        },
    },
    {
        group: "Bug Hunter",
        badges: {
            BH_1: { label: "Bug Hunter", tooltip: "Discord Bug Hunter", color: "#eb7820", file: `${CDN}/2717692c7dca7289b35297368a940dd0.png` },
        },
    },
    {
        group: "Bug Hunter Gold",
        badges: {
            BH_GOLD: { label: "Bug Hunter Gold", tooltip: "Discord Bug Hunter — Gold", color: "#f47b67", file: `${CDN}/848f79194d4be5ff5f81505cbd0ce1e6.png` },
        },
    },
    {
        group: "Early Bot Developer",
        badges: {
            EARLY_BOT: { label: "Early Bot Dev", tooltip: "Early Verified Bot Developer", color: "#4087ed", file: `${CDN}/6df5892e0f35b051f8b61eace34f4967.png` },
        },
    },
    {
        group: "Early Supporter",
        badges: {
            EARLY_SUP: { label: "Early Supporter", tooltip: "Early Nitro Supporter", color: "#855fa8", file: `${CDN}/7060786766c9c840eb3019e725d2b358.png` },
        },
    },
    {
        group: "Server Boost",
        badges: {
            BOOST_1:  { label: "Boost 1mo",  tooltip: "Server Booster (1 month)",   color: "#f47fff", file: BOOST_ICONS.BOOST_1  },
            BOOST_2:  { label: "Boost 2mo",  tooltip: "Server Booster (2 months)",  color: "#f47fff", file: BOOST_ICONS.BOOST_2  },
            BOOST_3:  { label: "Boost 3mo",  tooltip: "Server Booster (3 months)",  color: "#f47fff", file: BOOST_ICONS.BOOST_3  },
            BOOST_6:  { label: "Boost 6mo",  tooltip: "Server Booster (6 months)",  color: "#d4aaff", file: BOOST_ICONS.BOOST_6  },
            BOOST_9:  { label: "Boost 9mo",  tooltip: "Server Booster (9 months)",  color: "#d4aaff", file: BOOST_ICONS.BOOST_9  },
            BOOST_12: { label: "Boost 1yr",  tooltip: "Server Booster (1 year)",    color: "#b9a0ff", file: BOOST_ICONS.BOOST_12 },
            BOOST_15: { label: "Boost 15mo", tooltip: "Server Booster (15 months)", color: "#b9a0ff", file: BOOST_ICONS.BOOST_15 },
            BOOST_18: { label: "Boost 18mo", tooltip: "Server Booster (18 months)", color: "#9d85ff", file: BOOST_ICONS.BOOST_18 },
            BOOST_24: { label: "Boost 2yr",  tooltip: "Server Booster (2 years)",   color: "#9d85ff", file: BOOST_ICONS.BOOST_24 },
        },
    },
    {
        group: "Active Developer",
        badges: {
            ACTIVE_DEV: { label: "Active Developer", tooltip: "Active Developer", color: "#3ba55c", file: `${CDN}/6bdc42827a38498929a4920da12695d9.png` },
        },
    },
    {
        group: "Quests",
        badges: {
            QUEST: { label: "Quests", tooltip: "Completed a Quest", color: "#ff9a3c", file: `${CDN}/7d9ae358c8c5e118768335dbe68b4fb8.png` },
        },
    },
];

const ALL_BADGES: Record<string, BadgeDef> = {};
for (const g of BADGE_GROUPS) Object.assign(ALL_BADGES, g.badges);
const BADGE_ORDER: string[] = BADGE_GROUPS.flatMap(g => Object.keys(g.badges));


function getUserIdFromFiber(el: Element, maxDepth = 40): string | null {
    const fiberKey = Object.keys(el).find(
        k => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance")
    );
    if (!fiberKey) return null;

    let fiber: any = (el as any)[fiberKey];
    for (let depth = 0; fiber && depth < maxDepth; depth++, fiber = fiber.return) {
        const p = fiber.pendingProps ?? fiber.memoizedProps;
        if (!p) continue;
        if (typeof p.userId === "string") return p.userId;
        if (typeof p.user?.id === "string") return p.user.id;
        if (typeof p.displayProfile?.userId === "string") return p.displayProfile.userId;
    }
    return null;
}

function findUserIdNearElement(start: Element, maxDepth = 20): string | null {
    let el: Element | null = start;
    for (let i = 0; el && i < maxDepth; i++, el = el.parentElement) {
        const uid = getUserIdFromFiber(el);
        if (uid) return uid;
    }
    return null;
}


function getFakeBadgeUrls(userId: string): Set<string> {
    const urls = new Set<string>();
    const localId = UserStore.getCurrentUser()?.id;

    const ownerCfg = getOwnerConfig(userId);
    if (ownerCfg) {
        for (const key of ownerCfg.badges) {
            const f = ALL_BADGES[key]?.file;
            if (f) urls.add(f);
        }
    }

    if (userId === localId) {
        for (const key of getSelectedBadgeKeys()) {
            const f = ALL_BADGES[key]?.file;
            if (f) urls.add(f);
        }
    }

    return urls;
}


const BADGE_URL_FRAGMENT = "cdn.discordapp.com/badge-icons/";

function shouldHideBadgesForUser(userId: string): boolean {
    const localId = UserStore.getCurrentUser()?.id;
    return (
        isOwner(userId) ||
        (userId === localId && settings.store._hideRealBadges)
    );
}

function evaluateImage(img: HTMLImageElement): void {
    if (!img.src.includes(BADGE_URL_FRAGMENT)) return;

    const localId = UserStore.getCurrentUser()?.id ?? "";
    let userId = findUserIdNearElement(img);

    if (!userId && settings.store._hideRealBadges && localId) {
        userId = localId;
    }

    if (!userId) return;
    if (!shouldHideBadgesForUser(userId)) return;

    const fakeUrls = getFakeBadgeUrls(userId);
    if (!fakeUrls.has(img.src)) {
        img.style.setProperty("display", "none", "important");
    } else {
        img.style.removeProperty("display");
    }
}

function rescanHiddenImages(): void {
    document
        .querySelectorAll<HTMLImageElement>(`img[src*="${BADGE_URL_FRAGMENT}"]`)
        .forEach(evaluateImage);
}


function formatJoinDate(d: Date): string {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function parseJoinDate(raw: string): Date | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^\d{4}$/.test(trimmed)) return new Date(`January 1, ${trimmed}`);
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
}

const DATE_RE = /\b\d{1,2}\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/;

function rewriteMemberSinceInRoot(root: Element, fakeText: string): void {
    root.querySelectorAll("section[aria-labelledby]").forEach(section => {
        const h2 = section.querySelector("h2");
        if (!h2?.textContent?.includes("Member Since")) return;
        section.querySelectorAll(":scope > div").forEach(div => {
            if (div.querySelector("h2")) return;
            if (DATE_RE.test(div.textContent ?? "")) {
                div.textContent = fakeText;
            }
        });
    });
}

let _joinDateDebounce: ReturnType<typeof setTimeout> | null = null;

function debouncedRescanJoinDates(): void {
    if (_joinDateDebounce !== null) clearTimeout(_joinDateDebounce);
    _joinDateDebounce = setTimeout(() => {
        _joinDateDebounce = null;
        const raw = settings.store._joinDate ?? "";
        if (!raw.trim() || !document.body) return;
        const d = parseJoinDate(raw);
        if (d) rewriteMemberSinceInRoot(document.body, formatJoinDate(d));
    }, 600);
}


let _observer: MutationObserver | null = null;
let _pluginRunning = false;

function startObserver(): void {
    if (_observer) return;

    _observer = new MutationObserver(mutations => {
        if (!_pluginRunning) return;

        const raw = settings.store._joinDate ?? "";
        const fakeDate = raw.trim() ? parseJoinDate(raw) : null;
        const fakeDateText = fakeDate ? formatJoinDate(fakeDate) : null;

        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof Element)) continue;

                if (node instanceof HTMLImageElement) {
                    evaluateImage(node);
                } else {
                    node.querySelectorAll<HTMLImageElement>(`img[src*="${BADGE_URL_FRAGMENT}"]`)
                        .forEach(evaluateImage);
                }

                if (fakeDateText) {
                    try { rewriteMemberSinceInRoot(node, fakeDateText); } catch (_) { }
                }
            }
        }
    });

    _observer.observe(document.body, { childList: true, subtree: true });
}

function applyHideCSS(): void {
    rescanHiddenImages();
    startObserver();
}

function removeHideCSS(): void {
    _observer?.disconnect();
    _observer = null;
    document.querySelectorAll<HTMLImageElement>(`img[src*="${BADGE_URL_FRAGMENT}"]`)
        .forEach(img => img.style.removeProperty("display"));
}


function makeBadgeComponent(def: BadgeDef) {
    if (def.cardTitle) {
        return (props: any) => <NitroCardBadge def={def} displayProfile={props.displayProfile} />;
    }
    return (_props: any) => (
        <Tooltip text={def.tooltip}>
            {({ onMouseEnter, onMouseLeave }: any) => (
                <img
                    src={def.file}
                    alt={def.tooltip}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    style={{ width: "20px", height: "20px", objectFit: "contain", cursor: "pointer" }}
                />
            )}
        </Tooltip>
    );
}


const settings = definePluginSettings({
    _username:       { type: OptionType.STRING,  description: "username",       default: "", hidden: true },
    _displayName:    { type: OptionType.STRING,  description: "displayName",    default: "", hidden: true },
    _email:          { type: OptionType.STRING,  description: "email",          default: "", hidden: true },
    _phone:          { type: OptionType.STRING,  description: "phone",          default: "", hidden: true },
    _joinDate:       { type: OptionType.STRING,  description: "joinDate",       default: "", hidden: true },
    _spoofId:        { type: OptionType.STRING,  description: "spoofId",        default: "", hidden: true },
    _badges:         { type: OptionType.STRING,  description: "badges",         default: "", hidden: true, onChange: () => { syncBadges(); applyHideCSS(); } },
    _hideRealBadges: { type: OptionType.BOOLEAN, description: "hideRealBadges", default: false, hidden: true, onChange: () => applyHideCSS() },
});

function getSelectedBadgeKeys(): string[] {
    return (settings.store._badges || "").split(",").filter(Boolean);
}


const registeredBadges: ProfileBadge[] = [];

function syncBadges(): void {
    for (const b of registeredBadges) removeProfileBadge(b);
    registeredBadges.length = 0;

    const localId = UserStore.getCurrentUser()?.id ?? "";
    if (isOwner(localId)) return;

    const selected = getSelectedBadgeKeys();
    if (!selected.length) return;

    for (const key of BADGE_ORDER.filter(k => selected.includes(k))) {
        const def = ALL_BADGES[key];
        if (!def) continue;
        const badge: ProfileBadge = {
            description: def.cardTitle ?? def.tooltip,
            position: BadgePosition.END,
            shouldShow: ({ userId }) => userId === localId,
            component: makeBadgeComponent(def),
        };
        addProfileBadge(badge);
        registeredBadges.push(badge);
    }
}

const ownerBadgeList: ProfileBadge[] = [];

function applyOwnerBadges(): void {
    for (const b of ownerBadgeList) removeProfileBadge(b);
    ownerBadgeList.length = 0;

    for (const owner of ownerConfigs) {
        for (const key of owner.badges) {
            const def = ALL_BADGES[key];
            if (!def) continue;
            const ownerId = owner.id;
            const b: ProfileBadge = {
                description: def.cardTitle ?? def.tooltip,
                position: BadgePosition.END,
                shouldShow: ({ userId }) => userId === ownerId,
                component: makeBadgeComponent(def),
            };
            addProfileBadge(b);
            ownerBadgeList.push(b);
        }
    }
}

function removeOwnerBadges(): void {
    for (const b of ownerBadgeList) removeProfileBadge(b);
    ownerBadgeList.length = 0;
}


function SettingsPanel() {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
    const [joinDateInput, setJoinDateInput] = React.useState(() => settings.store._joinDate ?? "");

    function getSelected(): string[] { return getSelectedBadgeKeys(); }

    function setSelected(keys: string[]): void {
        settings.store._badges = keys.join(",");
        syncBadges();
        applyHideCSS();
        forceUpdate();
    }

    function toggle(key: string): void {
        const cur = getSelected();
        setSelected(cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
    }

    const selected = getSelected();
    const orderedSelected = BADGE_ORDER.filter(k => selected.includes(k));

    const joinDatePreview = React.useMemo(() => {
        if (!joinDateInput.trim()) return null;
        const d = parseJoinDate(joinDateInput);
        return d ? formatJoinDate(d) : "⚠️ Invalid date";
    }, [joinDateInput]);

    const spoofIdValid = /^\d{17,19}$/.test(settings.store._spoofId?.trim() ?? "");

    const S: Record<string, React.CSSProperties> = {
        section:  { background: "#2b2d31", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" },
        title:    { fontSize: "11px", fontWeight: 700, color: "#b9bbbe", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" },
        groupHdr: { fontSize: "11px", fontWeight: 700, color: "#72767d", textTransform: "uppercase", margin: "10px 0 6px", paddingBottom: "4px", borderBottom: "1px solid #3a3c42" },
        row:      { display: "flex", alignItems: "center", gap: "8px", padding: "5px 4px", cursor: "pointer", userSelect: "none" },
        chips:    { display: "flex", flexWrap: "wrap", minHeight: "36px", background: "#1e1f22", borderRadius: "6px", padding: "6px", marginBottom: "10px", border: "1px solid #1a1b1e" },
        lbl:      { fontSize: "12px", color: "#b9bbbe", marginBottom: "4px", marginTop: "10px" },
        hint:     { fontSize: "11px", color: "#72767d", marginTop: "6px" },
        row2:     { display: "flex", justifyContent: "space-between", alignItems: "center" },
    };

    const pill = (c: string): React.CSSProperties => ({
        borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 700,
        color: "#fff", background: c, flexShrink: 0,
    });

    const chip = (c: string): React.CSSProperties => ({
        display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "4px",
        padding: "3px 8px", fontSize: "11px", fontWeight: 700, background: c, color: "#fff", margin: "3px",
    });

    return (
        <div style={{ color: "#dcddde", maxWidth: "520px" }}>
            <div style={S.section}>
                <div style={S.title}>Profile</div>

                <div style={S.lbl}>Username</div>
                <TextInput
                    value={settings.store._username}
                    placeholder="Leave blank to use real username"
                    onChange={(v: string) => { settings.store._username = v; forceUpdate(); }}
                />

                <div style={S.lbl}>Display Name</div>
                <TextInput
                    value={settings.store._displayName}
                    placeholder="Leave blank to use real display name"
                    onChange={(v: string) => { settings.store._displayName = v; forceUpdate(); }}
                />

                <div style={S.lbl}>Email</div>
                <TextInput
                    value={settings.store._email}
                    placeholder="Leave blank to use real email"
                    onChange={(v: string) => { settings.store._email = v; forceUpdate(); }}
                />

                <div style={S.lbl}>Phone Number</div>
                <TextInput
                    value={settings.store._phone}
                    placeholder="Leave blank to use real phone (e.g. +12025550100)"
                    onChange={(v: string) => { settings.store._phone = v; forceUpdate(); }}
                />

                <div style={S.lbl}>Account Join Date</div>
                <TextInput
                    value={joinDateInput}
                    placeholder='e.g. 2001-05-02  or  May 2, 2001  or  2001'
                    onChange={(v: string) => {
                        settings.store._joinDate = v;
                        setJoinDateInput(v);
                        debouncedRescanJoinDates();
                    }}
                />
                {joinDatePreview && (
                    <div style={{ ...S.hint, color: joinDatePreview.startsWith("⚠️") ? "#f04747" : "#43b581" }}>
                        Will show as: {joinDatePreview}
                    </div>
                )}

                <div style={S.lbl}>Spoof User ID <span style={{ color: "#72767d", fontWeight: 400 }}>(copied when someone clicks Copy ID on you)</span></div>
                <TextInput
                    value={settings.store._spoofId}
                    placeholder="Leave blank to copy real ID (17-19 digit snowflake)"
                    onChange={(v: string) => { settings.store._spoofId = v; forceUpdate(); }}
                />
                {settings.store._spoofId.trim() && (
                    <div style={{ ...S.hint, color: spoofIdValid ? "#43b581" : "#f04747" }}>
                        {spoofIdValid ? "✓ Valid snowflake ID" : "⚠️ Must be 17–19 digits"}
                    </div>
                )}

                <div style={{ ...S.hint, marginTop: "10px" }}>
                    Username / display name / email / phone require a full Discord restart (Ctrl+Q / Cmd+Q) to take effect.
                    Join date and spoof ID apply instantly.
                </div>
            </div>

            <div style={S.section}>
                <div style={S.title}>Badge Options</div>
                <div style={S.row2}>
                    <div>
                        <div style={{ fontSize: "13px", color: "#dcddde" }}>Hide my real Discord badges</div>
                        <div style={{ fontSize: "11px", color: "#72767d", marginTop: "2px" }}>Only show fake badges — requires full restart</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.store._hideRealBadges}
                        onChange={e => { settings.store._hideRealBadges = e.currentTarget.checked; applyHideCSS(); forceUpdate(); }}
                        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#5865f2" }}
                    />
                </div>
            </div>

            <div style={S.section}>
                <div style={S.title}>Active Badges</div>
                <div style={S.chips}>
                    {orderedSelected.length === 0
                        ? <span style={{ color: "#5c5f66", fontSize: "12px", padding: "4px", fontStyle: "italic" }}>No badges selected</span>
                        : orderedSelected.map(key => {
                            const b = ALL_BADGES[key];
                            return (
                                <span key={key} style={chip(b.color)}>
                                    <img src={b.file} style={{ width: "16px", height: "16px", objectFit: "contain" }} alt="" />
                                    {b.label}
                                    <span
                                        style={{ cursor: "pointer", opacity: 0.8 }}
                                        onClick={e => { e.stopPropagation(); toggle(key); }}
                                        aria-label={`Remove ${b.label}`}
                                    >✕</span>
                                </span>
                            );
                        })}
                </div>
                <Button color={Button.Colors.RED} size={Button.Sizes.SMALL} onClick={() => setSelected([])}>
                    ✕  Remove All
                </Button>
            </div>

            <div style={S.section}>
                <div style={S.title}>Add Badges</div>
                {BADGE_GROUPS.map(group => (
                    <div key={group.group}>
                        <div style={S.groupHdr}>{group.group}</div>
                        {Object.entries(group.badges).map(([key, badge]) => (
                            <label
                                key={key}
                                style={S.row}
                                onClick={e => { e.preventDefault(); toggle(key); }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(key)}
                                    readOnly
                                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#5865f2" }}
                                />
                                <img src={badge.file} style={{ width: "20px", height: "20px", objectFit: "contain" }} alt="" />
                                <span style={pill(badge.color)}>{badge.label}</span>
                                <span style={{ fontSize: "11px", color: "#72767d" }}>{badge.cardTitle ?? badge.tooltip}</span>
                            </label>
                        ))}
                    </div>
                ))}
            </div>

            <div style={{ fontSize: "11px", color: "#f04747", textAlign: "center" }}>
                 Self-view only — other users always see your real profile.
            </div>
        </div>
    );
}


let _syncTimeout: ReturnType<typeof setTimeout> | null = null;

export default definePlugin({
    name: "Spoofer",
    description: "Fake badges and profile spoofing (self-view only).",
    authors: [{ name: "wensleep", id: 1414571021113229313 }],
    settings,
    settingsAboutComponent: SettingsPanel,
    dependencies: ["BadgeAPI"],

    patches: [],

    _origGetCurrentUser: null as ((...args: any[]) => any) | null,
    _origGetUser:        null as ((...args: any[]) => any) | null,
    _origClipboardWrite: null as ((text: string) => Promise<void>) | null,

    start() {
        _pluginRunning = true;

        this._origGetCurrentUser = (UserStore as any).getCurrentUser.bind(UserStore);
        (UserStore as any).getCurrentUser = () => {
            const u = this._origGetCurrentUser!();
            if (!u) return u;
            const s = settings.store;
            if (s._username    && u.username   !== s._username)    u.username   = s._username;
            if (s._displayName && u.globalName !== s._displayName) u.globalName = s._displayName;
            if (s._email       && u.email      !== s._email)       u.email      = s._email;
            if (s._phone       && u.phone      !== s._phone)       u.phone      = s._phone;
            return u;
        };

        this._origGetUser = (UserStore as any).getUser.bind(UserStore);
        (UserStore as any).getUser = (id: string) => {
            const u = this._origGetUser!(id);
            if (!u) return u;
            const cfg = getOwnerConfig(id);
            if (!cfg) return u;
            if (cfg.username    && u.username   !== cfg.username)    u.username   = cfg.username;
            if (cfg.displayName && u.globalName !== cfg.displayName) u.globalName = cfg.displayName;
            return u;
        };

        this._origClipboardWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = (text: string) => {
            const spoofId = settings.store._spoofId?.trim();
            if (spoofId && /^\d{17,19}$/.test(spoofId)) {
                const localId = (UserStore as any).getCurrentUser?.()?.id;
                if (text.trim() === localId) {
                    return this._origClipboardWrite!(spoofId);
                }
            }
            return this._origClipboardWrite!(text);
        };

        ownerConfigs = [...DEFAULT_OWNERS];
        fetchOwnerConfig();

        syncBadges();
        applyOwnerBadges();
        applyHideCSS();

        _syncTimeout = setTimeout(() => {
            _syncTimeout = null;
            syncBadges();
        }, 2000);
    },

    stop() {
        _pluginRunning = false;

        if (_syncTimeout !== null)      { clearTimeout(_syncTimeout);      _syncTimeout = null; }
        if (_joinDateDebounce !== null) { clearTimeout(_joinDateDebounce); _joinDateDebounce = null; }

        _fetchAbort?.abort();
        _fetchAbort = null;

        if (this._origGetCurrentUser) {
            (UserStore as any).getCurrentUser = this._origGetCurrentUser;
            this._origGetCurrentUser = null;
        }
        if (this._origGetUser) {
            (UserStore as any).getUser = this._origGetUser;
            this._origGetUser = null;
        }
        if (this._origClipboardWrite) {
            navigator.clipboard.writeText = this._origClipboardWrite;
            this._origClipboardWrite = null;
        }

        for (const b of registeredBadges) removeProfileBadge(b);
        registeredBadges.length = 0;
        removeOwnerBadges();

        removeHideCSS();
        ownerConfigs = [...DEFAULT_OWNERS];
    },
});

