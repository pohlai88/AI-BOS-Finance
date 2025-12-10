import type { Preview } from '@storybook/react-vite';
import '../src/styles/globals.css'; // Import Forensic Design Tokens

const preview: Preview = {
  parameters: {
    // Dark background to match Forensic aesthetic
    backgrounds: {
      default: 'nexus-void',
      values: [
        { name: 'nexus-void', value: '#0a0a0a' },
        { name: 'nexus-matter', value: '#111111' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
