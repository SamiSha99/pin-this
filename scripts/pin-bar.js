import { MODULE_ID, PIN_SETTING, TAB_STYLE_SETTING, TAB_STYLE_ICON } from "./settings.js";

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

const DRAGGABLE_DOCUMENT_TYPES = [...PINNABLE_TYPES, "JournalEntryPage"];

const REORDER_MIME = "application/x-pin-this-uuid";
const PACK_PIN_PREFIX = "Compendium:";
const HEADER_PIN_ACTION = "pin-this.togglePin";

const FALLBACK_ICONS = {
    Actor: "fa-user",
    Item: "fa-suitcase",
    JournalEntry: "fa-book-open",
    JournalEntryPage: "fa-file-lines",
    Scene: "fa-map",
    RollTable: "fa-dice",
    Macro: "fa-terminal",
    Playlist: "fa-music",
    Cards: "fa-layer-group",
};
const PACK_FALLBACK_ICON = "fa-atlas";

function isPackPin(pin) {
    return pin.startsWith(PACK_PIN_PREFIX);
}

function packPin(collection) {
    return `${PACK_PIN_PREFIX}${collection}`;
}

function openDocument(doc) {
    if (doc.documentName === "JournalEntryPage")
        return doc.parent?.sheet?.render(true, { pageId: doc.id });
    return doc.sheet?.render(true);
}

async function resolvePinnable(pin) {
    if (isPackPin(pin)) {
        const pack = game.packs.get(pin.slice(PACK_PIN_PREFIX.length));
        if (!pack) return null;
        return {
            name: pack.title,
            img: null,
            fallbackIcon: PACK_FALLBACK_ICON,
            open: () => pack.render(true),
        };
    }

    const doc = await fromUuid(pin);
    if (!doc) return null;
    return {
        name: doc.name,
        img: doc.img ?? doc.thumb ?? null,
        fallbackIcon: FALLBACK_ICONS[doc.documentName] ?? "fa-thumbtack",
        documentName: doc.documentName,
        open: () => openDocument(doc),
    };
}

let draggedDocName = null;

function openShelf() {
    document.getElementById("pin-this-bar")?.classList.add("open");
}

function closeShelf() {
    document.getElementById("pin-this-bar")?.classList.remove("open");
}

export function injectPinBar() {
    const parent = document.getElementById("interface");
    if (!parent || document.getElementById("pin-this-bar")) return;

    const hotzone = document.createElement("div");
    hotzone.id = "pin-this-hotzone";

    const bar = document.createElement("div");
    bar.id = "pin-this-bar";
    bar.classList.add(`style-${game.settings.get(MODULE_ID, TAB_STYLE_SETTING)}`);

    for (const el of [hotzone, bar]) {
        el.addEventListener("dragenter", onDragEnter);
        el.addEventListener("dragover", onDragOver);
        el.addEventListener("dragleave", onDragLeave);
        el.addEventListener("drop", onDrop);

        el.addEventListener("mouseenter", openShelf);
        el.addEventListener("mouseleave", closeShelf);
    }

    document.addEventListener("dragstart", onForeignDragStart);
    document.addEventListener("dragend", onForeignDragEnd);

    parent.appendChild(hotzone);
    parent.appendChild(bar);
}

function onForeignDragStart(event) {
    draggedDocName = null;
    let data;
    try {
        data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
        return;
    }

    if (data?.type === "Compendium" && data.collection) {
        draggedDocName = game.packs.get(data.collection)?.title ?? null;
        return;
    }
    if (!data?.uuid) return;

    const doc = fromUuidSync(data.uuid);
    if (doc && DRAGGABLE_DOCUMENT_TYPES.includes(doc.documentName)) draggedDocName = doc.name;
}

function onForeignDragEnd() {
    draggedDocName = null;
    hideDragLabel();
    document.getElementById("pin-this-bar")?.classList.remove("drag-target");
}

function showDragLabel(bar) {
    let label = document.getElementById("pin-this-drag-label");
    if (!label) {
        label = document.createElement("div");
        label.id = "pin-this-drag-label";
        bar.appendChild(label);
    }
    label.textContent = draggedDocName
        ? game.i18n.format("PINTHIS.AddToShelf", { name: draggedDocName })
        : game.i18n.localize("PINTHIS.DropToShelf");
}

