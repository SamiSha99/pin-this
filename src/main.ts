import "./styles.css";

Hooks.once("init", () => {
    console.log("My Module Template | Initializing");

    game.settings?.register("mySettings" as any, "myMod" as any, {
        name: "Example Setting",
        hint: "This is just an example",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
});

Hooks.once("ready", () => {
    console.log("My Module Template | Ready");
});
