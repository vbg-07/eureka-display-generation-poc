export class ImageLoader {
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve({
                    src: img.src,
                    width: img.width,
                    height: img.height,
                    element: img
                });
                img.onerror = () => reject(new Error('Failed to decode image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
}
