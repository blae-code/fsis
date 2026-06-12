import React from 'react';
import AboutContent from '@/components/apps/AboutContent';
import PlaceholderContent from '@/components/apps/PlaceholderContent';
import SalvageContent from '@/components/apps/SalvageContent';
import SettingsContent from '@/components/apps/SettingsContent';
import CommsContent from '@/components/apps/CommsContent';
import FabricationContent from '@/components/apps/FabricationContent';

// Maps an appId to its window content + title.
// Used both when opening from the Dock and when restoring a saved session.
export function resolveAppContent(app) {
  switch (app.id) {
    case 'about':
      return { title: 'ABOUT — FSIS', content: <AboutContent /> };
    case 'salvage':
      return { title: 'SALVAGE — FairShare Pricing', content: <SalvageContent /> };
    case 'settings':
      return { title: 'SETTINGS — System Control', content: <SettingsContent /> };
    case 'comms':
      return { title: 'COMMS — OD3ICA SRS Relay', content: <CommsContent /> };
    case 'fabrication':
      return { title: 'FABRICATION — Crafting & Materials', content: <FabricationContent /> };
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
    case 'settings':
      return <SettingsContent />;
    case 'comms':
      return <CommsContent />;
    case 'fabrication':
      return <FabricationContent />;
    default: {
      const name = (title || appId).split(' — ')[0];
      return <PlaceholderContent name={name} description="" />;
    }
  }
}