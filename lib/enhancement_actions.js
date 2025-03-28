export const ENHANCEMENT_ACTIONS = [
    {
        id: "vjp-smartgun",
        name: "Smartgun",
        button_name: "Smartgun",
        skillMod: "0",
        group: "Enhancements actions",
        aimingIgnoreMod: 2,
        and_selector: [
            {
                selector_type: "item_value",
                selector_value: "flags.vjpmacros.smartlinkActive=1",
            },
            {
                selector_type: "actor_has_item",
                selector_value: "Smartlink"
            }
        ],

        defaultChecked: {
            selector_type: "item_value",
            selector_value: "flags.vjpmacros.smartlinkActive=1",
        }
    },
    {
        id: "vjp-snapfire",
        name: "Snapfire",
        button_name: "Snapfire",
        skillMod: "-2",
        group: "Enhancements actions",
        and_selector: [
            {
                selector_type: "item_value",
                selector_value: "system.additionalStats.hasSnapfire.value=1"
            },
            {
                not_selector: [
                    {
                        selector_type: "item_value",
                        selector_value: "flags.vjpmacros.bipodActive=1"
                    }
                ]
            }
        ],
        defaultChecked: {
            selector_type: "item_value",
            selector_value: "system.additionalStats.hasSnapfire.value=1"
        }
    },
    {
        id: "vjp-folded-stock",
        name: "Folded Stock",
        button_name: "Folded Stock",
        skillMod: "-1",
        group: "Enhancements actions",
        selector_type: "item_value",
        selector_value: "flags.vjpmacros.stockFolded=1",
        defaultChecked: "on"
    },
    {
        id: "vjp-cqb-optic",
        name: "CQB Optic",
        button_name: "CQB Optic",
        skillMod: "0",
        aimingIgnoreMod: 2,
        group: "Enhancements actions",
        and_selector: [
            {
                selector_type: "item_value",
                selector_value: "flags.vjpmacros.cqbOptic=1"
            },
            {
                or_selector: [
                    {
                        selector_type: "actor_value",
                        selector_value: "flags.vjpmacros.rangeCategory=1"
                    },
                    {
                        selector_type: "actor_value",
                        selector_value: "flags.vjpmacros.rangeCategory=2"
                    },
                ]
            },
        ],
        defaultChecked: {
            selector_type: "item_value",
            selector_value: "flags.vjpmacros.cqbOptic=1",
        }
    },
    {
        id: "vjp-scope-aim",
        name: "Scope Aim",
        button_name: "Scope Aim",
        skillMod: 2,
        aimingIgnoreMod: 6,
        group: "BRSW.AttackOption",
        and_selector: [
            {
                selector_type: "actor_has_effect",
                selector_value: "BRSW.Aiming",
            },
            {
                selector_type: "item_value",
                selector_value: "flags.vjpmacros.scope=1",
            }
        ],
        defaultChecked: {
            selector_type: "actor_has_effect",
            selector_value: "BRSW.Aiming",
        },
    },
]
