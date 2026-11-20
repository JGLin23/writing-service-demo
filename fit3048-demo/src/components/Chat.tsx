"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminReply, clientReply, markMessagesAsRead } from "@/lib/actions";
import { formatDateTime } from "@/lib/format";
import { getState } from "@/lib/store";
import type { DemoState, RequestMessage, User } from "@/lib/types";
import { MessageText } from "./MessageText";
import { useNotices } from "./Notices";

function threadOf(s: DemoState, requestId: string): RequestMessage[] {
  return s.messages
    .filter((m) => m.writing_service_request_id === requestId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function userOf(s: DemoState, id: string): User | undefined {
  return s.users.find((u) => u.user_id === id);
}

function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dep]);
  return ref;
}

/** A copy of the state where the other side's messages in this thread are read, without writing to the store. */
function withReadMarked(s: DemoState, requestId: string, viewerId: string): DemoState {
  return {
    ...s,
    messages: s.messages.map((m) =>
      m.writing_service_request_id === requestId && m.user_id !== viewerId && !m.is_read ? { ...m, is_read: true } : m,
    ),
  };
}

function ctrlEnter(onSubmit: () => void) {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };
}

// ---------------------------------------------------------------------------
// Client side: templates/WritingServiceRequests/view.php (Messages card)
// ---------------------------------------------------------------------------

/**
 * Like the original page, the thread is a snapshot that refreshChat() replaces
 * every 10 seconds (and 1 second after the tab becomes visible again) using getMessages().
 */
