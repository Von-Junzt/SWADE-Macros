export const enhancementActions = [
    {
        id: "vjp-smartgun",
        name: "Smartgun",
        button_name: "Smartgun",
        skillMod: "0",
        group: "Enhancements actions",
        aimingIgnoreMod: 2,
        selector_type: "item_value",
        selector_value: "flags.vjpmacros.smartgun=1",
        defaultChecked: {
            selector_type: "item_value",
            selector_value: "flags.vjpmacros.smartgun=1",
        }
    },
    {
        id: "vjp-bipod",
        name: "Bipod",
        button_name: "Bipod",
        skillMod: "0",
        group: "Enhancements actions",
        selector_type: "item_value",
        selector_value: "flags.vjpmacros.bipod=1",
        defaultChecked: {
            selector_type: "item_value",
            selector_value: "flags.vjpmacros.bipod=1",
        }
    }
]