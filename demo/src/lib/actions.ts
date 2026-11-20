"use client";

import { newRequestId, uuid } from "./ids";
import { humanize } from "./format";
import { paymentConfirmationText, paymentRequestText } from "./seed";
import { getState, update } from "./store";
import type { Artwork, ArtworkVariant, DocMeta, DemoState, RequestStatus, WatermarkInfo } from "./types";

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Validation (WritingServiceRequestsTable::validationDefault + _handleDocumentUpload)
// ---------------------------------------------------------------------------

export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

export interface RequestInput {
  service_title: string;
  service_type: string;
  notes: string;
  document: DocMeta | null;
}

export function validateRequest(input: RequestInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.service_title.trim()) errors.service_title = "This field cannot be left empty";
  else if (input.service_title.length > 100) errors.service_title = "The provided value must be at most `100` characters long";
  if (!input.service_type.trim()) errors.service_type = "This field cannot be left empty";
  else if (input.service_type.length > 200) errors.service_type = "The provided value must be at most `200` characters long";
  if (input.notes.length > 1000) errors.notes = "The provided value must be at most `1000` characters long";
  if (input.document && !ALLOWED_DOC_TYPES.includes(input.document.type)) {
    errors.document = "Invalid file type. Please upload PDF or Word documents only.";
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Writing service requests
// ---------------------------------------------------------------------------

/** WritingServiceRequestsController::add() */
export function createRequest(input: RequestInput): string {
  const s = getState();
  const id = newRequestId(new Set(s.requests.map((r) => r.writing_service_request_id)));
  const t = now();
  update((d) => {
    d.requests.push({
      writing_service_request_id: id,
      user_id: d.clientId,
      service_title: input.service_title.trim(),
      service_type: input.service_type.trim(),
      notes: input.notes,
      request_status: "pending",
      final_price: null,
      document: input.document,
      is_deleted: false,
      created_at: t,
      updated_at: t,
    });
  });
  return id;
}

/** markMessagesAsRead(): mark messages from the other side as read. */
export function markMessagesAsRead(requestId: string, viewerId: string): void {
  const s = getState();
  const hasUnread = s.messages.some(
    (m) => m.writing_service_request_id === requestId && m.user_id !== viewerId && !m.is_read,
  );
  if (!hasUnread) return;
  update((d) => {
    d.messages.forEach((m) => {
      if (m.writing_service_request_id === requestId && m.user_id !== viewerId && !m.is_read) m.is_read = true;
    });
  });
}

function pushMessage(d: DemoState, requestId: string, userId: string, text: string) {
  d.messages.push({
    request_message_id: uuid(),
    writing_service_request_id: requestId,
    user_id: userId,
    message: text,
    is_read: false,
    created_at: now(),
  });
}

/** Client reply posted to WritingServiceRequestsController::view(). */
export function clientReply(requestId: string, text: string): void {
  update((d) => pushMessage(d, requestId, d.clientId, text));
}

/** Admin\WritingServiceRequestsController::sendMessage(): first reply moves pending -> in_progress. */
export function adminReply(requestId: string, text: string): { statusChanged: boolean } {
  let statusChanged = false;
  update((d) => {
    pushMessage(d, requestId, d.adminId, text);
    const r = d.requests.find((x) => x.writing_service_request_id === requestId);
    if (r && r.request_status === "pending") {
      r.request_status = "in_progress";
      r.updated_at = now();
      statusChanged = true;
    }
  });
  return { statusChanged };
}

/** Admin\WritingServiceRequestsController::updateStatus() + sendStatusChangeMessage() */
export function updateStatus(requestId: string, status: RequestStatus): void {
  const statusMessage =
    status === "in_progress"
      ? "Your request is now in progress. We are actively working on it."
      : status === "completed"
        ? "Great news! Your request has been marked as completed."
        : "The status of your request has been updated to: " + humanize(status);
  update((d) => {
    const r = d.requests.find((x) => x.writing_service_request_id === requestId);
    if (!r) return;
    r.request_status = status;
    r.updated_at = now();
    pushMessage(d, requestId, d.adminId, "Status Update: " + statusMessage);
  });
}

/** Admin\WritingServiceRequestsController::sendPaymentRequest() */
export function sendPaymentRequest(requestId: string, amount: number, description: string): number {
  let paymentId = 0;
  update((d) => {
    paymentId = d.nextPaymentId++;
    d.payments.push({
      writing_service_payment_id: paymentId,
      writing_service_request_id: requestId,
      amount,
      transaction_id: null,
      payment_date: null,
      payment_method: "stripe",
      status: "pending",
      created_at: now(),
    });
    pushMessage(d, requestId, d.adminId, paymentRequestText(description, amount, paymentId));
  });
  return paymentId;
}

/**
 * Mock of the Stripe Checkout round trip: pay() -> Stripe -> paymentSuccess().
 * Marks the payment paid and adds the [PAYMENT_CONFIRMATION] message,
 * once per payment, like _addPaymentConfirmationMessage().
 */
export function completeMockPayment(requestId: string, paymentId: number): void {
  update((d) => {
    const p = d.payments.find((x) => x.writing_service_payment_id === paymentId);
    if (!p || p.status === "paid") return;
    const t = now();
    p.status = "paid";
    p.payment_date = t;
    p.transaction_id = "mock_txn_" + Math.random().toString(36).slice(2, 6).toUpperCase();
    pushMessage(d, requestId, d.clientId, paymentConfirmationText(p.amount, t, p.transaction_id));
  });
}

/** uploadDocument() on both sides: the demo stores file metadata only. */
export function addDocument(requestId: string, file: DocMeta, by: "admin" | "customer"): void {
  update((d) => {
    d.documents.push({
      request_document_id: uuid(),
      writing_service_request_id: requestId,
      user_id: by === "admin" ? d.adminId : d.clientId,
      document_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: by,
      created_at: now(),
    });
  });
}

// ---------------------------------------------------------------------------
// Content blocks & artworks
// ---------------------------------------------------------------------------

export function getWatermarkText(s: DemoState): string {
  return s.contentBlocks.find((b) => b.slug === "watermark-text")?.value ?? "";
}

export function updateContentBlock(slug: string, value: string): void {
  update((d) => {
    const b = d.contentBlocks.find((x) => x.slug === slug);
    if (!b) return;
    b.previous_value = b.value;
    b.value = value;
    b.updated_at = now();
  });
}

export function restorePreviousValue(slug: string): void {
  update((d) => {
    const b = d.contentBlocks.find((x) => x.slug === slug);
    if (!b || b.previous_value === null) return;
    const v = b.value;
    b.value = b.previous_value;
    b.previous_value = v;
    b.updated_at = now();
  });
}

export interface ArtworkInput {
  title: string;
  description: string;
  max_copies: number;
  /** "A3-canvas" -> price. Empty or 0 prices are dropped, like the original add()/edit(). */
  prices: Record<string, number>;
}

function buildVariants(artworkId: string, prices: Record<string, number>): ArtworkVariant[] {
  const out: ArtworkVariant[] = [];
  (["A3", "A2", "A1"] as const).forEach((dimension) =>
    (["canvas", "print"] as const).forEach((print_type) => {
      const price = prices[`${dimension}-${print_type}`];
      if (price && price > 0) {
        out.push({ artwork_variant_id: `${artworkId}-${dimension}-${print_type}`, dimension, print_type, price });
      }
    }),
  );
  return out;
}

export function createArtwork(input: ArtworkInput): string {
  const id = uuid();
  update((d) => {
    const art: Artwork = {
      artwork_id: id,
      title: input.title,
      description: input.description,
      availability_status: "available",
      max_copies: input.max_copies,
      sold_copies: 0,
      artwork_variants: buildVariants(id, input.prices),
      is_deleted: false,
      created_at: now(),
      image_version: 0,
      sample: null,
    };
    d.artworks.push(art);
  });
  return id;
}

export function updateArtwork(id: string, input: ArtworkInput): void {
  update((d) => {
    const a = d.artworks.find((x) => x.artwork_id === id);
    if (!a) return;
    a.title = input.title;
    a.description = input.description;
    a.max_copies = input.max_copies;
    a.artwork_variants = buildVariants(id, input.prices);
  });
}

export function recordWatermark(id: string, info: WatermarkInfo): void {
  update((d) => {
    const a = d.artworks.find((x) => x.artwork_id === id);
    if (!a) return;
    a.image_version += 1;
    a.watermark_info = info;
  });
}

export function setArtworkStatus(id: string, status: Artwork["availability_status"]): void {
  update((d) => {
    const a = d.artworks.find((x) => x.artwork_id === id);
    if (a) a.availability_status = status;
  });
}

export function deleteArtwork(id: string): void {
  update((d) => {
    const a = d.artworks.find((x) => x.artwork_id === id);
    if (a) a.is_deleted = true;
  });
}

/** Artwork::_getStock(): max_copies minus copies sold in confirmed/completed orders. */
export function stockOf(a: Artwork): number {
  return Math.max(a.max_copies - a.sold_copies, 0);
}

export function addToCart(artworkId: string, qty: number): void {
  update((d) => {
    d.cart[artworkId] = (d.cart[artworkId] ?? 0) + qty;
  });
}
