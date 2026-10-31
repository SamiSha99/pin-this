import { MODULE_ID, registerSettings, announceVersion } from "./settings.js";
import {
    PINNABLE_TYPES,
    DRAGGABLE_DOCUMENT_TYPES,
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
    // ui.notifications.info(game.i18n.localize("PINTHIS.Ready"));

    injectPinBar();
    renderPinBar();

    if (game.user.isGM) announceVersion();
});

for (const type of PINNABLE_TYPES) {
    Hooks.on(`get${type}ContextOptions`, (_application, menuItems) => {
        menuItems.push({
            label: "PINTHIS.ContextToggle",
            icon: "fa-solid fa-thumbtack",
            onClick: (event, target) => {
                const entry = target.closest("[data-entry-id]");
                const id = entry?.dataset?.entryId ?? entry?.dataset?.documentId;
                const doc = game.collections.get(type)?.get(id);
                if (doc) togglePin(doc.uuid, event);
            },
        });
    });
}

for (const type of DRAGGABLE_DOCUMENT_TYPES) Hooks.on(`delete${type}`, refreshOnDelete);
Hooks.on("renderCompendiumDirectory", refreshOnPackDelete);

Hooks.on("renderApplicationV2", addHeaderPinButton);
