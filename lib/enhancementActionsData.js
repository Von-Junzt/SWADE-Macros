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
        id: "vjp-snapfire",
        name: "Snapfire",
        button_name: "Snapfire",
        skillMod: "-2",
        group: "Enhancements actions",
        aimingIgnoreMod: 2,
        and_selector: [
            {
                selector_type: "item_value", selector_value: "system.additionalStats.hasSnapfire.value=1"
            },
            {
                not_selector: [
                    {
                        selector_type: "actor_has_effect",
                        selector_value: "Bipod unfolded"
                    }
                ]
            }
        ],
        defaultChecked: {
            selector_type: "item_value", selector_value: "system.additionalStats.hasSnapfire.value=1"
        }
    }
]