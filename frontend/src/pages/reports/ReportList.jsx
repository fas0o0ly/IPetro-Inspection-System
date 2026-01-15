// // src/pages/reports/ReportsList.jsx

// import { useState, useEffect } from 'react';
// import { FileText, Download, Search, Calendar, Filter } from 'lucide-react';
// import { inspectionService } from '../../services/inspectionService';
// import { reportService } from '../../services/reportService';
// import { formatDateForDisplay } from '../../utils/dateUtils';
// import toast from 'react-hot-toast';

// const ReportsList = () => {
//   const [inspections, setInspections] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all'); // all, generated, not-generated

//   useEffect(() => {
//     fetchInspections();
//   }, []);

//   const fetchInspections = async () => {
//     try {
//       setLoading(true);
//       const response = await inspectionService.getAll();
//       setInspections(response.data.inspections || []);
//     } catch (error) {
//       console.error('Error fetching inspections:', error);
//       toast.error('Failed to load inspections');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownload = async (inspection) => {
//     try {
//       const blob = await reportService.download(inspection.inspection_id);
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `${inspection.vessel_tag_no}_${inspection.report_number || 'Report'}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       toast.success('Report downloaded successfully!');
//     } catch (error) {
//       toast.error('Failed to download report');
//     }
//   };

//   const filteredInspections = inspections.filter(inspection => {
//     const matchesSearch = 
//       inspection.vessel_tag_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inspection.report_number?.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesFilter = 
//       filterStatus === 'all' ||
//       (filterStatus === 'generated' && inspection.report_number) ||
//       (filterStatus === 'not-generated' && !inspection.report_number);

//     return matchesSearch && matchesFilter;
//   });

//   return (
//     <div className="container mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-neutral-900 mb-2">Inspection Reports</h1>
//         <p className="text-neutral-600">View and download generated inspection reports</p>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           {/* Search */}
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
//             <input
//               type="text"
//               placeholder="Search by vessel tag or report number..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
//             />
//           </div>

//           {/* Filter */}
//           <div className="flex items-center gap-2">
//             <Filter className="w-5 h-5 text-neutral-600" />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
//             >
//               <option value="all">All Inspections</option>
//               <option value="generated">With Report</option>
//               <option value="not-generated">No Report</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Reports List */}
//       {loading ? (
//         <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
//           <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-neutral-600">Loading reports...</p>
//         </div>
//       ) : filteredInspections.length === 0 ? (
//         <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
//           <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-neutral-900 mb-2">No reports found</h3>
//           <p className="text-neutral-600">
//             {searchTerm ? 'Try adjusting your search or filters' : 'No inspection reports available'}
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 gap-4">
//           {filteredInspections.map((inspection) => (
//             <div
//               key={inspection.inspection_id}
//               className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                     <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
//                       <FileText className="w-5 h-5 text-primary-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-neutral-900">{inspection.vessel_tag_no}</h3>
//                       <p className="text-sm text-neutral-600">{inspection.vessel_type}</p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
//                     <div>
//                       <p className="text-xs text-neutral-500 mb-1">Report Number</p>
//                       <p className="text-sm font-medium text-neutral-900">
//                         {inspection.report_number || '-'}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-neutral-500 mb-1">Inspection Date</p>
//                       <p className="text-sm font-medium text-neutral-900">
//                         {formatDateForDisplay(inspection.inspection_date)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-neutral-500 mb-1">Inspector</p>
//                       <p className="text-sm font-medium text-neutral-900">
//                         {inspection.inspector_name || '-'}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-neutral-500 mb-1">Status</p>
//                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                         inspection.report_number 
//                           ? 'bg-green-100 text-green-800' 
//                           : 'bg-amber-100 text-amber-800'
//                       }`}>
//                         {inspection.report_number ? 'Generated' : 'Not Generated'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {inspection.report_number && (
//                   <button
//                     onClick={() => handleDownload(inspection)}
//                     className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
//                   >
//                     <Download className="w-4 h-4" />
//                     Download
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ReportsList;