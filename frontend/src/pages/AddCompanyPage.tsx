import React from 'react';
import { Link } from 'react-router-dom';

const AddCompanyPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex mb-8">
        <ol className="flex items-center space-x-2">
          <li>
            <div className="flex items-center">
              <span className="material-icons-outlined text-slate-400 text-xl">business</span>
              <Link className="ml-2 text-sm font-medium text-slate-500 hover:text-slate-700" to="/companies">Companies</Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-slate-300 text-lg">chevron_right</span>
              <span aria-current="page" className="ml-2 text-sm font-medium text-primary">Add New</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Company</h1>
        <p className="mt-2 text-sm text-slate-500">Manually enter details to track a new organization in your CRM.</p>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1 w-full bg-slate-100">
          <div className="h-1 bg-primary w-1/4 rounded-r"></div>
        </div>
        <form action="#" className="p-6 sm:p-8 space-y-8" method="POST">
          {/* Section: Core Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-icons-outlined text-primary text-lg">info</span>
                Core Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">Basic identification information.</p>
            </div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700" htmlFor="company-name">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    autoComplete="organization"
                    className="block w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 shadow-sm transition-colors placeholder:text-slate-400"
                    id="company-name"
                    name="company-name"
                    placeholder="e.g. Acme Corp"
                    type="text"
                  />
                </div>
              </div>
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700" htmlFor="website">
                  Website URL
                </label>
                <div className="mt-1 flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-500 sm:text-sm">
                    https://
                  </span>
                  <input
                    autoComplete="url"
                    className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 transition-colors placeholder:text-slate-400"
                    id="website"
                    name="website"
                    placeholder="www.example.com"
                    type="text"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">We'll automatically fetch the logo based on the domain.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200"></div>

          {/* Section: Classification */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-icons-outlined text-primary text-lg">category</span>
                Classification
              </h3>
              <p className="text-xs text-slate-500 mt-1">Categorize the company for better segmentation.</p>
            </div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700" htmlFor="industry">
                  Industry
                </label>
                <div className="mt-1 relative">
                  <select
                    className="block w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 shadow-sm transition-colors cursor-pointer appearance-none"
                    id="industry"
                    name="industry"
                    defaultValue=""
                  >
                    <option disabled value="">Select an industry</option>
                    <option>Software / SaaS</option>
                    <option>Finance & Banking</option>
                    <option>Healthcare</option>
                    <option>Manufacturing</option>
                    <option>Retail & E-commerce</option>
                    <option>Education</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <span className="material-icons-outlined text-lg">expand_more</span>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700" htmlFor="headcount">
                  Headcount
                </label>
                <div className="mt-1 relative">
                  <select
                    className="block w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 shadow-sm transition-colors cursor-pointer appearance-none"
                    id="headcount"
                    name="headcount"
                    defaultValue=""
                  >
                    <option disabled value="">Select range</option>
                    <option>1 - 10 employees</option>
                    <option>11 - 50 employees</option>
                    <option>51 - 200 employees</option>
                    <option>201 - 500 employees</option>
                    <option>500 - 1000 employees</option>
                    <option>1000+ employees</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <span className="material-icons-outlined text-lg">expand_more</span>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="segment">
                  Associate Segment
                </label>
                <div className="mt-1 relative rounded-md shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons-outlined text-slate-400 group-focus-within:text-primary transition-colors text-lg">search</span>
                  </div>
                  <input
                    className="block w-full rounded-lg border-slate-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm py-2.5 shadow-sm transition-colors placeholder:text-slate-400"
                    id="segment"
                    name="segment"
                    placeholder="Search for existing segments..."
                    type="text"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Segments help group companies for targeted campaigns.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              className="rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex justify-center rounded-lg border border-transparent bg-primary py-2.5 px-6 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
              type="submit"
            >
              Add Company
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400">
          Need to import multiple companies? <Link className="text-primary hover:text-primary-dark underline" to="/upload">Upload a CSV file</Link> instead.
        </p>
      </div>
    </div>
  );
};

export default AddCompanyPage;
