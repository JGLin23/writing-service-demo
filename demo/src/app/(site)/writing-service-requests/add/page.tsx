"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotices } from "@/components/Notices";
import { PageTitle, SourceNote } from "@/components/ui";
import { createRequest, validateRequest } from "@/lib/actions";
import type { DocMeta } from "@/lib/types";

/** templates/WritingServiceRequests/add.php — "Enquire Writing Service". */
export default function AddRequestPage() {
  const router = useRouter();
  const notices = useNotices();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [doc, setDoc] = useState<DocMeta | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { service_title: title, service_type: type, notes, document: doc };
    const errs = validateRequest(input);
    setErrors(errs);
    if (errs.document) {
      // _handleDocumentUpload() flashes this and redirects back to the form.
      notices.flash("error", errs.document);
      return;
    }
    if (Object.keys(errs).length > 0) {
      notices.flash("error", "The writing service request could not be saved. Please, try again.");
      return;
    }
    setSubmitting(true);
    createRequest(input);
    notices.flash("success", "The writing service request has been saved.");
    notices.email("New writing service request notification sent to the admin (new_request_notification).");
    router.push("/writing-service-requests");
  };

  const field = "block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";
  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-red-600">{errors[k]}</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Enquire Writing Service" />
      <div className="rounded-lg bg-white p-6 shadow">
        <form onSubmit={submit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="service_title" className="mb-2 block font-medium text-gray-700">
              Request Title
            </label>
            <input
              id="service_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Briefly describe your service..."
              className={field}
            />
            {err("service_title")}
          </div>

          <div>
            <label htmlFor="service-type" className="mb-2 block font-medium text-gray-700">
              Service Type (describe the service you need)
            </label>
            <input
              id="service-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              maxLength={200}
              placeholder="Describe the type of writing service you need (max 200 characters)"
              className={field}
            />
            <p className="mt-1 text-sm text-gray-500">Examples: Creative Writing, Editing, Proofreading, Essay Writing, Technical Writing, etc.</p>
            {err("service_type")}
          </div>

          <div>
            <label htmlFor="notes" className="mb-2 block font-medium text-gray-700">
              Notes
            </label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={field} />
            {err("notes")}
          </div>

          <div>
            <label htmlFor="document" className="mb-2 block font-medium text-gray-700">
              Upload Document <span className="text-sm text-gray-500">(Optional)</span>
            </label>
            {/* Same accept list as the original picker; the server-side rule only allows PDF, DOC and DOCX. */}
            <input
              id="document"
              type="file"
              accept=".pdf,.jpeg,.docx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setDoc(f ? { name: f.name, size: f.size, type: f.type } : null);
              }}
              className="block w-full cursor-pointer rounded border border-gray-300 px-3 py-2 text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">Demo: only the file name and size are kept. Nothing is uploaded.</p>
            {err("document")}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            Submit Request
          </button>
        </form>
      </div>
      <p className="mt-6 text-center">
        <Link href="/writing-service-requests" className="font-semibold text-teal-600 hover:text-teal-700">
          View My Requests
        </Link>
      </p>

      <SourceNote
        files={[
          "src/Controller/WritingServiceRequestsController.php → add(), _handleDocumentUpload()",
          "src/Model/Table/WritingServiceRequestsTable.php → validationDefault(), beforeSave()",
          "templates/WritingServiceRequests/add.php",
        ]}
      />
    </div>
  );
}
