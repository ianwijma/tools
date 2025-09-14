import type { Metadata } from 'next';
import NavigationLayout from '@/components/NavigationLayout';
import { JsonUglifierTool } from '@/components/tools/JsonUglifierTool';

export const metadata: Metadata = {
  title: 'JSON Uglifier | Online Tools',
  description:
    'Minimize JSON by removing all unnecessary whitespace and formatting. Perfect for reducing file sizes and optimizing data transfer.',
  keywords: [
    'json',
    'uglifier',
    'minifier',
    'compress',
    'minimize',
    'optimize',
  ],
};

export default function JsonUglifierPage(): JSX.Element {
  return (
    <NavigationLayout>
      <JsonUglifierTool />
    </NavigationLayout>
  );
}
