import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.osirisneo33.finace',
  appName: 'Finace',
  webDir: 'dist',
  backgroundColor: '#f6f7f9',
  ios: {
    // El contenido respeta la barra de estado y la zona del gesto de inicio con CSS (env(safe-area-inset-*))
    contentInset: 'never',
    scheme: 'Finace',
  },
};

export default config;
