import React from 'react';
import AboutContent from '@/components/apps/AboutContent';
import PlaceholderContent from '@/components/apps/PlaceholderContent';
import SalvageContent from '@/components/apps/SalvageContent';

// Maps an appId to its window content + title.
// Used both when opening from the Dock and when restoring a saved session.
export function resolveAppContent(app) {
  switch (app.id) {
    case 'about':
      return { title: 'ABOUT — FSIS', content: <AboutContent /> };
    case 'salvage':
      return { title: 'SALVAGE — FairShare Pricing', content: <SalvageContent /> };
    default:
      return {
        title: `${app.name.toUpperCase()} — coming online`,
        content: <PlaceholderContent name={app.name} description={app.description} />,
      };
  }
}

// Lightweight resolver for session restore where we only have appId + saved title.
export function resolveContentById(appId, title) {
  switch (appId) {
    case 'about':
      return <AboutContent />;
    case 'salvage':
      return <SalvageContent />;
    default: {
      const name = (title || appId).split(' — ')[0];
      return <PlaceholderContent name={name} description="" />;
    }
  }
}