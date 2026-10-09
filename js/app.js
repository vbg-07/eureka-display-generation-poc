import { ImageLoader } from './image-loader.js';
import { DisplayRegistry } from './display-registry.js';
import { DisplayRenderer } from './display-renderer.js';

class App {
    constructor() {
        this.loader = new ImageLoader();
        this.registry = new DisplayRegistry();
        this.renderer = new DisplayRenderer();

        this.state = {
            originalImage: null,
            selectedDisplayId: null,
            generatedAsset: null
        };

        this.initUI();
    }

    initUI() {
        // Elements
        this.uploadInput = document.getElementById('image-upload');
        this.displaySelector = document.getElementById('display-selector');
        this.generateBtn = document.getElementById('generate-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.originalPreview = document.getElementById('original-preview');
        this.generatedPreview = document.getElementById('generated-preview');
        this.imageInfo = document.getElementById('image-info');
        this.statusMessage = document.getElementById('status-message');

        // Initialize Registry
        this.registry.init().then(() => {
            this.populateDisplaySelector();
        });

        // Event Listeners
        this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
        this.displaySelector.addEventListener('change', (e) => {
            this.state.selectedDisplayId = e.target.value;
            this.updateButtons();
        });
        this.generateBtn.addEventListener('click', () => this.handleGenerate());
        this.exportBtn.addEventListener('click', () => this.handleExport());
        this.resetBtn.addEventListener('click', () => this.handleReset());
    }

    populateDisplaySelector() {
        const displays = this.registry.getDisplays();
        this.displaySelector.innerHTML = '<option value="">-- Select a Display Type --</option>';
        displays.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = `${d.name} (${d.category})`;
            this.displaySelector.appendChild(opt);
        });
    }

    async handleUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.showStatus('Loading image...', 'info');
        try {
            const image = await this.loader.loadImage(file);
            this.state.originalImage = image;

            // Display original
            this.originalPreview.innerHTML = '';
            const imgEl = new Image();
            imgEl.src = image.src;
            this.originalPreview.appendChild(imgEl);

            this.imageInfo.textContent = `${file.name} | ${image.width}x${image.height}px`;

            this.updateButtons();
            this.showStatus('Image loaded successfully', 'success');
        } catch (err) {
            this.showStatus(`Error loading image: ${err.message}`, 'error');
        }
    }

    updateButtons() {
        const hasImage = !!this.state.originalImage;
        const hasDisplay = !!this.state.selectedDisplayId;

        this.generateBtn.disabled = !(hasImage && hasDisplay);
    }

    async handleGenerate() {
        this.showStatus('Generating display...', 'info');
        this.generateBtn.disabled = true;

        try {
            const config = this.registry.getDisplayConfig(this.state.selectedDisplayId);
            const result = await this.renderer.render(this.state.originalImage, config);

            this.state.generatedAsset = result;

            // Display result
            this.generatedPreview.innerHTML = '';
            if (result.type === 'canvas') {
                this.generatedPreview.appendChild(result.element);
            } else if (result.type === 'image') {
                const imgEl = new Image();
                imgEl.src = result.src;
                this.generatedPreview.appendChild(imgEl);
            }

            this.exportBtn.disabled = false;
            this.showStatus('Generation complete', 'success');
        } catch (err) {
            this.showStatus(`Generation failed: ${err.message}`, 'error');
        } finally {
            this.updateButtons();
        }
    }

    handleExport() {
        if (!this.state.generatedAsset) return;

        const { element, src, id } = this.state.generatedAsset;
        const originalFilename = this.uploadInput.files[0]?.name || 'garment';
        const nameParts = originalFilename.split('.');
        const baseName = nameParts[0];
        const filename = `eureka_${baseName}_${id}.png`;

        let dataUrl;
        if (element instanceof HTMLCanvasElement) {
            dataUrl = element.toDataURL('image/png');
        } else {
            dataUrl = src;
        }

        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }


    handleReset() {
        this.state = { originalImage: null, selectedDisplayId: null, generatedAsset: null };
        this.uploadInput.value = '';
        this.displaySelector.value = '';
        this.originalPreview.innerHTML = '<p class="placeholder">Upload an image to begin</p>';
        this.generatedPreview.innerHTML = '<p class="placeholder">Select a display type and click generate</p>';
        this.imageInfo.textContent = '';
        this.updateButtons();
        this.exportBtn.disabled = true;
        this.showStatus('', 'hidden');
    }

    showStatus(msg, type) {
        this.statusMessage.textContent = msg;
        this.statusMessage.className = type === 'hidden' ? 'hidden' : `status-message ${type}`;
        if (type !== 'hidden') {
            this.statusMessage.classList.add('hidden'); // Wait a bit? No, just set it.
            // Actually just set it.
            this.statusMessage.className = `status-message ${type}`;
            this.statusMessage.classList.remove('hidden');
        } else {
            this.statusMessage.classList.add('hidden');
        }
    }
}

new App();
