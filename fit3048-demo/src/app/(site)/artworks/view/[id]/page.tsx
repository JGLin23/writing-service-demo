"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArtworkImage } from "@/components/ArtworkImage";
import { useNotices } from "@/components/Notices";
import { Loading, NotFound, SourceNote } from "@/components/ui";
import { addToCart, stockOf } from "@/lib/actions";
import { plainNumber } from "@/lib/format";
import { update, useDemo } from "@/lib/store";

const orderMap: Record<string, number> = { A3: 1, A2: 2, A1: 3 };
const orderPrintType: Record<string, number> = { canvas: 1, print: 2 };

/** ArtworksController::view() + templates/Artworks/view.php */
export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const s = useDemo();
  const notices = useNotices();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [showToast, setShowToast] = useState(false);

  const art = s?.artworks.find((a) => a.artwork_id === id && !a.is_deleted);
  const sortedVariants = (art?.artwork_variants ?? [])
    .filter((v) => v.price > 0)
    .sort((a, b) => orderMap[a.dimension] * 10 + orderPrintType[a.print_type] - (orderMap[b.dimension] * 10 + orderPrintType[b.print_type]));

  // The first variant is pre-selected, like the original radio group.
  useEffect(() => {
    if (variantId === null && sortedVariants[0]) setVariantId(sortedVariants[0].artwork_variant_id);
  }, [variantId, sortedVariants]);

  if (!s) return <Loading />;
  if (!art) return <NotFound what="Artwork" />;

  // remaining = stock minus the copies already in this user's cart
  const inCart = s.cart[art.artwork_id] ?? 0;
  const remaining = Math.max(0, stockOf(art) - inCart);
  const totalEditions = 5;
  const soldCount = totalEditions - remaining + 1; // same formula as the template
  const displayPrice = sortedVariants.length ? Math.min(...sortedVariants.map((v) => v.price)) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId) {
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const q = Math.min(Math.max(1, qty), remaining);
    addToCart(art.artwork_id, q);
    setQty(1);
    notices.toast("Added to the mock cart", "The real form posts to Carts::add(). The cart and checkout were built by teammates, so they aren't in this demo.");
  };

  return (
    <div>
      {showToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md rounded border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800 shadow-lg" role="alert">
          <p className="font-bold">Please Select a Size &amp; Print Type</p>
          <p className="mt-1 text-sm">
            Before adding to cart, please choose your preferred size (A1, A2, or A3) and print type (Canvas or Print) from the options below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-lg bg-white p-4 shadow-lg">
          <ArtworkImage art={art} kind="wm" className="max-h-96 w-full rounded-lg object-cover" />
        </div>

        <div className="space-y-6">
          <Link href="/artworks" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            ← Back to Gallery
          </Link>

          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-800">{art.title}</h1>
            {art.availability_status !== "sold" && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                Limited Edition {soldCount} of {totalEditions}
              </span>
            )}
          </div>

          <p className="text-base text-gray-700">{art.description}</p>

          <div className="space-y-3 border-t border-gray-200 py-4">
            {displayPrice !== null && <p className="text-2xl font-bold text-gray-800">From ${plainNumber(displayPrice)}</p>}
            <p className="text-gray-600">📍 Ships from Australia</p>
            <p className="text-gray-600">🚚 Estimated to ship in 3–7 days within Australia</p>
          </div>

          {art.availability_status === "sold" ? (
            <div className="rounded-lg bg-red-100 px-4 py-3 text-center font-semibold text-red-700">Sold Out</div>
          ) : remaining === 0 ? (
            <div className="rounded-lg bg-yellow-100 px-4 py-3 font-semibold text-yellow-700">
              You&rsquo;ve added all available copies to your cart. Please review your cart or proceed to checkout.
              <button
                type="button"
                onClick={() =>
                  update((d) => {
                    delete d.cart[art.artwork_id];
                  })
                }
                className="mt-2 block text-sm font-normal text-yellow-900 underline"
              >
                Demo: empty the mock cart for this artwork
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <fieldset className="mb-6">
                <legend className="mb-3 block font-medium text-gray-700">Select Size &amp; Print Type</legend>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {sortedVariants.map((v) => {
                    const checked = variantId === v.artwork_variant_id;
                    return (
                      <label
                        key={v.artwork_variant_id}
                        className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition ${
                          checked ? "border-indigo-600 bg-indigo-100" : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="artwork_variant_id"
                          value={v.artwork_variant_id}
                          checked={checked}
                          onChange={() => setVariantId(v.artwork_variant_id)}
                          className="sr-only"
                        />
                        <span className="mb-1 font-semibold">{v.dimension}</span>
                        <span className="text-sm text-gray-600">{v.print_type[0].toUpperCase() + v.print_type.slice(1)}</span>
                        <span className="mt-2 font-medium text-indigo-600">${plainNumber(v.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mb-6">
                <label className="mb-2 block font-medium text-gray-700" htmlFor="quantity">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={remaining}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-24 rounded-lg border p-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
                  />
                  <span className="text-sm text-gray-600">({remaining} available)</span>
                </div>
              </div>

              <button type="submit" className="w-full rounded-lg bg-indigo-600 px-8 py-3 text-white transition hover:bg-indigo-700 md:w-auto">
                🛒 Add to Cart
              </button>
            </form>
          )}

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">ⓘ Taxes and shipping fees will apply upon checkout</div>
        </div>
      </div>

      <SourceNote
        files={[
          "src/Controller/ArtworksController.php → view() (remaining = stock − in cart)",
          "src/Model/Entity/Artwork.php → _getStock(), _getImageUrl()",
          "templates/Artworks/view.php",
        ]}
      />
    </div>
  );
}
