import type { Preview } from '@storybook/react';
import '../src/styles/globals.css'; // 🔌 CRITICAL: Inject your Forensic Design Tokens

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Force the "Void" background in Storybook so components don't look broken on white
    backgrounds: {
      default: 'nexus-void',
      values: [
        { name: 'nexus-void', value: '#000000' },
        { name: 'nexus-matter', value: '#0A0A0A' },
      ],
    },
    // Center components for easier inspection
    layout: 'centered',
  },
};

export default preview;
