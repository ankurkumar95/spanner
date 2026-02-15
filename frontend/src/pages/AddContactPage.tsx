import React from 'react';
import { Link } from 'react-router-dom';

const AddContactPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <header className="mb-8">
        <nav className="flex items-center text-sm font-medium text-slate-500 mb-4">
          <Link className="hover:text-primary transition-colors flex items-center" to="/contacts">
            <span className="material-icons text-base mr-1">arrow_back</span>
            Contacts
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-800">Add New</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Add New Contact</h1>
            <p className="mt-1 text-sm text-slate-500">Enter the details below to manually create a new contact record.</p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
            <span className="material-icons text-2xl">person_add</span>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1 w-full bg-slate-100">
          <div className="h-full w-1/3 bg-primary rounded-r-full"></div>
        </div>
        <form action="#" className="p-6 sm:p-8 lg:p-10 space-y-8" method="POST">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</div>
              <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="first-name">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="block w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5"
                  id="first-name"
                  name="first-name"
                  placeholder="e.g. Jane"
                  type="text"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="last-name">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="block w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5"
                  id="last-name"
                  name="last-name"
                  placeholder="e.g. Doe"
                  type="text"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-icons text-slate-400 text-lg">mail_outline</span>
                  </div>
                  <input
                    className="block w-full rounded-lg border-slate-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm py-2.5"
                    id="email"
                    name="email"
                    placeholder="jane.doe@example.com"
                    type="email"
                  />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200" />

          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</div>
              <h2 className="text-lg font-semibold text-slate-900">Professional Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 relative group">
                <label className="block text-sm font-medium text-slate-700" htmlFor="company">
                  Company
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-icons text-slate-400 text-lg">business</span>
                  </div>
                  <input
                    autoComplete="off"
                    className="block w-full rounded-lg border-slate-300 pl-10 pr-10 focus:border-primary focus:ring-primary sm:text-sm py-2.5"
                    id="company"
                    name="company"
                    placeholder="Search company..."
                    type="text"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="material-icons text-slate-400 text-lg cursor-pointer">arrow_drop_down</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="job-title">
                  Job Title
                </label>
                <input
                  className="block w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5"
                  id="job-title"
                  name="job-title"
                  placeholder="e.g. Senior Marketing Manager"
                  type="text"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="linkedin">
                  LinkedIn Profile
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-500 sm:text-sm">
                    linkedin.com/in/
                  </span>
                  <input
                    className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5"
                    id="linkedin"
                    name="linkedin"
                    placeholder="username"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
            <button
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              type="button"
            >
              Cancel
            </button>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-primary text-primary bg-primary/10 hover:bg-primary/20 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center"
                type="submit"
              >
                <span className="material-icons text-sm mr-2">playlist_add</span>
                Save & Add Another
              </button>
              <button
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-transparent bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center"
                type="submit"
              >
                <span className="material-icons text-sm mr-2">check</span>
                Save Contact
              </button>
            </div>
          </div>
        </form>
      </div>
      <footer className="mt-6 text-center text-xs text-slate-400">
        <p>© 2023 Contact Module. Secure Form.</p>
      </footer>
    </div>
  );
};

export default AddContactPage;
