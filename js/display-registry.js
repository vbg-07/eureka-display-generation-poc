export class DisplayRegistry {
    constructor() {
        this.displays = [];
        this.fallbackDisplays = [
            {
                "id": "face-out",
                "name": "Face-out",
                "category": "General",
                "method": "2D_COMPOSITE",
                "description": "Front-facing garment, basic crop and normalization."
            },
            {
                "id": "spine",
                "name": "Side / Spine-hung",
                "category": "General",
                "method": "THREE_JS_SHELL",
                "description": "Garment mapped to a lens-shaped 3D shell."
            },
            {
                "id": "yoke-fold",
                "name": "Yoke-fold",
                "category": "Ethnic",
                "method": "THREE_JS_FOLD",
                "description": "Garment wrapped over a soft 3D yoke fold geometry."
            },
            {
                "id": "standard-fold",
                "name": "Standard Fold",
                "category": "General",
                "method": "THREE_JS_FOLD",
                "description": "Conventional compact folded garment presentation."
            },
            {
                "id": "stack-fold",
                "name": "Stacked Garments",
                "category": "General",
                "method": "THREE_JS_STACK",
                "count": 5,
                "description": "A neatly folded stack of multiple garments."
            }
        ];
    }

    async init() {
        try {
            const response = await fetch('config/display-types.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.displays = await response.json();
            console.log('Display types loaded from config file.');
        } catch (err) {
            console.warn('Failed to load display types from config file, using fallback.', err);
            this.displays = this.fallbackDisplays;
        }
    }

    getDisplays() {
        return this.displays;
    }

    getDisplayConfig(id) {
        const config = this.displays.find(d => d.id === id);
        if (!config) throw new Error(`Display type ${id} not found in registry`);
        return config;
    }
}

