import type {
  Artwork,
  ArtworkVariant,
  ContentBlock,
  DemoState,
  Dimension,
  PrintType,
  RequestMessage,
  User,
  WritingServicePayment,
  WritingServiceRequest,
} from "./types";

export const STATE_VERSION = 1;

/** All people and data below are fictional. No real client or user data is used. */
export const ADMIN_ID = "u-admin";
export const CLIENT_ID = "u-alex";

/** Text the original paymentRequest message uses (Admin\WritingServiceRequestsController::sendPaymentRequest). */
export function paymentRequestText(description: string, amount: number, paymentId: number): string {
  const formatted = "$" + amount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    "**Payment Request**\n\n" +
    `**Service:** ${description}\n` +
    `**Amount:** ${formatted}\n\n` +
    "Please click the button below to complete your payment. Once payment is processed, you'll receive a confirmation and we'll continue with your request.\n\n" +
    `[PAYMENT_BUTTON]${paymentId}[/PAYMENT_BUTTON]`
  );
}

/** Text of WritingServiceRequestsController::_addPaymentConfirmationMessage(). */
export function paymentConfirmationText(amount: number, paidAtIso: string, paymentRef: string): string {
  const formatted = "$" + amount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const d = new Date(paidAtIso);
  const date =
    // PHP date('F j, Y \a\t g:i A'), e.g. "November 20, 2026 at 4:45 PM"
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return (
    "[PAYMENT_CONFIRMATION]\n\n" +
    "**Payment Confirmation**\n\n" +
    `Your payment of **${formatted}** has been successfully processed on ${date}.\n\n` +
    `Payment ID: ${paymentRef}\n\n` +
    "Thank you for your payment. We'll now begin work on your writing service request."
  );
}

function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function variants(prefix: string, prices: Record<string, number>): ArtworkVariant[] {
  const out: ArtworkVariant[] = [];
  (["A3", "A2", "A1"] as Dimension[]).forEach((dimension) => {
    (["canvas", "print"] as PrintType[]).forEach((print_type) => {
      const price = prices[`${dimension}-${print_type}`] ?? 0;
      if (price > 0) {
        out.push({ artwork_variant_id: `${prefix}-${dimension}-${print_type}`, dimension, print_type, price });
      }
    });
  });
  return out;
}

