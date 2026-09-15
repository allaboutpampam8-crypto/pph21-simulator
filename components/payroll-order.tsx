"use client";

export type PayrollOrderKey =
  | "salary"
  | "allowance"
  | "overtime"
  | "holidayAllowance"
  | "bonus"
  | "other";

export interface PayrollOrderItem {
  key: PayrollOrderKey;
  label: string;
  amount: number;
}

interface PayrollOrderProps {
  items: PayrollOrderItem[];
  order: PayrollOrderKey[];
  onChange: (order: PayrollOrderKey[]) => void;
}

function moveItem(
  order: PayrollOrderKey[],
  index: number,
  direction: -1 | 1,
) {
  const newIndex = index + direction;

  if (
    newIndex < 0 ||
    newIndex >= order.length
  ) {
    return order;
  }

  const next = [...order];

  [next[index], next[newIndex]] = [
    next[newIndex],
    next[index],
  ];

  return next;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PayrollOrder({
  items,
  order,
  onChange,
}: PayrollOrderProps) {
  const activeItems = order
    .map((key) =>
      items.find(
        (item) => item.key === key,
      ),
    )
    .filter(
      (item): item is PayrollOrderItem =>
        item !== undefined,
    )
    .filter(
      (item) => item.amount > 0,
    );

  if (activeItems.length < 2) {
    return null;
  }

  const handleMove = (
    index: number,
    direction: -1 | 1,
  ) => {
    onChange(
      moveItem(
        order,
        order.findIndex(
          (key) =>
            key === activeItems[index].key,
        ),
        direction,
      ),
    );
  };

  const handleReset = () => {
    onChange([
      "salary",
      "allowance",
      "overtime",
      "holidayAllowance",
      "bonus",
      "other",
    ]);
  };

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold tracking-wide text-amber-700">
          URUTAN PROSES PAYROLL
        </p>

        <h3 className="mt-1 text-xl font-bold text-slate-900">
          Urutan Gross-Up
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Atur urutan pembayaran sesuai
          proses payroll yang ingin
          disimulasikan. Urutan ini khusus
          untuk mekanisme Gross-Up dan
          Re-Gross-Up, bukan untuk mengubah
          PPh 21 resmi masa pajak.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-4">
        <p className="text-xs leading-5 text-amber-800">
          <strong>Catatan:</strong> PPh 21
          resmi tetap dihitung dari total
          bruto masa pajak menggunakan TER.
          Pengaturan di bawah hanya
          menentukan urutan proses pada
          simulasi payroll Gross-Up.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {activeItems.map(
          (item, index) => {
            const isFirst =
              index === 0;

            const isLast =
              index ===
              activeItems.length - 1;

            return (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-amber-700">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {item.label}
                  </p>

                  <p className="text-xs text-slate-500">
                    Rp{" "}
                    {formatRupiah(
                      item.amount,
                    )}
                  </p>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Pindahkan ${item.label} ke atas`}
                    disabled={isFirst}
                    onClick={() =>
                      handleMove(
                        index,
                        -1,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    aria-label={`Pindahkan ${item.label} ke bawah`}
                    disabled={isLast}
                    onClick={() =>
                      handleMove(
                        index,
                        1,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          },
        )}
      </div>

      <button
        type="button"
        onClick={handleReset}
        className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Kembalikan ke Urutan Default
      </button>
    </section>
  );
}