import React from 'react';
import ConsoleFold from '@/components/console/ConsoleFold';
import TaskWorkOrderConsole from '@/components/apps/management/tasks/TaskWorkOrderConsole';
import LabourCostPanel from '@/components/apps/management/tasks/LabourCostPanel';
import RunConsole from '@/components/apps/management/runs/RunConsole';
import RunProfitChart from '@/components/apps/management/runs/RunProfitChart';
import PaydayManagementPanel from '@/components/apps/management/PaydayManagementPanel';
import AccessConsole from '@/components/apps/management/access/AccessConsole';
import MonthlyReviewPanel from '@/components/apps/management/labour/report/MonthlyReviewPanel';

/** Only the desk in hand is mounted — the rest of the hall costs nothing while it waits. */
export default function LabourDesk({ desk }) {
  if (desk === 'tasks') {
    return (
      <div className="space-y-4">
        <ConsoleFold label="LABOUR COST — OUTSTANDING PAYOUT OBLIGATIONS">
          <LabourCostPanel />
        </ConsoleFold>
        <TaskWorkOrderConsole />
      </div>
    );
  }
  if (desk === 'runs') {
    return (
      <div className="space-y-4">
        <ConsoleFold label="RUN PROFIT — HAUL VALUE & MARGINS">
          <RunProfitChart />
        </ConsoleFold>
        <RunConsole />
      </div>
    );
  }
  if (desk === 'payday') return <PaydayManagementPanel />;
  if (desk === 'review') return <MonthlyReviewPanel />;
  return <AccessConsole />;
}