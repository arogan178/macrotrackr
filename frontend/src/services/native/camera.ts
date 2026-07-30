import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

import { isNativePlatform } from "./platform";

async function getPhotoFromSource(source: CameraSource): Promise<string | null> {
  if (!isNativePlatform()) return null;
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source,
    });

    return photo.webPath || photo.path || null;
  } catch (error) {
    console.debug("Camera/Gallery operation canceled or unavailable:", error);

    return null;
  }
}

export const capturePhoto = () => getPhotoFromSource(CameraSource.Camera);
export const pickPhotoFromGallery = () => getPhotoFromSource(CameraSource.Photos);
