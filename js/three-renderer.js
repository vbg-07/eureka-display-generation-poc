import * as THREE from 'https://unpkg.com/three@0.170.0/build/three.module.js';

export class ThreeRenderer {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.camera = null;
    }

    async init() {
        if (this.renderer) return;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true
        });
        this.renderer.setSize(600, 600);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.scene = new THREE.Scene();

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        const d = 40;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.bias = -0.001;
        this.scene.add(dirLight);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.camera.position.set(0, 0, 120);
        this.camera.lookAt(0, 0, 0);
    }

    cropImage(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image.element, 0, 0, image.width, image.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
        
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const alpha = imgData[(y * canvas.width + x) * 4 + 3];
                if (alpha > 20) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        
        if (minX > maxX) {
            minX = 0; maxX = canvas.width - 1; minY = 0; maxY = canvas.height - 1;
        }
        
        const cropW = maxX - minX + 1;
        const cropH = Math.max(1, maxY - minY + 1);
        
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        
        return { element: cropCanvas, width: cropW, height: cropH };
    }

    async renderShell(image, config) {
        await this.init();

        console.log('ThreeRenderer: Starting renderShell - Single Side/Spine-hung Garment');

        // Clear previous meshes, keep lights (children at index 0 and 1 are lights added in init)
        const meshes = this.scene.children.filter(c => c.type === 'Mesh' || c.type === 'Group');
        meshes.forEach(m => this.scene.remove(m));

        // Tightly crop the garment to ensure the geometry bow accurately follows the silhouette edges
        const cropped = this.cropImage(image);

        const texture = new THREE.CanvasTexture(cropped.element);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = true;
        texture.needsUpdate = true;

        const aspect = cropped.width / cropped.height;
        const L = 60; // Base height
        const W = L * aspect;

        const group = new THREE.Group();
        const thick = 5; // Matches typical reference garment thickness

        // Front geometry mapping matching reference axes: Z=width, X=thickness, Y=height
        const geoFront = new THREE.PlaneGeometry(W, L, 32, 32);
        const posFront = geoFront.attributes.position;
        for (let i = 0; i < posFront.count; i++) {
            const origX = posFront.getX(i);
            const origY = posFront.getY(i);
            const u = (origX / W) + 0.5;
            const v = -(origY / L) + 0.5;
            const e = Math.max(0, 1 - Math.pow(2 * (u - 0.5), 2));
            const prof = 0.75 + 0.25 * Math.cos(v * Math.PI * 1.6);
            
            const x = (thick / 2) * Math.sqrt(e) * prof;
            const y = origY;
            const z = (W / 2) - (u * W);
            posFront.setXYZ(i, x, y, z);
        }
        geoFront.computeVertexNormals();

        // Back geometry
        const geoBack = new THREE.PlaneGeometry(W, L, 32, 32);
        const posBack = geoBack.attributes.position;
        for (let i = 0; i < posBack.count; i++) {
            const origX = posBack.getX(i);
            const origY = posBack.getY(i);
            const u = (origX / W) + 0.5;
            const v = -(origY / L) + 0.5;
            const e = Math.max(0, 1 - Math.pow(2 * (u - 0.5), 2));
            const prof = 0.75 + 0.25 * Math.cos(v * Math.PI * 1.6);
            
            const x = -(thick / 2) * Math.sqrt(e) * prof;
            const y = origY;
            const z = (W / 2) - (u * W);
            posBack.setXYZ(i, x, y, z);
        }
        geoBack.computeVertexNormals();

        const materialFront = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
            transparent: true,
            alphaTest: 0.1
        });
        const materialBack = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            transparent: true,
            alphaTest: 0.1
        });

        const meshFront = new THREE.Mesh(geoFront, materialFront);
        const meshBack = new THREE.Mesh(geoBack, materialBack);
        
        group.add(meshFront);
        group.add(meshBack);

        // Exact reference spineRail rotation: -11 degrees shows a sliver of the front face alongside the profile
        group.rotation.y = THREE.MathUtils.degToRad(-11);
        group.position.set(0, 0, 0);
        this.scene.add(group);

        // Fit camera tightly to actual bounding box (with 15% padding)
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const fovRad = THREE.MathUtils.degToRad(45);
        const fitDistance = (size.y * 1.15) / (2 * Math.tan(fovRad / 2));
        
        // Exact reference spineRail camera elevation: 6 degrees, azimuth 0
        const elevRad = THREE.MathUtils.degToRad(6);
        const camY = center.y + fitDistance * Math.sin(elevRad);
        const camZ = center.z + fitDistance * Math.cos(elevRad);

        this.camera.position.set(center.x, camY, camZ);
        this.camera.lookAt(center);

        this.renderer.render(this.scene, this.camera);

        return {
            type: 'canvas',
            element: this.renderer.domElement,
            id: config.id,
            width: 600,
            height: 600
        };
    }

    getAverageColor(ctx, width, height) {
        const imgData = ctx.getImageData(0, 0, width, height).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < imgData.length; i += 4) {
            if (imgData[i + 3] > 20) {
                r += imgData[i];
                g += imgData[i + 1];
                b += imgData[i + 2];
                count++;
            }
        }
        if (count === 0) return 'rgba(255,255,255,1)';
        return `rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`;
    }

    createFoldGeometry(w, d, t, uvOf, puff) {
        const rho = t / 2, a = Math.PI * rho;
        const nx = 64, nz = 64;
        const S = w / 2 + a, Z = d / 2 + a;
        const pos = [], uv = [], idx = [];
        
        const warp = (f, flat, total) => {
            const g = f * 2 - 1;
            const k = flat / total;
            const ag = Math.abs(g);
            const v = ag < 0.6 ? (ag / 0.6) * k : k + ((ag - 0.6) / 0.4) * (1 - k);
            return Math.sign(g) * v * total;
        };

        for (let j = 0; j <= nz; j++) {
            for (let i = 0; i <= nx; i++) {
                const s = warp(i / nx, w / 2, S);
                const r = warp(j / nz, d / 2, Z);
                const ex = Math.max(0, Math.abs(s) - w / 2);
                const ez = Math.max(0, Math.abs(r) - d / 2);
                const px_ = ex / rho, pz_ = ez / rho;
                const phi = Math.min(Math.PI, Math.hypot(px_, pz_));
                
                let x = s, z = r, y = t;
                
                if (phi > 0) {
                    const hyp = Math.hypot(px_, pz_);
                    const dx = hyp > 0 ? px_ / hyp : 0;
                    const dz = hyp > 0 ? pz_ / hyp : 0;
                    
                    if (ex > 0) x = Math.sign(s) * (w / 2 + rho * Math.sin(phi) * dx);
                    if (ez > 0) z = Math.sign(r) * (d / 2 + Math.sin(phi) * rho * dz); // Note: Reference has rho * Math.sin(phi) * dz
                    y = rho + rho * Math.cos(phi);
                    
                    const bul = Math.sin(phi) * rho * 0.12;
                    if (ex > 0) x += Math.sign(s) * bul * dx;
                    if (ez > 0) z += Math.sign(r) * bul * dz;
                } else {
                    const fx = (2 * s) / w, fz = (2 * r) / d;
                    y += puff * (1 - fx * fx) * (1 - fz * fz) + t * 0.025 * Math.sin(s * 0.55 + r * 0.21) * Math.sin(r * 0.37);
                }
                
                if (ez > 0 && r > 0) y += Math.sin(s * 1.1) * rho * 0.05 * Math.sin(Math.min(phi, Math.PI));
                
                pos.push(x, y, z);
                
                const [u, v] = uvOf(s, r);
                uv.push(u, v);
            }
        }

        for (let j = 0; j < nz; j++) {
            for (let i = 0; i < nx; i++) {
                const a0 = j * (nx + 1) + i;
                const b0 = a0 + 1;
                const c0 = a0 + nx + 1;
                const d0 = c0 + 1;
                idx.push(a0, c0, b0, b0, c0, d0);
            }
        }

        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        g.computeVertexNormals();
        return g;
    }

    async renderYokeFold(image, config) {
        return this.renderFoldBase(image, config, 'yoke', 1);
    }

    async renderStandardFold(image, config) {
        return this.renderFoldBase(image, config, 'standard', 1);
    }

    async renderStackFold(image, config) {
        const count = config.count || 5;
        return this.renderFoldBase(image, config, 'standard', count);
    }

    async renderFoldBase(image, config, foldType, count = 1) {
        await this.init();

        console.log(`ThreeRenderer: Starting renderFoldBase - ${foldType}`);

        const meshes = this.scene.children.filter(c => c.type === 'Mesh' || c.type === 'Group');
        meshes.forEach(m => this.scene.remove(m));

        const cropped = this.cropImage(image);
        const cropCtx = cropped.element.getContext('2d');
        const avgColor = this.getAverageColor(cropCtx, cropped.width, cropped.height);

        // Assume garment width is ~50cm for scaling
        const ppc = cropped.width / 50;
        
        let fw, fd, ft;
        if (foldType === 'yoke') {
            fw = 30; fd = 35; ft = 3;
        } else {
            // standard (board style)
            fw = 30.5; fd = 31.8; ft = 2.6;
        }

        const box = {
            x: (cropped.width - fw * ppc) / 2,
            y: 0,
            w: fw * ppc,
            h: fd * ppc
        };

        const padPx = Math.round((Math.PI * ft / 2 + 4) * ppc);
        const padW = cropped.width + padPx * 2;
        const padH = cropped.height + padPx * 2;
        
        const padCanvas = document.createElement('canvas');
        padCanvas.width = padW;
        padCanvas.height = padH;
        const padCtx = padCanvas.getContext('2d');
        
        padCtx.fillStyle = avgColor;
        padCtx.fillRect(0, 0, padW, padH);
        
        padCtx.drawImage(cropped.element, padPx, padPx);

        // Mask out the back of the neck so the folded back corners wrap nicely
        const shoulderY = 0.05 * cropped.height;
        if (foldType === 'yoke' || foldType === 'standard') {
            const m2 = document.createElement('canvas');
            m2.width = padW; m2.height = padH;
            const yCtx = m2.getContext('2d');
            const cut = padPx + Math.round(shoulderY);
            yCtx.fillStyle = "#000"; yCtx.fillRect(0, cut, padW, padH - cut);
            yCtx.save();
            yCtx.beginPath();
            yCtx.rect(0, 0, padW, cut);
            yCtx.clip();
            yCtx.drawImage(cropped.element, padPx, padPx);
            yCtx.restore();

            padCtx.globalCompositeOperation = "destination-in";
            padCtx.drawImage(m2, 0, 0);
            padCtx.globalCompositeOperation = "source-over";
        }

        const texture = new THREE.CanvasTexture(padCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;

        const uvOf = (s, r) => [
            (padPx + box.x + (s + fw / 2) * ppc) / padW,
            (padPx + box.y + (r + fd / 2) * (box.h / fd)) / padH
        ];

        const puff = ft * 0.22;
        const geo = this.createFoldGeometry(fw, fd, ft, uvOf, puff);

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.FrontSide,
            transparent: true,
            alphaTest: 0.1,
            roughness: 0.9
        });

        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const group = new THREE.Group();

        let seed = 12345;
        const rnd = () => {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };

        const spacingY = config.spacingY !== undefined ? config.spacingY : ft * 0.93;

        for (let k = 0; k < count; k++) {
            const m = k === 0 ? mesh : mesh.clone();
            
            m.position.set((rnd() - 0.5) * 0.7, k * spacingY, (rnd() - 0.5) * 0.6);
            m.rotation.y = (rnd() - 0.5) * 0.035;
            group.add(m);
        }

        // Center the entire stack vertically at the origin for the camera
        const stackHeight = (count - 1) * spacingY;
        group.position.y = -stackHeight / 2;

        this.scene.add(group);

        const boundingBox = new THREE.Box3().setFromObject(group);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        const fovRad = THREE.MathUtils.degToRad(45);
        const fitDistance = size.length() * 1.4;
        
        // elev: 34, azim: -14
        const el = THREE.MathUtils.degToRad(34);
        const az = THREE.MathUtils.degToRad(-14);
        const dir = new THREE.Vector3(
            Math.sin(az) * Math.cos(el),
            Math.sin(el),
            Math.cos(az) * Math.cos(el)
        );

        this.camera.position.copy(center).addScaledVector(dir, fitDistance);
        this.camera.lookAt(center);

        this.renderer.render(this.scene, this.camera);

        return {
            type: 'canvas',
            element: this.renderer.domElement,
            id: config.id,
            width: 600,
            height: 600
        };
    }
}
