import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import STATIC_APPS from '@/lib/appRegistry';

// Loads the app registry from the `app` entity, ordered by sort_order.
// Falls back to the static appRegistry list if no data exists yet.
export function useApps() {
  const { data, isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: () => base44.entities.app.filter({ enabled: true }, 'sort_order'),
  });

  const apps = data && data.length > 0 ? data.map(normalizeApp) : STATIC_APPS;

  return { apps, isLoading };
}

function normalizeApp(record) {
  return {
    id: record.app_id,
    name: record.name,
    description: record.description,
    icon: record.icon,
    status: record.status,
    color: record.color,
  };
}