export function ClientChat({ requestId }: { requestId: string }) {
  const notices = useNotices();
  const [snapshot, setSnapshot] = useState<DemoState>(() => withReadMarked(getState(), requestId, getState().clientId));
  const [updating, setUpdating] = useState(false);
  const [text, setText] = useState("");
  const lastSignature = useRef(signature(snapshot, requestId));

  // view() marks the admin's messages as read when the client opens the page.
  useEffect(() => {
    markMessagesAsRead(requestId, getState().clientId);
  }, [requestId]);

  const refreshChat = useCallback(() => {
    setUpdating(true);
    const s = getState();
    markMessagesAsRead(requestId, s.clientId); // getMessages() marks admin messages as read
    const fresh = getState();
    const sig = signature(fresh, requestId);
    if (sig !== lastSignature.current) {
      lastSignature.current = sig;
      setSnapshot(fresh);
      // Original: shows the toast when the HTML changed and admin messages exist.
      if (threadOf(fresh, requestId).some((m) => userOf(fresh, m.user_id)?.user_type === "admin")) {
        notices.toast("New message from admin");
      }
    }
    window.setTimeout(() => setUpdating(false), 400);
  }, [requestId, notices]);

  useEffect(() => {
    const interval = window.setInterval(refreshChat, 10000);
    const onVisible = () => {
      if (!document.hidden) window.setTimeout(refreshChat, 1000);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshChat]);

  const thread = threadOf(snapshot, requestId);
  const payments = snapshot.payments.filter((p) => p.writing_service_request_id === requestId);
  const scrollRef = useAutoScroll(thread.length);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    clientReply(requestId, value);
    setText("");
    // The original form posts and the page reloads with the new message.
    const fresh = getState();
    lastSignature.current = signature(fresh, requestId);
    setSnapshot(fresh);
    notices.flash("success", "Message sent successfully.");
    notices.email("New message notification sent to the admin (new_message_notification).");
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md" id="messages">
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-4">
        <h2 className="text-lg font-bold text-white">Messages</h2>
        <span className="text-xs text-indigo-100">{updating ? "Updating…" : "Checks for new messages every 10 s"}</span>
      </div>
      <div className="p-4 sm:p-6">
        <div ref={scrollRef} className="mb-3 max-h-[470px] space-y-4 overflow-y-auto scroll-smooth pr-1">
          {thread.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-900">No messages</p>
              <p className="mt-1 text-sm text-gray-500">Start the conversation with the admin.</p>
            </div>
          ) : (
            thread.map((m) => {
              const isAdmin = userOf(snapshot, m.user_id)?.user_type === "admin";
              return (
                <div key={m.request_message_id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                  <div className="max-w-lg">
                    <div className="flex items-end gap-2">
                      {isAdmin && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-medium text-white">
                          A
                        </div>
                      )}
                      <div>
                        <div className={`rounded-lg px-4 py-2 text-sm ${isAdmin ? "bg-indigo-100 text-gray-800" : "bg-blue-600 text-white"}`}>
                          <MessageText
                            text={m.message}
                            side="client"
                            payments={payments}
                            payHref={(pid) => `/writing-service-requests/pay/${requestId}/${pid}`}
                          />
                        </div>
                        <div className={`mt-1 text-xs text-gray-500 ${isAdmin ? "" : "text-right"}`}>
                          {isAdmin ? "Admin" : "You"} · {formatDateTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor={`reply-${requestId}`} className="sr-only">
            Reply message
          </label>
          <textarea
            id={`reply-${requestId}`}
            rows={3}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={ctrlEnter(send)}
            placeholder="Type your message here..."
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          <small className="mt-1 block text-xs text-gray-500">Tip: Press Ctrl+Enter to send quickly</small>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function signature(s: DemoState, requestId: string): string {
  const thread = threadOf(s, requestId);
  const pay = s.payments
    .filter((p) => p.writing_service_request_id === requestId)
    .map((p) => `${p.writing_service_payment_id}:${p.status}`)
    .join(",");
  return thread.map((m) => m.request_message_id).join(",") + "|" + pay;
}

// ---------------------------------------------------------------------------
// Admin side: templates/Admin/WritingServiceRequests/view.php (Client Conversation card)
// ---------------------------------------------------------------------------

interface PendingMessage {
  id: string;
  message: string;
  created_at: string;
}

/**
 * Like the original admin page: the thread is rendered once on page load
 * (message polling is commented out there), and sent messages are appended
 * straight away by addMessageToChat() after the AJAX post to sendMessage().
 */
export function AdminChat({ requestId, reloadKey }: { requestId: string; reloadKey?: number }) {
  const notices = useNotices();
  const [snapshot, setSnapshot] = useState<DemoState>(() => withReadMarked(getState(), requestId, getState().adminId));
  const [appended, setAppended] = useState<PendingMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // view(): load the request, then markMessagesAsRead() on the same entities before rendering,
  // which is why the template's "New" badge doesn't show in practice.
  useEffect(() => {
    markMessagesAsRead(requestId, getState().adminId);
    if (reloadKey) {
      setSnapshot(withReadMarked(getState(), requestId, getState().adminId));
      setAppended([]);
    }
  }, [reloadKey, requestId]);

  const thread = threadOf(snapshot, requestId);
  const payments = snapshot.payments.filter((p) => p.writing_service_request_id === requestId);
  const scrollRef = useAutoScroll(thread.length + appended.length);

  const send = () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    window.setTimeout(() => {
      adminReply(requestId, value);
      setAppended((a) => [...a, { id: `pending-${Date.now()}`, message: value, created_at: new Date().toISOString() }]);
      setText("");
      setSending(false);
      notices.email("Customer message notification sent to the client (customer_message_notification).");
    }, 250);
  };

  const count = thread.length + appended.length;

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" id="messages">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h6 className="text-sm font-bold text-blue-700">Client Conversation</h6>
        <span className="rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white">{count} Messages</span>
      </div>
      <div className="p-2">
        <div ref={scrollRef} className="max-h-[500px] space-y-3 overflow-y-auto scroll-smooth p-2">
          {count === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No messages yet. Start the conversation with the client.</div>
          ) : (
            <>
              {thread.map((m) => {
                const u = userOf(snapshot, m.user_id);
                const isAdmin = u?.user_type === "admin";
                return (
                  <AdminBubble
                    key={m.request_message_id}
                    isAdmin={isAdmin}
                    name={isAdmin ? "You (Admin)" : `${u?.first_name ?? ""} ${u?.last_name ?? ""}`}
                    initial={isAdmin ? "A" : (u?.first_name ?? "C")[0]}
                    time={formatDateTime(m.created_at)}
                    showNew={!isAdmin && !m.is_read}
                  >
                    <MessageText text={m.message} side="admin" payments={payments} />
                  </AdminBubble>
                );
              })}
              {appended.map((m) => (
                <AdminBubble key={m.id} isAdmin name="You (Admin)" initial="A" time={formatDateTime(m.created_at)} showNew={false}>
                  <MessageText text={m.message} side="admin" payments={payments} />
                </AdminBubble>
              ))}
            </>
          )}
        </div>

        <form
          className="mt-3 border-t border-slate-200 px-2 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor={`admin-reply-${requestId}`} className="sr-only">
            Message to client
          </label>
          <textarea
            id={`admin-reply-${requestId}`}
            rows={3}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={ctrlEnter(send)}
            placeholder="Type your message here..."
            className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <small className="mt-1 block text-xs text-slate-500">Tip: Press Ctrl+Enter to send quickly</small>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminBubble({
  isAdmin,
  name,
  initial,
  time,
  showNew,
  children,
}: {
  isAdmin: boolean;
  name: string;
  initial: string;
  time: string;
  showNew: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={isAdmin ? "pl-6 sm:pl-12" : "pr-6 sm:pr-12"}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${isAdmin ? "bg-blue-600" : "bg-emerald-600"}`}>
          {initial}
        </span>
        <span className="font-bold text-slate-800">{name}</span>
        <span className="text-slate-500">🕒 {time}</span>
        {showNew && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">New</span>}
      </div>
      <div className={`rounded-lg p-3 text-sm ${isAdmin ? "bg-blue-50 text-slate-800" : "bg-slate-100 text-slate-800"}`}>{children}</div>
    </div>
  );
}
