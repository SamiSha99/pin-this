import { MODULE_ID, PINNABLE_TYPES, DRAGGABLE_DOCUMENT_TYPES } from "./consts.js";
import { registerSettings, announceVersion } from "./settings.js";
import {
    packPin,
    injectPinBar,
    renderPinBar,
    togglePin,
    addHeaderPinButton,
    refreshOnDelete,
    refreshOnPackDelete,
} from "./pin-bar.js";

Hooks.once("init", () => {
    console.log(`${MODULE_ID} | init`);
    registerSettings();
});

Hooks.once("ready", () => {
    console.log(`${MODULE_ID} | ready`);

    injectPinBar();
    renderPinBar();

    if (game.user.isGM) announceVersion();
});

function toggleEntry(getPin) {
    return {
        label: "PINTHIS.ContextToggle",
        icon: "fa-solid fa-thumbtack",
        onClick: (event, target) => {
            const pin = getPin(target);
            if (pin) togglePin(pin, event);
        },
    };
}

for (const type of PINNABLE_TYPES) {
    Hooks.on(`get${type}ContextOptions`, (application, menuItems) => {
        menuItems.push(
            toggleEntry((target) => {
                const entry = target.closest("[data-entry-id]");
                const id = entry?.dataset?.entryId ?? entry?.dataset?.documentId;
                if (!id) return null;
                const collection = application.collection;
                return collection?.getUuid?.(id) ?? collection?.get(id)?.uuid;
            }),
        );
    });
}

Hooks.on("getJournalEntryPageContextOptions", (application, menuItems) => {
    menuItems.push(
        toggleEntry((target) => application.document.pages.get(target.dataset.pageId)?.uuid),
    );
});

Hooks.on("getCompendiumContextOptions", (_application, menuItems) => {
    menuItems.push(toggleEntry((target) => target.dataset.pack && packPin(target.dataset.pack)));
});

for (const type of DRAGGABLE_DOCUMENT_TYPES) Hooks.on(`delete${type}`, refreshOnDelete);
Hooks.on("renderCompendiumDirectory", refreshOnPackDelete);

Hooks.on("renderApplicationV2", addHeaderPinButton);

