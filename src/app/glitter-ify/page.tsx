import type { Metadata } from 'next';
import NavigationLayout from '@/components/NavigationLayout';
import { GlitterifyTool } from '@/components/tools/GlitterifyTool';

export const metadata: Metadata = {
  title: 'Glitter-ify - Online Tools Collection',
  description:
    'Turn images into sparkly animated glitter GIFs with sequin frames and twinkling sparkles. Bulk processing support with customizable size, frames, and delay. All processing happens in your browser for privacy and speed.',
  keywords: [
    'glitter gif maker',
    'glitter-ify',
    'animated gif generator',
    'sparkle gif',
    'image to gif',
    'sequin effect',
    'online gif tools',
    'frontend image processing',
  ],
  openGraph: {
    title: 'Glitter-ify - Make Sparkly GIFs Online',
    description:
      'Turn images into sparkly animated glitter GIFs with bulk processing support. Privacy-focused browser-based conversion.',
    type: 'website',
  },
};

export default function GlitterifyPage(): JSX.Element {
  return (
    <NavigationLayout>
      <GlitterifyTool />
    </NavigationLayout>
  );
}
