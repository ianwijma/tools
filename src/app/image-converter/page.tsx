import type { Metadata } from 'next';
import NavigationLayout from '@/components/NavigationLayout';
import { ImageConverterTool } from '@/components/tools/ImageConverterTool';

export const metadata: Metadata = {
  title: 'Image Converter - Online Tools Collection',
  description:
    'Convert images between formats with bulk processing support. Supports JPEG, PNG, WebP, and more with customizable quality and size settings. All processing happens in your browser for privacy and speed.',
  keywords: [
    'image converter',
    'bulk image conversion',
    'jpeg to png',
    'png to webp',
    'image format converter',
    'resize images',
    'compress images',
    'online image tools',
    'frontend image processing',
  ],
  openGraph: {
    title: 'Image Converter - Convert Images Online',
    description:
      'Convert images between formats with bulk processing. Supports JPEG, PNG, WebP, and more. Privacy-focused browser-based conversion.',
    type: 'website',
  },
};

export default function ImageConverterPage(): JSX.Element {
  return (
    <NavigationLayout>
      <ImageConverterTool />
    </NavigationLayout>
  );
}
