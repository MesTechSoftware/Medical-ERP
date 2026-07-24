"use client";

import { toggleDealerStatus } from "../actions";

export default function StatusToggle({
  dealerId,
  active,
}: {
  dealerId: string;
  active: boolean;
}) {
  return (
    <form action={toggleDealerStatus.bind(null, dealerId)}>
      <button
        type="submit"
        className={
          "rounded-lg px-3 py-1.5 text-sm font-medium " +
          (active
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-green-50 text-green-700 hover:bg-green-100")
        }
      >
        {active ? "Pasifleştir" : "Aktifleştir"}
      </button>
    </form>
  );
}
