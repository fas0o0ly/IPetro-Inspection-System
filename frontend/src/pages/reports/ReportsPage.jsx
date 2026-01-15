import { FileText } from 'lucide-react';
import ReportsList from '../../components/reports/ReportsList';

const ReportsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-neutral-900">Reports</h1>
        </div>
        <p className="text-neutral-600">
          View and manage inspection reports
        </p>
      </div>

      {/* Reports List */}
      <ReportsList />
    </div>
  );
};

export default ReportsPage;