function hideDragLabel() {
    document.getElementById("pin-this-drag-label")?.remove();
}

function onDragEnter(event) {
    if (event.dataTransfer.types.includes(REORDER_MIME)) return; // tab reorder, not a new pin
    event.preventDefault();

    const bar = document.getElementById("pin-this-bar");
    if (!bar) return;
    bar.classList.add("drag-target");
    showDragLabel(bar);
}

function onDragOver(event) {
    if (event.dataTransfer.types.includes(REORDER_MIME)) return; // tab reorder, not a new pin
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
}

function onDragLeave(event) {
    if (event.dataTransfer.types.includes(REORDER_MIME)) return; // tab reorder, not a new pin

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
    bar?.classList.remove("drag-target");
    hideDragLabel();
}

async function onDrop(event) {
    if (event.dataTransfer.types.includes(REORDER_MIME)) return; // tab reorder, not a new pin
    event.preventDefault();
    document.getElementById("pin-this-bar")?.classList.remove("drag-target");
    hideDragLabel();

    let data;
    try {
        data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
        return;
    }

    if (data?.type === "Compendium" && data.collection) {
        if (!game.packs.get(data.collection)) return;
        await addPin(packPin(data.collection));
        return;
    }
    if (!data?.uuid) return;

    const doc = await fromUuid(data.uuid);
    if (!doc || !DRAGGABLE_DOCUMENT_TYPES.includes(doc.documentName)) return;

    await addPin(doc.uuid);
}

async function setPins(next) {
    await game.settings.set(MODULE_ID, PIN_SETTING, next);
    renderPinBar();
    refreshHeaderPinButtons();
}

async function addPin(uuid) {
    const pins = game.settings.get(MODULE_ID, PIN_SETTING);
    if (pins.includes(uuid)) return;
    await setPins([...pins, uuid]);
}

async function confirmUnpin(event) {
    if (event?.shiftKey) return true;
    return foundry.applications.api.DialogV2.confirm({
        window: { title: "PINTHIS.UnpinTitle", icon: "fa-solid fa-thumbtack" },
        content: `<p>${game.i18n.localize("PINTHIS.UnpinConfirm")}</p>
            <p class="notification info"><strong>${game.i18n.localize("PINTHIS.UnpinShiftTip")}</strong></p>`,
        rejectClose: false,
        modal: true,
    });
}

export async function togglePin(uuid, event) {
    if (!game.settings.get(MODULE_ID, PIN_SETTING).includes(uuid)) return addPin(uuid);
    if (!(await confirmUnpin(event))) return;

    // the pins may have changed while the dialog was open
    const pins = game.settings.get(MODULE_ID, PIN_SETTING);
    await setPins(pins.filter((u) => u !== uuid));
}

export async function renderPinBar() {
    const bar = document.getElementById("pin-this-bar");
    if (!bar) return;

    const pins = game.settings.get(MODULE_ID, PIN_SETTING);
    const entries = await Promise.all(pins.map(resolvePinnable));

    bar.innerHTML = "";
    entries.forEach((entry, index) => {
        if (!entry) return;
        const uuid = pins[index];
        bar.appendChild(buildTab(entry, uuid));
    });
}

function buildTab(entry, uuid) {
    const tab = document.createElement("div");
    tab.classList.add("application", "minimized", "tab");
    tab.draggable = true;
    tab.dataset.uuid = uuid;
    if (entry.documentName) tab.dataset.documentName = entry.documentName;

    if (game.settings.get(MODULE_ID, TAB_STYLE_SETTING) === TAB_STYLE_ICON) {
        tab.dataset.tooltip = entry.name;
        tab.dataset.tooltipDirection = "DOWN";
        tab.dataset.tooltipClass = "pin-this-tooltip";
    } else {
        tab.title = game.i18n.format("PINTHIS.OpenPinned", { name: entry.name });
    }

    const header = document.createElement("header");
    header.classList.add("window-header");
    header.addEventListener("click", () => entry.open());

    if (entry.img) {
        const icon = document.createElement("img");
        icon.classList.add("thumb");
        icon.src = entry.img;
        icon.alt = "";
        icon.draggable = false;
        header.appendChild(icon);
    } else {
        const icon = document.createElement("i");
        icon.classList.add("window-icon", "thumb", "fa-fw", "fa-solid", entry.fallbackIcon);
        header.appendChild(icon);
    }

    const title = document.createElement("h1");
    title.classList.add("window-title");
    title.textContent = entry.name;
    header.appendChild(title);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.classList.add("header-control", "icon", "fa-solid", "fa-xmark");
    remove.dataset.action = "close";
    remove.dataset.tooltip = game.i18n.localize("PINTHIS.Unpin");
    remove.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePin(uuid, event);
    });
    header.appendChild(remove);

    tab.appendChild(header);
    tab.addEventListener("dragstart", onTabDragStart);
    tab.addEventListener("dragend", onTabDragEnd);
    tab.addEventListener("dragenter", onDragTabEnter);
    tab.addEventListener("dragover", onDragTabOver);
    tab.addEventListener("drop", onTabDrop);
    return tab;
}

