import { MODULE_ID, registerSettings, announceVersion } from "./settings.js";
import {
    PINNABLE_TYPES,
    injectPinBar,
    renderPinBar,
    togglePin,
    addHeaderPinButton,
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
            name: "PINTHIS.ContextToggle",
            icon: '<i class="fas fa-thumbtack"></i>',
            callback: (target, event) => {
                const entry = target.closest("[data-entry-id]");
                const id = entry?.dataset?.entryId ?? entry?.dataset?.documentId;
                const doc = game.collections.get(type)?.get(id);
                if (doc) togglePin(doc.uuid, event);
            },
        });
    });
}

Hooks.on("renderApplicationV2", addHeaderPinButton);
