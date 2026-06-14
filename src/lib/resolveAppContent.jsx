import React from 'react';
import AboutContent from '@/components/apps/AboutContent';
import PlaceholderContent from '@/components/apps/PlaceholderContent';
import SalvageContent from '@/components/apps/SalvageContent';
import SettingsContent from '@/components/apps/SettingsContent';
import CommsContent from '@/components/apps/CommsContent';
import FabricationContent from '@/components/apps/FabricationContent';
import OrdersContent from '@/components/apps/OrdersContent';
import LedgerContent from '@/components/apps/LedgerContent';
import RouteMapContent from '@/components/apps/RouteMapContent';
import MatDexContent from '@/components/matdex/MatDexContent';
import FairShareContent from '@/components/apps/FairShareContent';
import ContractsContent from '@/components/apps/ContractsContent';
import PerformanceContent from '@/components/apps/PerformanceContent';
import StationContent from '@/components/apps/StationContent';
import ManagementContent from '@/components/apps/ManagementContent';
import LootContent from '@/components/apps/LootContent';

// Maps an appId to its window content + title.
// Used both when opening from the Dock and when restoring a saved session.
export function resolveAppContent(app) {
  switch (app.id) {
    case 'settings':
      return { title: 'SETTINGS — System Control', content: <SettingsContent /> };
    case 'about':
      return { title: 'ABOUT — FSIS', content: <AboutContent /> };
    case 'salvage':
      return { title: 'SALVAGE — Operations & Market', content: <SalvageContent /> };
    case 'comms':
      return { title: 'COMMS — OD3ICA SRS Relay', content: <CommsContent /> };
    case 'fabrication':
      return { title: 'FABRICATION — Crafting & Materials', content: <FabricationContent /> };
    case 'orders':
      return { title: 'ORDERS — Customer Order Desk', content: <OrdersContent /> };
    case 'ledger':
      return { title: 'LEDGER — Income & Operating Costs', content: <LedgerContent /> };
    case 'routemap':
      return { title: 'ROUTEMAP — Jump Path Plotter', content: <RouteMapContent /> };
    case 'matdex':
      return { title: 'MATDEX — Materials & Components Index', content: <MatDexContent /> };
    case 'fairshare':
      return { title: 'FAIRSHARE — Crew Payroll & Work Orders', content: <FairShareContent /> };
    case 'contracts':
      return { title: 'CONTRACTS — Jobs & Agreements', content: <ContractsContent /> };
    case 'performance':
      return { title: 'PERFORMANCE — Salvage & Revenue Analytics', content: <PerformanceContent /> };
    case 'station':
      return { title: 'STATION — Your Duty Dashboard', content: <StationContent /> };
    case 'management':
      return { title: 'MANAGEMENT — Admin Console', content: <ManagementContent /> };
    case 'loot':
      return { title: 'LOOT — Recovery & Resale', content: <LootContent /> };
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
    case 'orders':
      return <OrdersContent />;
    case 'ledger':
      return <LedgerContent />;
    case 'routemap':
      return <RouteMapContent />;
    case 'matdex':
      return <MatDexContent />;
    case 'fairshare':
      return <FairShareContent />;
    case 'contracts':
      return <ContractsContent />;
    case 'performance':
      return <PerformanceContent />;
    case 'station':
      return <StationContent />;
    case 'management':
      return <ManagementContent />;
    case 'loot':
      return <LootContent />;
    default: {
      const name = (title || appId).split(' — ')[0];
      return <PlaceholderContent name={name} description="" />;
    }
  }
}