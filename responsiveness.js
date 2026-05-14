import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints para diferentes dispositivos
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  largeDesktop: 1440,
};

// Detectar tipo de dispositivo
export const getDeviceType = () => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'largeDesktop';
};

// Tamanhos responsivos
export const SIZES = {
  // Font sizes
  fonts: {
    mobile: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      title: 24,
      header: 28,
    },
    tablet: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 22,
      title: 28,
      header: 32,
    },
    desktop: {
      xs: 14,
      sm: 16,
      md: 18,
      lg: 20,
      xl: 22,
      xxl: 24,
      title: 32,
      header: 36,
    },
  },
  
  // Espaçamentos
  spacing: {
    mobile: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    tablet: {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 30,
      xxxl: 40,
    },
    desktop: {
      xs: 8,
      sm: 12,
      md: 20,
      lg: 24,
      xl: 30,
      xxl: 36,
      xxxl: 48,
    },
  },
  
  // Dimensões de componentes
  components: {
    button: {
      mobile: { height: 40, padding: 12 },
      tablet: { height: 48, padding: 16 },
      desktop: { height: 56, padding: 20 },
    },
    card: {
      mobile: { padding: 16, margin: 8 },
      tablet: { padding: 20, margin: 12 },
      desktop: { padding: 24, margin: 16 },
    },
    header: {
      mobile: { height: 60, padding: 16 },
      tablet: { height: 70, padding: 20 },
      desktop: { height: 80, padding: 24 },
    },
  },
};

// Hook para estilos responsivos
export const useResponsiveStyles = () => {
  const deviceType = getDeviceType();
  
  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isLargeDesktop: deviceType === 'largeDesktop',
    
    // Getters para tamanhos
    getFontSize: (size) => SIZES.fonts[deviceType][size] || SIZES.fonts.mobile.md,
    getSpacing: (size) => SIZES.spacing[deviceType][size] || SIZES.spacing.mobile.md,
    getComponentSize: (component) => SIZES.components[component]?.[deviceType] || SIZES.components[component]?.mobile,
    
    // Dimensões da tela
    screenWidth: width,
    screenHeight: height,
    
    // Utilitários
    scale: (size) => {
      const baseWidth = 375; // Base iPhone width
      return (size * width) / baseWidth;
    },
  };
};

// Estilos responsivos automáticos
export const createResponsiveStyle = (styles) => {
  const deviceType = getDeviceType();
  const responsiveStyles = {};
  
  Object.keys(styles).forEach(key => {
    const style = styles[key];
    if (typeof style === 'function') {
      responsiveStyles[key] = style(deviceType, width, height);
    } else {
      responsiveStyles[key] = style;
    }
  });
  
  return responsiveStyles;
};

// Detectar navegador e plataforma
export const getBrowserInfo = () => {
  if (Platform.OS !== 'web') return null;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    isChrome: userAgent.includes('chrome'),
    isFirefox: userAgent.includes('firefox'),
    isSafari: userAgent.includes('safari') && !userAgent.includes('chrome'),
    isEdge: userAgent.includes('edge'),
    isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
    isTablet: /ipad|android(?!.*mobile)/i.test(userAgent),
    isDesktop: !/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
  };
};

// Media queries para web
export const mediaQueries = {
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  largeDesktop: '@media (min-width: 1440px)',
};
