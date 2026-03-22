export const Fonts = {
  clash: {
    regular: 'ClashDisplay-Variable',
    medium: 'ClashDisplay-Variable',
    semibold: 'ClashDisplay-Variable',
    bold: 'ClashDisplay-Variable',
  },
  satoshi: {
    regular: 'Satoshi-Variable',
    italic: 'Satoshi-VariableItalic',
  },
};

// Usage helpers
export const Typography = {
  // Clash Display — for headings, titles, big moments
  display: { fontFamily: 'Outfit_700Bold', fontWeight: '700' as const },
  heading1: { fontFamily: 'Outfit_700Bold', fontWeight: '600' as const, fontSize: 36 },
  heading2: { fontFamily: 'Outfit_700Bold', fontWeight: '600' as const, fontSize: 28 },
  heading3: { fontFamily: 'Outfit_700Bold', fontWeight: '600' as const, fontSize: 22 },
  heading4: { fontFamily: 'Outfit_600SemiBold', fontWeight: '500' as const, fontSize: 18 },

  // Satoshi — for body, labels, captions
  body: { fontFamily: 'PlusJakartaSans_400Regular', fontWeight: '400' as const, fontSize: 15 },
  bodyMedium: { fontFamily: 'PlusJakartaSans_500Medium', fontWeight: '500' as const, fontSize: 15 },
  bodySemibold: { fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '600' as const, fontSize: 15 },
  bodyBold: { fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const, fontSize: 15 },
  label: { fontFamily: 'PlusJakartaSans_500Medium', fontWeight: '500' as const, fontSize: 13 },
  caption: { fontFamily: 'PlusJakartaSans_400Regular', fontWeight: '400' as const, fontSize: 11 },
  captionBold: { fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const, fontSize: 11 },
};
