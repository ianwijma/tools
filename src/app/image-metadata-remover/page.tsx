import type { Metadata } from 'next';
import NavigationLayout from '@/components/NavigationLayout';
import { ImageMetadataRemoverTool } from '@/components/tools/ImageMetadataRemoverTool';

export const metadata: Metadata = {
  title: 'Image Metadata Remover - Remove EXIF Data & Protect Privacy',
  description:
    'Remove EXIF data, geolocation, camera information, and other metadata from your images to protect your privacy. Supports bulk processing and multiple output formats.',
  keywords: [
    'image metadata remover',
    'EXIF data removal',
    'privacy protection',
    'bulk image processing',
    'remove geolocation',
    'camera data removal',
    'image privacy',
    'metadata stripper',
    'photo privacy',
    'batch processing',
  ],
  openGraph: {
    title: 'Image Metadata Remover - Remove EXIF Data & Protect Privacy',
    description:
      'Remove EXIF data, geolocation, camera information, and other metadata from your images to protect your privacy. Supports bulk processing and multiple output formats.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image Metadata Remover - Remove EXIF Data & Protect Privacy',
    description:
      'Remove EXIF data, geolocation, camera information, and other metadata from your images to protect your privacy. Supports bulk processing and multiple output formats.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ImageMetadataRemoverPage(): JSX.Element {
  return (
    <NavigationLayout>
      <ImageMetadataRemoverTool />
    </NavigationLayout>
  );
}
