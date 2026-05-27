export const compressImage = (file, maxSizeMB = 1) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDimension = 1920;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob.size > maxSizeMB * 1024 * 1024) {
            canvas.toBlob((smallerBlob) => {
              resolve(new File([smallerBlob], file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.7);
          } else {
            resolve(new File([blob], file.name, { type: file.type }));
          }
        }, file.type, 0.9);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