export function createSeedState(): DemoState {
  const users: User[] = [
    { user_id: ADMIN_ID, first_name: "Studio", last_name: "Admin", email: "admin@example.test", user_type: "admin" },
    { user_id: CLIENT_ID, first_name: "Alex", last_name: "Chen", email: "alex@example.test", user_type: "customer" },
    { user_id: "u-priya", first_name: "Priya", last_name: "Nair", email: "priya@example.test", user_type: "customer" },
    { user_id: "u-sam", first_name: "Sam", last_name: "Wilson", email: "sam@example.test", user_type: "customer" },
    { user_id: "u-mia", first_name: "Mia", last_name: "Rossi", email: "mia@example.test", user_type: "customer" },
    { user_id: "u-jordan", first_name: "Jordan", last_name: "Lee", email: "jordan@example.test", user_type: "customer" },
  ];

  const req = (
    id: string,
    user_id: string,
    service_title: string,
    service_type: string,
    notes: string,
    request_status: WritingServiceRequest["request_status"],
    final_price: number | null,
    createdDaysAgo: number,
    document: WritingServiceRequest["document"] = null,
  ): WritingServiceRequest => ({
    writing_service_request_id: id,
    user_id,
    service_title,
    service_type,
    notes,
    request_status,
    final_price,
    document,
    is_deleted: false,
    created_at: daysAgo(createdDaysAgo, 9, 15),
    updated_at: daysAgo(Math.max(0, createdDaysAgo - 1), 9, 15),
  });

  const requests: WritingServiceRequest[] = [
    req(
      "R-KT48213",
      CLIENT_ID,
      "Proofread my short story collection",
      "Proofreading and line editing for six short stories (about 18,000 words)",
      "Australian English please. I mostly need typos and punctuation fixed, plus a light line edit where sentences feel clunky.",
      "in_progress",
      180,
      12,
      { name: "short-stories-draft.pdf", size: 482133, type: "application/pdf" },
    ),
    req(
      "R-MP20577",
      CLIENT_ID,
      "Cover letter review",
      "Editing and feedback on a one-page cover letter",
      "Applying for graduate roles. Happy for you to suggest a stronger opening.",
      "completed",
      60,
      70,
    ),
    req("R-DW91342", "u-priya", "Grant application editing", "Structural edit of a 4-page community arts grant", "Deadline is in three weeks.", "pending", null, 1),
    req("R-NA16884", "u-priya", "Newsletter templates", "Copywriting for three reusable newsletter templates", "", "pending", null, 5),
    req("R-SB33018", "u-sam", "Website copy for a café", "Copywriting: home, menu and about pages", "Friendly, local tone.", "in_progress", 240, 35),
    req("R-HL05629", "u-mia", "Memoir chapter structural edit", "Structural edit of two memoir chapters", "", "completed", 320, 150),
    req("R-QF72460", "u-jordan", "Academic essay proofreading", "Proofreading a 3,000-word essay", "", "canceled", null, 95),
    req("R-EV58132", "u-sam", "Product descriptions", "Copywriting for 20 short product descriptions", "", "completed", 150, 220),
  ];

  const payments: WritingServicePayment[] = [
    { writing_service_payment_id: 1, writing_service_request_id: "R-MP20577", amount: 60, transaction_id: "mock_txn_7Q2L", payment_date: daysAgo(68, 14, 5), payment_method: "stripe", status: "paid", created_at: daysAgo(69, 11) },
    { writing_service_payment_id: 2, writing_service_request_id: "R-SB33018", amount: 240, transaction_id: "mock_txn_K81D", payment_date: daysAgo(33, 16, 40), payment_method: "stripe", status: "paid", created_at: daysAgo(34, 10) },
    { writing_service_payment_id: 3, writing_service_request_id: "R-HL05629", amount: 320, transaction_id: "mock_txn_3VZP", payment_date: daysAgo(146, 9, 20), payment_method: "stripe", status: "paid", created_at: daysAgo(148, 10) },
    { writing_service_payment_id: 4, writing_service_request_id: "R-EV58132", amount: 150, transaction_id: "mock_txn_P0ML", payment_date: daysAgo(215, 13, 0), payment_method: "stripe", status: "paid", created_at: daysAgo(217, 10) },
    { writing_service_payment_id: 5, writing_service_request_id: "R-KT48213", amount: 180, transaction_id: null, payment_date: null, payment_method: "stripe", status: "pending", created_at: daysAgo(10, 15, 30) },
  ];

  let m = 0;
  const msg = (
    requestId: string,
    user_id: string,
    message: string,
    created_at: string,
    is_read = true,
  ): RequestMessage => ({
    request_message_id: `seed-msg-${String(++m).padStart(3, "0")}`,
    writing_service_request_id: requestId,
    user_id,
    message,
    is_read,
    created_at,
  });

  const messages: RequestMessage[] = [
    msg("R-KT48213", ADMIN_ID, "Hi Alex, thanks for your request. I've read the first two stories and I'm happy to proofread the full collection. I'll send a payment request so we can get started.", daysAgo(11, 10, 2)),
    msg("R-KT48213", ADMIN_ID, "Status Update: Your request is now in progress. We are actively working on it.", daysAgo(11, 10, 3)),
    msg("R-KT48213", ADMIN_ID, paymentRequestText("Writing Service: Proofread my short story collection", 180, 5), daysAgo(10, 15, 30)),
    msg("R-KT48213", CLIENT_ID, "Thanks! Quick question: could you also check that character names are consistent across the stories?", daysAgo(2, 19, 12), false),

    msg("R-MP20577", ADMIN_ID, "Hi Alex, happy to help with your cover letter. Payment request below.", daysAgo(69, 11, 0)),
    msg("R-MP20577", ADMIN_ID, paymentRequestText("Writing Service: Cover letter review", 60, 1), daysAgo(69, 11, 1)),
    msg("R-MP20577", CLIENT_ID, paymentConfirmationText(60, daysAgo(68, 14, 5), "mock_txn_7Q2L"), daysAgo(68, 14, 5)),
    msg("R-MP20577", ADMIN_ID, "I've uploaded the edited version with tracked changes. I tightened the opening and moved your project experience up.", daysAgo(66, 9, 40)),
    msg("R-MP20577", ADMIN_ID, "Status Update: Great news! Your request has been marked as completed.", daysAgo(66, 9, 41)),

    msg("R-SB33018", ADMIN_ID, "Hi Sam, thanks for the brief. Payment request below.", daysAgo(34, 10, 0)),
    msg("R-SB33018", ADMIN_ID, paymentRequestText("Writing Service: Website copy for a café", 240, 2), daysAgo(34, 10, 1)),
    msg("R-SB33018", "u-sam", "Paid, thanks. Looking forward to the first draft.", daysAgo(33, 16, 45), false),
  ];

  const contentBlocks: ContentBlock[] = [
    {
      slug: "watermark-text",
      label: "Watermark Text",
      description: "This is the text that will be display for the watermark.",
      type: "text",
      value: "Sample Studio",
      previous_value: null,
      updated_at: daysAgo(30),
    },
  ];

  const art = (
    artwork_id: string,
    title: string,
    description: string,
    availability_status: Artwork["availability_status"],
    sold_copies: number,
    prices: Record<string, number>,
    sample: Artwork["sample"],
    createdDaysAgo: number,
  ): Artwork => ({
    artwork_id,
    title,
    description,
    availability_status,
    max_copies: 5,
    sold_copies,
    artwork_variants: variants(artwork_id, prices),
    is_deleted: false,
    created_at: daysAgo(createdDaysAgo),
    image_version: 1,
    sample,
  });

  const artworks: Artwork[] = [
    art(
      "a-harbour",
      "Harbour at Dusk",
      "Sample artwork generated in the browser for this demo. Layered hills over a warm evening sky.",
      "available",
      1,
      { "A3-print": 120, "A3-canvas": 180, "A2-print": 160, "A2-canvas": 240, "A1-canvas": 320 },
      { seed: 11, sky: ["#2b2d5c", "#f3a76b"], sun: "#ffd9a0", hills: ["#6b4e71", "#3f3557", "#1f1b33"] },
      40,
    ),
    art(
      "a-saltbush",
      "Saltbush Morning",
      "Sample artwork generated in the browser for this demo. Soft greens and a pale morning sun.",
      "available",
      0,
      { "A3-print": 110, "A3-canvas": 170, "A2-print": 150, "A2-canvas": 230, "A1-print": 210, "A1-canvas": 310 },
      { seed: 23, sky: ["#cfe6e3", "#f6efd8"], sun: "#fff6d6", hills: ["#9db89a", "#6e8f6c", "#41593f"] },
      32,
    ),
    art(
      "a-granite",
      "Granite Ridge",
      "Sample artwork generated in the browser for this demo. Cool blues over a rocky ridge line.",
      "available",
      3,
      { "A3-print": 130, "A2-print": 175, "A2-canvas": 260, "A1-canvas": 340 },
      { seed: 37, sky: ["#1d3557", "#a8c5e2"], sun: "#e9f2fb", hills: ["#7d8fa6", "#4f5d75", "#2b3445"] },
      25,
    ),
    art(
      "a-orchard",
      "Winter Orchard",
      "Sample artwork generated in the browser for this demo. Muted plum and grey tones.",
      "available",
      2,
      { "A3-print": 115, "A3-canvas": 175, "A2-canvas": 235 },
      { seed: 41, sky: ["#4a3f55", "#d9c7d2"], sun: "#f4e9ef", hills: ["#8a7387", "#5e4c60", "#352a38"] },
      18,
    ),
    art(
      "a-tide",
      "Tide Lines",
      "Sample artwork generated in the browser for this demo. Deep teal water lines at low tide.",
      "sold",
      5,
      { "A3-print": 125, "A2-canvas": 250 },
      { seed: 53, sky: ["#0b3c49", "#79c2c7"], sun: "#e3fbfb", hills: ["#2f7f86", "#1d5c63", "#0d353a"] },
      60,
    ),
  ];

  return {
    version: STATE_VERSION,
    clientId: CLIENT_ID,
    adminId: ADMIN_ID,
    users,
    requests,
    messages,
    payments,
    documents: [
      {
        request_document_id: "doc-1",
        writing_service_request_id: "R-MP20577",
        user_id: ADMIN_ID,
        document_name: "cover-letter-edited.docx",
        file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size: 28412,
        uploaded_by: "admin",
        created_at: daysAgo(66, 9, 38),
      },
    ],
    contentBlocks,
    artworks,
    cart: {},
    nextPaymentId: 6,
  };
}
