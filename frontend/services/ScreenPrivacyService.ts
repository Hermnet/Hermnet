type ScreenCaptureModule = {
  preventScreenCaptureAsync: () => Promise<void>;
  allowScreenCaptureAsync: () => Promise<void>;
};

let screenCaptureModule: ScreenCaptureModule | null | undefined;

function getScreenCapture(): ScreenCaptureModule | null {
  if (screenCaptureModule !== undefined) return screenCaptureModule;
  try {
    screenCaptureModule = require('expo-screen-capture') as ScreenCaptureModule;
  } catch (err) {
    screenCaptureModule = null;
    if (__DEV__) {
      console.warn('[screen-capture] módulo nativo no disponible; recompila el development build para bloquear capturas.', err);
    }
  }
  return screenCaptureModule;
}

class ScreenPrivacyService {
  async preventCapture(): Promise<void> {
    const ScreenCapture = getScreenCapture();
    if (!ScreenCapture) return;
    try {
      await ScreenCapture.preventScreenCaptureAsync();
    } catch (err) {
      if (__DEV__) console.warn('[screen-capture] no se pudo bloquear captura:', err);
    }
  }

  async allowCapture(): Promise<void> {
    const ScreenCapture = getScreenCapture();
    if (!ScreenCapture) return;
    try {
      await ScreenCapture.allowScreenCaptureAsync();
    } catch {}
  }
}

export const screenPrivacyService = new ScreenPrivacyService();
