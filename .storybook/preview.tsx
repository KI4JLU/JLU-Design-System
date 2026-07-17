import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect } from 'react';
import { ThemeProvider, useTheme, type Theme } from '../src/theme/ThemeContext';
import './preview.css';

/** Bridges the Storybook toolbar selection into the real ThemeProvider, so
 * stories exercise the same runtime (data-theme on <html>) as the apps. */
function ThemeSync({ theme }: { theme: Theme }) {
  const { setTheme } = useTheme();
  useEffect(() => setTheme(theme), [theme, setTheme]);
  return null;
}

const withTheme: Decorator = (Story, context) => (
  <ThemeProvider>
    <ThemeSync theme={context.globals.theme as Theme} />
    {/* Full-page templates (parameters.layout: "fullscreen") render edge-to-edge;
        component stories keep the padded canvas. */}
    <div
      className={
        context.parameters.layout === "fullscreen"
          ? "bg-surface text-on-surface min-h-screen"
          : "bg-surface text-on-surface min-h-screen p-8"
      }
    >
      <Story />
    </div>
  </ThemeProvider>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Farbschema',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Hell' },
          { value: 'dark', title: 'Dunkel' },
          { value: 'system', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [withTheme],
  parameters: {
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
  tags: ['autodocs'],
};

export default preview;
