export const MODULE_ID = "pin-this";
export const PIN_SETTING = "pins";
export const TAB_STYLE_SETTING = "tabStyle";
export const TAB_STYLE_ICON = "icon";
export const TAB_STYLE_SPINE = "spine";
const VERSION_SETTING = "lastSeenVersion";

export function registerSettings() {
    game.settings.register(MODULE_ID, PIN_SETTING, {
        scope: "client",
        config: false,
        type: Array,
        default: [],
    });

    game.settings.register(MODULE_ID, TAB_STYLE_SETTING, {
        name: "PINTHIS.SettingTabStyleName",
        hint: "PINTHIS.SettingTabStyleHint",
        scope: "client",
        config: true,
        type: String,
        choices: {
            [TAB_STYLE_ICON]: "PINTHIS.SettingTabStyleIcon",
            [TAB_STYLE_SPINE]: "PINTHIS.SettingTabStyleSpine",
        },
        default: TAB_STYLE_ICON,
        requiresReload: true,
    });

    game.settings.register(MODULE_ID, VERSION_SETTING, {
        scope: "world",
        config: false,
        type: String,
        default: "",
    });
}

export async function announceVersion() {
    const current = game.modules.get(MODULE_ID).version;
    const lastSeen = game.settings.get(MODULE_ID, VERSION_SETTING);
    if (lastSeen === current) return;

    const key = lastSeen ? "PINTHIS.UpdatedMessage" : "PINTHIS.InstalledMessage";
    await ChatMessage.create({
        content: game.i18n.format(key, { version: current }),
        whisper: ChatMessage.getWhisperRecipients("GM"),
    });

    await game.settings.set(MODULE_ID, VERSION_SETTING, current);
}
