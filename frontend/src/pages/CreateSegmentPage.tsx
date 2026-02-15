import React from 'react';
import { Link } from 'react-router-dom';

const CreateSegmentPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <Link className="inline-flex items-center text-sm text-slate-500 hover:text-primary transition-colors group" to="/segments">
          <span className="material-icons-round text-base mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to Segments
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <h1 className="text-2xl font-semibold text-slate-900">Create New Segment</h1>
          <p className="mt-1 text-sm text-slate-500">Define a new audience segment for your ABM campaigns.</p>
        </div>
        <form className="divide-y divide-slate-100">
          <div className="px-8 py-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="segment-name">
                  Segment Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 transition-colors placeholder:text-slate-400"
                  id="segment-name"
                  placeholder="e.g., Q3 Enterprise Tech Targets"
                  type="text"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="w-full rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 transition-colors placeholder:text-slate-400 resize-y"
                  id="description"
                  placeholder="Briefly describe the target criteria, goals, or persona for this segment..."
                  rows={4}
                ></textarea>
                <p className="mt-1.5 text-xs text-slate-500">Internal notes to help your team understand this segment's purpose.</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8 space-y-6 bg-slate-50/50">
            <div>
              <h3 className="text-base font-medium text-slate-900">Configuration</h3>
              <p className="text-sm text-slate-500 mt-1">Associate products and set visibility.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Associated Offerings
              </label>
              <div className="relative">
                <div className="w-full min-h-[46px] rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1.5 flex flex-wrap gap-2 items-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                    Cloud Infrastructure
                    <button className="ml-1.5 inline-flex text-primary/60 hover:text-primary focus:outline-none" type="button">
                      <span className="material-icons-round text-sm">close</span>
                    </button>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                    Data Analytics Pro
                    <button className="ml-1.5 inline-flex text-primary/60 hover:text-primary focus:outline-none" type="button">
                      <span className="material-icons-round text-sm">close</span>
                    </button>
                  </span>
                  <input
                    className="flex-1 min-w-[120px] border-none bg-transparent p-1 text-sm focus:ring-0 text-slate-900 placeholder:text-slate-400"
                    placeholder="Search offerings..."
                    type="text"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Start typing to search for products or services available in your catalog.</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900">Segment Status</span>
                <span className="text-sm text-slate-500">Inactive segments are hidden from campaign builders.</span>
              </div>
              <button aria-checked="true" className="group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" role="switch" type="button">
                <span className="sr-only">Use setting</span>
                <span aria-hidden="true" className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out group-hover:shadow-md"></span>
              </button>
            </div>
          </div>

          <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all" type="button">
              Cancel
            </button>
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg shadow-sm hover:bg-primary-700 transition-all" type="submit">
              <span className="material-icons-round text-lg mr-2">save</span>
              Save Segment
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 p-4 rounded-lg border border-blue-100 bg-blue-50 flex gap-4 items-start">
          <span className="material-icons-round text-primary mt-0.5">info</span>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Pro Tip</h4>
            <p className="text-sm text-blue-800 mt-1">
              Segments with specific offering tags perform 24% better in ABM campaigns. Ensure your offering list is up to date in the Catalog module.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSegmentPage;
