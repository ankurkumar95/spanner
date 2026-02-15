import React from 'react';

const CsvUploadPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="border-b border-gray-200 mb-8 -mt-8 -mx-8 bg-white px-8 pt-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">CSV Import</h1>
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          <button className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-primary text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.2em]">domain</span>
            Company CSV
          </button>
          <button className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.2em]">person</span>
            Contact CSV
          </button>
        </nav>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Upload Companies</h2>
              <p className="mt-1 text-sm text-gray-500">Import bulk company data into a specific segment.</p>
            </div>
            <button className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-base">download</span>
              Download Template
            </button>
          </div>

          <div className="mt-2 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer group">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-5xl">upload_file</span>
              </div>
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary" htmlFor="file-upload">
                  <span>Upload a file</span>
                  <input accept=".csv" className="sr-only" id="file-upload" name="file-upload" type="file" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV up to 10MB</p>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-md border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-gray-500 text-base">info</span>
              File Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Required Columns</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
                  <li>Company Name <span className="text-red-500">*</span></li>
                  <li>Segment <span className="text-red-500">*</span> (Must match active segment)</li>
                  <li>Website</li>
                  <li>Industry</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Format Rules</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
                  <li>File format must be <strong>.csv</strong></li>
                  <li>Encoding should be <strong>UTF-8</strong></li>
                  <li>Date format: <strong>YYYY-MM-DD</strong></li>
                  <li>No duplicate company names within the same segment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Last upload by you: <span className="font-medium text-gray-700">companies_batch_04.csv</span> (Yesterday)
          </div>
          <div className="flex gap-3">
            <button className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary opacity-50 cursor-not-allowed" disabled>
              Process File
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Uploads</h3>
        <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6" scope="col">File Name</th>
                <th className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500" scope="col">Date</th>
                <th className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500" scope="col">Status</th>
                <th className="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500" scope="col">Rows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">fintech_apac_q3.csv</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Oct 24, 2023</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Processed</span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">145</td>
              </tr>
              <tr>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">healthcare_midmarket.csv</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Oct 22, 2023</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Failed</span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CsvUploadPage;
