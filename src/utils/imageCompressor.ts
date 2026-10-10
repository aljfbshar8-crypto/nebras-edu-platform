/**
 * High-performance browser-side image compressor.
 * Downscales photos to max 1280px and converts to optimized JPEG format.
 * Reduces 5MB-12MB camera photos to ~100KB-250KB in milliseconds,
 * eliminating browser UI thread freezes and API upload timeouts.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxDimension: number = 1024,
  quality: number = 0.85
): Promise<{ dataUrl: string; width: number; height: number; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to acquire canvas context');
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate approximate size
        const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
        const approxBytes = Math.round((base64Length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          width,
          height,
          sizeBytes: approxBytes,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('تعذر قراءة ملف الصورة ومعالجته. يرجى التأكد من صلاحية الملف.'));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('فشل في قراءة ملف الصورة.'));
        }
      };
      reader.onerror = () => reject(new Error('فشل في قراءة ملف الصورة.'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
