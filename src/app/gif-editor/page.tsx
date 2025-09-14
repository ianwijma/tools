import type { Metadata } from 'next';
import NavigationLayout from '@/components/NavigationLayout';
import { GifCreatorTool } from '@/components/tools/GifCreatorTool';

export const metadata: Metadata = {
  title: 'GIF Editor - Create Animated GIFs Online',
  description:
    'Create animated GIFs from images with timeline control and custom settings. Professional-grade GIF editor with drag-and-drop interface.',
};

export default function GifCreatorPage(): JSX.Element {
  return (
    <NavigationLayout>
      <GifCreatorTool />
    </NavigationLayout>
  );
}
