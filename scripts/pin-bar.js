import { MODULE_ID, PIN_SETTING } from "./settings.js";

export const PINNABLE_TYPES = [
    "Actor",
    "Item",
    "JournalEntry",
    "Scene",
    "RollTable",
    "Macro",
    "Playlist",
    "Cards",
];

const FALLBACK_ICONS = {
    Actor: "fa-user",
    Item: "fa-suitcase",
    JournalEntry: "fa-book-open",
    Scene: "fa-map",
    RollTable: "fa-dice",
    Macro: "fa-terminal",
    Playlist: "fa-music",
    Cards: "fa-layer-group",
};

export function injectPinBar() {
    const parent = document.getElementById("interface");
    if (!parent || document.getElementById("pin-this-bar")) return;

    const hotzone = document.createElement("div");
    hotzone.id = "pin-this-hotzone";

    const bar = document.createElement("div");
    bar.id = "pin-this-bar";

    for (const el of [hotzone, bar]) {
        el.addEventListener("dragenter", onDragEnter);
        el.addEventListener("dragover", onDragOver);
        el.addEventListener("dragleave", onDragLeave);
        el.addEventListener("drop", onDrop);
    }

    parent.appendChild(hotzone);
    parent.appendChild(bar);
}

function onDragEnter(event) {
    event.preventDefault();
    document.getElementById("pin-this-bar")?.classList.add("pin-this-drag-target");
}

function onDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
}

function onDragLeave(event) {
    const bar = document.getElementById("pin-this-bar");
    const hotzone = document.getElementById("pin-this-hotzone");
    const related = event.relatedTarget;
    if (
        related &&
        (bar?.contains(related) ||
            hotzone?.contains(related) ||
            related === bar ||
            related === hotzone)
    )
        return;
    bar?.classList.remove("pin-this-drag-target");
}

async function onDrop(event) {
    event.preventDefault();
    document.getElementById("pin-this-bar")?.classList.remove("pin-this-drag-target");

    let data;
    try {
        data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
        return;
    }
    if (!data?.uuid) return;

    const doc = await fromUuid(data.uuid);
    if (!doc || !PINNABLE_TYPES.includes(doc.documentName)) return;

    await addPin(doc.uuid);
}

async function setPins(next) {
    await game.settings.set(MODULE_ID, PIN_SETTING, next);
    renderPinBar();
}

async function addPin(uuid) {
    const pins = game.settings.get(MODULE_ID, PIN_SETTING);
    if (pins.includes(uuid)) return;
    await setPins([...pins, uuid]);
}

export async function togglePin(uuid) {
    const pins = game.settings.get(MODULE_ID, PIN_SETTING);
    const next = pins.includes(uuid) ? pins.filter((u) => u !== uuid) : [...pins, uuid];
    await setPins(next);
}

export async function renderPinBar() {
    const bar = document.getElementById("pin-this-bar");
    if (!bar) return;

    const pins = game.settings.get(MODULE_ID, PIN_SETTING);
    const docs = await Promise.all(pins.map((uuid) => fromUuid(uuid)));

    bar.innerHTML = "";
    docs.forEach((doc, index) => {
        if (!doc) return;
        const uuid = pins[index];
        bar.appendChild(buildTab(doc, uuid));
    });
}

function buildTab(doc, uuid) {
    const tab = document.createElement("div");
    tab.classList.add("application", "minimized", "pin-this-tab");
    tab.title = game.i18n.format("PINTHIS.OpenPinned", { name: doc.name });

    const header = document.createElement("header");
    header.classList.add("window-header");
    header.addEventListener("click", () => doc.sheet?.render(true));

    const image = doc.img ?? doc.thumb ?? null;
    if (image) {
        const icon = document.createElement("img");
        icon.classList.add("pin-this-icon");
        icon.src = image;
        icon.alt = "";
        header.appendChild(icon);
    } else {
        const icon = document.createElement("i");
        icon.classList.add(
            "window-icon",
            "pin-this-icon",
            "fa-fw",
            "fa-solid",
            FALLBACK_ICONS[doc.documentName] ?? "fa-thumbtack",
        );
        header.appendChild(icon);
    }

    const title = document.createElement("h1");
    title.classList.add("window-title");
    title.textContent = doc.name;
    header.appendChild(title);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.classList.add("header-control", "icon", "fa-solid", "fa-xmark");
    remove.dataset.action = "close";
    remove.dataset.tooltip = game.i18n.localize("PINTHIS.Unpin");
    remove.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePin(uuid);
    });
    header.appendChild(remove);

    tab.appendChild(header);
    return tab;
}
