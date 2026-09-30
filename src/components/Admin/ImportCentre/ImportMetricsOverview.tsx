import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, ShieldCheck, Clock, PackagePlus, FileSpreadsheet, Sparkles } from 'lucide-react';
import { ImportMetricsSummary, ImportJob } from '../../../types';

interface Props {
  metrics: ImportMetricsSummary;
  jobs: ImportJob[];
  onSelectJob?: (job: ImportJob) => void;
  onRollbackJob?: (batchId: string) => void;
}

export const ImportMetricsOverview: React.FC<Props> = ({ metrics, jobs, onSelectJob, onRollbackJob }) => {
  return (
    <div className="space-y-6">
      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800">
          <div className="text-gray-400 text-[11px] font-bold uppercase flex items-center gap-1.5">
            <PackagePlus className="w-3.5 h-3.5 text-[#FFD400]" />
            Products Ingested (Today)
          </div>
          <div className="text-2xl font-black text-white mt-1">{metrics.todayImported}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Across CSV, Photos & Barcode</div>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800">
          <div className="text-gray-400 text-[11px] font-bold uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            AI Drafts Generated
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1">{metrics.todayDraftsGenerated}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Structured & Enriched</div>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800">
          <div className="text-gray-400 text-[11px] font-bold uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Published to Store
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{metrics.todayPublished}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Active in PostgreSQL DB</div>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800">
          <div className="text-gray-400 text-[11px] font-bold uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFD400]" />
            Duplicates Prevented
          </div>
          <div className="text-2xl font-black text-[#FFD400] mt-1">{metrics.todayDuplicatesPrevented}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Matched by SKU / Barcode</div>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800">
          <div className="text-gray-400 text-[11px] font-bold uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Avg AI Processing Time
          </div>
          <div className="text-2xl font-black text-purple-400 mt-1">{metrics.avgProcessingTimeSec}s</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Per item identification</div>
        </div>
      </div>

      {/* Recent Import Jobs Audit Log */}
      <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="font-black text-sm uppercase text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#FFD400]" />
              Recent Intake & Import Batches
            </h3>
            <p className="text-xs text-gray-400">Complete audit log of all spreadsheet imports, warehouse intake jobs, and rollback snapshots</p>
          </div>
          <span className="text-xs font-mono text-gray-400 font-bold">{jobs.length} Intake Jobs Recorded</span>
        </div>

        {jobs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs">No import jobs recorded yet today.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-800 text-gray-400 uppercase font-black">
                <tr>
                  <th className="p-2.5">Source / Batch</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Date & Time</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5">Detected</th>
                  <th className="p-2.5">Created</th>
                  <th className="p-2.5">Updated</th>
                  <th className="p-2.5">Duplicates</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-gray-200">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-neutral-800/50">
                    <td className="p-2.5">
                      <div className="font-bold text-white line-clamp-1">{job.source}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Batch: {job.batchId}</div>
                    </td>
                    <td className="p-2.5 font-bold uppercase text-[10px]">
                      <span className="bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-gray-300">
                        {job.sourceType}
                      </span>
                    </td>
                    <td className="p-2.5 text-gray-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(job.createdAt).toLocaleString('en-AU', { hour12: false })}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-gray-300">
                      {job.importMode.replace(/_/g, ' ')}
                    </td>
                    <td className="p-2.5 font-bold text-white">{job.totalDetected}</td>
                    <td className="p-2.5 font-bold text-emerald-400">+{job.createdCount}</td>
                    <td className="p-2.5 font-bold text-blue-400">~{job.updatedCount}</td>
                    <td className="p-2.5 font-bold text-[#FFD400]">{job.duplicatesCount}</td>
                    <td className="p-2.5">
                      {job.status === 'completed' && (
                        <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">
                          Completed
                        </span>
                      )}
                      {job.status === 'completed_with_errors' && (
                        <span className="bg-yellow-950/80 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-800">
                          Errors Handled
                        </span>
                      )}
                      {job.status === 'rolled_back' && (
                        <span className="bg-neutral-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-700">
                          Rolled Back
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      {job.canRollback && job.status !== 'rolled_back' && onRollbackJob && (
                        <button
                          onClick={() => onRollbackJob(job.batchId)}
                          className="bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-bold px-2.5 py-1 rounded border border-red-800/80 transition-colors"
                          title="Safely rollback all created/updated items from this batch"
                        >
                          Rollback Batch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
