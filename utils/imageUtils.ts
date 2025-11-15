export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the "data:image/jpeg;base64," part
      resolve(result.split(',')[1]); 
    };
    reader.onerror = (error) => reject(error);
  });
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const downloadCollage = (base64Data: string, filename: string): void => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export type GeneratedAlbum = {
    hero: string;
    details: string[];
};

export const downloadIndividualImages = (
    images: { hero: string; details: string[] },
    baseFilename: string
): void => {
    const heroImage = { data: images.hero, suffix: '1-hero' };
    const detailImages = images.details.map((data, index) => ({
        data,
        suffix: `2-detail-${index + 1}`
    }));

    [heroImage, ...detailImages].forEach((imageInfo) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${imageInfo.data}`;
        link.download = `${baseFilename}-${imageInfo.suffix}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
};


const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src.startsWith('data:') ? src : `data:image/png;base64,${src}`;
    });
};

const drawImageCover = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    x: number, 
    y: number, 
    w: number, 
    h: number
) => {
    const imgRatio = img.width / img.height;
    const containerRatio = w / h;
    let sWidth = img.width, sHeight = img.height, sx = 0, sy = 0;

    if (imgRatio > containerRatio) { // Image is wider than container, crop sides
        sWidth = img.height * containerRatio;
        sx = (img.width - sWidth) / 2;
    } else { // Image is taller than container, crop top/bottom
        sHeight = img.width / containerRatio;
        sy = (img.height - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
};


export type CollageLayout = 'story' | 'showcase' | 'grid';

export const createCollage = async (
    layout: CollageLayout,
    images: GeneratedAlbum,
    options: { finalWidth: number }
): Promise<string> => {
    const { finalWidth } = options;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.fillStyle = '#111827'; // bg-gray-900 for any gaps

    const imageSources = [images.hero, ...images.details.slice(0, 3)];
    const loadedImages = await Promise.all(imageSources.map(loadImage));
    const [heroImg, detail1Img, detail2Img, detail3Img] = loadedImages;
    
    const gap = finalWidth * 0.01; // 1% gap

    if (layout === 'story') { // 9:16 aspect ratio
        canvas.width = finalWidth;
        canvas.height = finalWidth * (16 / 9);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const heroHeight = canvas.width * (9 / 16);
        const detailHeight = (canvas.height - heroHeight - (3 * gap)) / 3;

        drawImageCover(ctx, heroImg, 0, 0, canvas.width, heroHeight);
        drawImageCover(ctx, detail1Img, 0, heroHeight + gap, canvas.width, detailHeight);
        drawImageCover(ctx, detail2Img, 0, heroHeight + detailHeight + (2 * gap), canvas.width, detailHeight);
        drawImageCover(ctx, detail3Img, 0, heroHeight + (2*detailHeight) + (3 * gap), canvas.width, detailHeight);

    } else if (layout === 'showcase') { // 4:5 aspect ratio
        canvas.width = finalWidth;
        canvas.height = finalWidth * 1.25;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const heroHeight = canvas.height * 0.6;
        const detailHeight = canvas.height - heroHeight - gap;
        const detailWidth = (canvas.width - (2 * gap)) / 3;

        drawImageCover(ctx, heroImg, 0, 0, canvas.width, heroHeight);
        drawImageCover(ctx, detail1Img, 0, heroHeight + gap, detailWidth, detailHeight);
        drawImageCover(ctx, detail2Img, detailWidth + gap, heroHeight + gap, detailWidth, detailHeight);
        drawImageCover(ctx, detail3Img, (2 * detailWidth) + (2*gap), heroHeight + gap, detailWidth, detailHeight);

    } else if (layout === 'grid') { // 1:1 aspect ratio
        canvas.width = finalWidth;
        canvas.height = finalWidth;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const cellWidth = (canvas.width - gap) / 2;
        const cellHeight = (canvas.height - gap) / 2;

        drawImageCover(ctx, heroImg, 0, 0, cellWidth, cellHeight);
        drawImageCover(ctx, detail1Img, cellWidth + gap, 0, cellWidth, cellHeight);
        drawImageCover(ctx, detail2Img, 0, cellHeight + gap, cellWidth, cellHeight);
        drawImageCover(ctx, detail3Img, cellWidth + gap, cellHeight + gap, cellWidth, cellHeight);
    }
    
    return canvas.toDataURL('image/jpeg', 0.9);
};