import { ThreeRenderer } from './three-renderer.js';

export class DisplayRenderer {
    constructor() {
        this.threeRenderer = new ThreeRenderer();
    }

    async render(image, config) {
        console.log(`Rendering ${config.name} using ${config.method}...`);

        switch (config.method) {
            case '2D_COMPOSITE':
                return this.render2DComposite(image, config);
            case 'THREE_JS_SHELL':
                return await this.threeRenderer.renderShell(image, config);
            case 'THREE_JS_FOLD':
                if (config.id === 'yoke-fold') {
                    return await this.threeRenderer.renderYokeFold(image, config);
                } else if (config.id === 'standard-fold') {
                    return await this.threeRenderer.renderStandardFold(image, config);
                } else {
                    throw new Error(`Unsupported fold type: ${config.id}`);
                }
            case 'THREE_JS_STACK':
                return await this.threeRenderer.renderStackFold(image, config);
            default:
                throw new Error(`Unsupported rendering method: ${config.method}`);
        }
    }

    async render2DComposite(image, config) {
        // Reference approach: Face-out is a a front-facing garment representation.
        // We maintain original proportions and center it on a standardized canvas.

        const OUTPUT_SIZE = 600;
        const PADDING = 40;

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');

        // Transparent background by default to support alpha transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to fit within padded area while preserving aspect ratio
        const maxWidth = OUTPUT_SIZE - (PADDING * 2);
        const maxHeight = OUTPUT_SIZE - (PADDING * 2);

        const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
        const w = image.width * scale;
        const h = image.height * scale;

        // Center the garment
        const x = (OUTPUT_SIZE - w) / 2;
        const y = (OUTPUT_SIZE - h) / 2;

        // Draw the garment
        ctx.drawImage(image.element, x, y, w, h);

        return {
            type: 'canvas',
            element: canvas,
            id: config.id,
            width: OUTPUT_SIZE,
            height: OUTPUT_SIZE
        };
    }

}