function onTabDragStart(event) {
    const tab = event.currentTarget;
    const { uuid, documentName } = tab.dataset;

    event.dataTransfer.setData(REORDER_MIME, uuid);
    if (documentName)
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: documentName, uuid }));

    // delay before using this idk i hate this
    setTimeout(() => tab.classList.add("dragging"), 0);
}

function onTabDragEnd(event) {
    const tab = event.currentTarget;
    tab.classList.remove("dragging");

    if (event.dataTransfer.dropEffect === "none") {
        renderPinBar(); // cancelled, or dropped somewhere invalid: discard the live reorder
        return;
    }

    const next = [...tab.parentElement.children].map((el) => el.dataset.uuid);
    setPins(next);
}

function onDragTabEnter(event) {
    if (!event.dataTransfer.types.includes(REORDER_MIME)) return; // not a tab reorder, let it bubble
    event.preventDefault();
    event.stopPropagation();
}

function onDragTabOver(event) {
    if (!event.dataTransfer.types.includes(REORDER_MIME)) return; // not a tab reorder, let it bubble
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";

    const target = event.currentTarget;
    const dragged = target.parentElement.querySelector(".dragging");
    if (!dragged || dragged === target) return;

    const rect = target.getBoundingClientRect();
    const before = event.clientX < rect.left + rect.width / 2;
    target.parentElement.insertBefore(dragged, before ? target : target.nextSibling);
}

function onTabDrop(event) {
    if (!event.dataTransfer.types.includes(REORDER_MIME)) return; // not a tab reorder, let it bubble
    event.preventDefault();
    event.stopPropagation();
}

function getAppPin(app) {
    if (app instanceof foundry.applications.sidebar.apps.Compendium)
        return packPin(app.collection.collection);
    if (!(app instanceof foundry.applications.api.DocumentSheetV2)) return null;

    const doc = app.document;
    if (!doc?.id || !DRAGGABLE_DOCUMENT_TYPES.includes(doc.documentName)) return null;
    if (doc.sheet !== app) return null; // ownership, sheet config, etc. also carry a document
    return doc.uuid;
}

export function addHeaderPinButton(app, _element, _context, options) {
    if (!options.isFirstRender || !app.hasFrame) return; // only built once
    const pin = getAppPin(app);
    if (!pin) return;

    app.options.actions[HEADER_PIN_ACTION] = (event) => togglePin(pin, event);

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("header-control", "icon", "fa-solid", "fa-thumbtack", "pin-this-toggle");
    button.dataset.action = HEADER_PIN_ACTION;
    button.dataset.tooltip = "";
    button.dataset.pin = pin;
    updateHeaderPinButton(button, game.settings.get(MODULE_ID, PIN_SETTING).includes(pin));
    app.window.close.before(button);
}

function updateHeaderPinButton(button, pinned) {
    button.classList.toggle("active", pinned);
    button.ariaPressed = String(pinned);
    button.ariaLabel = game.i18n.localize(pinned ? "PINTHIS.Unpin" : "PINTHIS.PinToShelf");
}

function refreshHeaderPinButtons() {
    const pins = game.settings.get(MODULE_ID, PIN_SETTING);
    for (const app of foundry.applications.instances.values()) {
        const button = app.window?.header?.querySelector(".pin-this-toggle");
        if (button) updateHeaderPinButton(button, pins.includes(button.dataset.pin));
    }
}
