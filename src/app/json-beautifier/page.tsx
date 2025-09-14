import type { Metadata } from 'next';
import NavigationLayout from '@/components/NavigationLayout';
import { JsonBeautifierTool } from '@/components/tools/JsonBeautifierTool';

export const metadata: Metadata = {
  title: 'JSON Beautifier - Online Tools Collection',
  description:
    'Transform minified or poorly formatted JSON into clean, readable format with extensive customization options. Perfect for debugging, documentation, and code review.',
  keywords: [
    'JSON',
    'beautifier',
    'formatter',
    'prettify',
    'format',
    'indent',
    'validate',
    'online tool',
  ],
};

export default function JsonBeautifierPage(): JSX.Element {
  return (
    <NavigationLayout>
      <JsonBeautifierTool />
    </NavigationLayout>
  );
}
