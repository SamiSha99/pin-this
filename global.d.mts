declare global {
    // not a real extension of course but simplest way for this to work with the intellisense.
    class Hooks extends foundry.helpers.Hooks {}
    const fromUuid = foundry.utils.fromUuid;
    const fromUuidSync = foundry.utils.fromUuidSync;
}

export {};
