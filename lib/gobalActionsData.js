export const globalActions = [
    // Overwrite all brsw cover actions so we can add them automatically
    {
        id: "1-LightCover",
        name: "Light Cover",
        button_name: "Light Cover",
        skillMod: "-2",
        group: "BRSW.Cover",
        group_single: true,
        aiming_ignores: true,
        replaceExisting: true,
        or_selector: [
            {
                selector_type: "item_type",
                selector_value: "power",
            },
            {
                selector_type: "item_type",
                selector_value: "weapon",
            },
        ],
        defaultChecked: {
            selector_type: "actor_has_effect",
            selector_value: "Light Cover",
        },
    },
    {
        id: "2-MediumCover",
        name: "Medium Cover",
        button_name: "Medium Cover",
        skillMod: "-4",
        group: "BRSW.Cover",
        group_single: true,
        aiming_ignores: true,
        replaceExisting: true,
        or_selector: [
            {
                selector_type: "item_type",
                selector_value: "power",
            },
            {
                selector_type: "item_type",
                selector_value: "weapon",
            },
        ],
        defaultChecked: {
            selector_type: "actor_has_effect",
            selector_value: "Medium Cover",
        },
    },
    {
        id: "3-HeavyCover",
        name: "Heavy Cover",
        button_name: "Heavy Cover",
        skillMod: "-6",
        group: "BRSW.Cover",
        group_single: true,
        aiming_ignores: true,
        replaceExisting: true,
        or_selector: [
            {
                selector_type: "item_type",
                selector_value: "power",
            },
            {
                selector_type: "item_type",
                selector_value: "weapon",
            },
        ],
        defaultChecked: {
            selector_type: "actor_has_effect",
            selector_value: "Heavy Cover",
        },
    },
    {
        id: "4-NearTotalCover",
        name: "Near Total Cover",
        button_name: "Near Total Cover",
        skillMod: "-8",
        group: "BRSW.Cover",
        group_single: true,
        aiming_ignores: true,
        replaceExisting: true,
        or_selector: [
            {
                selector_type: "item_type",
                selector_value: "power",
            },
            {
                selector_type: "item_type",
                selector_value: "weapon",
            },
        ],
        defaultChecked: {
            selector_type: "actor_has_effect",
            selector_value: "Near Total Cover",
        },
    },
    {
        id: "vjp-prone",
        name: "Target Prone",
        button_name: "Target Prone",
        skillMod: "-4",
        group: "BRSW.Cover",
        aiming_ignores: true,
        selector_type: "target_has_effect",
        selector_value: "Prone",
        defaultChecked: {
            selector_type: "target_has_effect",
            selector_value: "Prone",
        }
    },
    {
        id: "AIM",
        name: "BRSW.Aiming",
        button_name: "BRSW.Aiming",
        skillMod: 2,
        aimingIgnoreMod: 4,
        selector_type: "skill",
        selector_value: "BRSW.Shooting",
        group: "BRSW.AttackOption",
        replaceExisting: true,
        and_selector: [
            {
                selector_type: "actor_has_effect",
                selector_value: "BRSW.Aiming",
            },
            {
                not_selector: [
                    {
                        selector_type: "item_value",
                        selector_value: "flags.vjpmacros.scope=1",
                    }
                ]
            }
        ],
        defaultChecked: {
            selector_type: "actor_has_effect",
            selector_value: "BRSW.Aiming",
        },
    }
];
