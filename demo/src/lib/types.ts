// Field names mirror the CakePHP entities / MySQL columns in the original project
// (writing_service_requests, request_messages, writing_service_payments,
// request_documents, artworks, artwork_variants, content_blocks).

export type UserType = "admin" | "customer";

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: UserType;
}

export type RequestStatus = "pending" | "in_progress" | "completed" | "canceled";

export interface DocMeta {
  name: string;
  size: number;
  type: string;
}

export interface WritingServiceRequest {
  writing_service_request_id: string; // R-XX12345
  user_id: string;
  service_title: string;
  service_type: string;
  notes: string;
  request_status: RequestStatus;
  final_price: number | null;
  document: DocMeta | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequestMessage {
  request_message_id: string; // UUID
  writing_service_request_id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type PaymentStatus = "pending" | "paid";

export interface WritingServicePayment {
  writing_service_payment_id: number;
  writing_service_request_id: string;
  amount: number;
  transaction_id: string | null;
  payment_date: string | null;
  payment_method: string;
  status: PaymentStatus;
  created_at: string;
}

export interface RequestDocument {
  request_document_id: string;
  writing_service_request_id: string;
  user_id: string;
  document_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: "admin" | "customer";
  created_at: string;
}

export type Dimension = "A3" | "A2" | "A1";
export type PrintType = "canvas" | "print";

export interface ArtworkVariant {
  artwork_variant_id: string;
  dimension: Dimension;
  print_type: PrintType;
  price: number;
}

export interface SampleArtSpec {
  seed: number;
  sky: [string, string];
  sun: string;
  hills: [string, string, string];
}

export interface Artwork {
  artwork_id: string;
  title: string;
  description: string;
  availability_status: "available" | "sold";
  max_copies: number;
  /** Stands in for copies sold in confirmed/completed orders (the orders module is not part of this demo). */
  sold_copies: number;
  artwork_variants: ArtworkVariant[];
  is_deleted: boolean;
  created_at: string;
  /** Bumped every time a new image is processed, so pages reload the stored images. */
  image_version: number;
  /** Present for the generated sample artworks (no real photos are bundled). */
  sample: SampleArtSpec | null;
  /** Demo-only: details of the last watermark run, shown on the admin edit page. */
  watermark_info?: WatermarkInfo | null;
}

export interface WatermarkInfo {
  width: number;
  height: number;
  fontSizePt: number;
  angleDeg: number;
  text: string;
  bytes: number;
  created_at: string;
}

export interface ContentBlock {
  slug: string;
  label: string;
  description: string;
  type: "text";
  value: string;
  previous_value: string | null;
  updated_at: string;
}

export interface DemoState {
  version: number;
  clientId: string;
  adminId: string;
  users: User[];
  requests: WritingServiceRequest[];
  messages: RequestMessage[];
  payments: WritingServicePayment[];
  documents: RequestDocument[];
  contentBlocks: ContentBlock[];
  artworks: Artwork[];
  /** Mock cart for the demo client: artwork_id -> quantity. */
  cart: Record<string, number>;
  nextPaymentId: number;
}
