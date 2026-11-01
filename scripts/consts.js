export const MODULE_ID = "pin-this";
export const PIN_SETTING = "pins";
export const TAB_STYLE_SETTING = "tabStyle";
export const TAB_STYLE_ICON = "icon";
export const TAB_STYLE_SPINE = "spine";
export const VERSION_SETTING = "lastSeenVersion";

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

export const DRAGGABLE_DOCUMENT_TYPES = [...PINNABLE_TYPES, "JournalEntryPage"];

export const REORDER_MIME = "application/x-pin-this-uuid";
export const ICON_COLUMNS = 3;
export const PACK_PIN_PREFIX = "Compendium:";
export const HEADER_PIN_ACTION = "pin-this.togglePin";

export const FALLBACK_ICONS = {
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
export const PACK_FALLBACK_ICON = "fa-atlas";
