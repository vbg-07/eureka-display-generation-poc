// asset-export.js
// Logic for high-res export will be handled in DisplayRenderer
// but specialized export helpers can be placed here.
export const AssetExport = {
    downloadPNG: (canvas, filename) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
};
