"use client";

import { useActionState } from "react";
import { FormError } from "@/components/form";
import {
  approveShipment,
  rejectShipment,
  cancelShipment,
  type DealerState,
} from "../dealers/actions";

export default function ShipmentActions({
  shipmentId,
  status,
}: {
  shipmentId: string;
  status: string;
}) {
  const [approveState, approveAction] = useActionState<DealerState, FormData>(
    approveShipment,
    {}
  );
  const [rejectState, rejectAction] = useActionState<DealerState, FormData>(
    rejectShipment,
    {}
  );
  const [cancelState, cancelAction] = useActionState<DealerState, FormData>(
    cancelShipment,
    {}
  );

  if (status === "TALEP") {
    return (
      <div className="flex items-center justify-end gap-3">
        <form action={approveAction} data-approve={shipmentId}>
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <button
            type="submit"
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            Onayla
          </button>
          <FormError message={approveState.error} />
        </form>
        <form action={rejectAction} data-reject={shipmentId}>
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <input type="hidden" name="reason" value="Admin reddi" />
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Reddet
          </button>
          <FormError message={rejectState.error} />
        </form>
      </div>
    );
  }

  if (status === "ONAYLANDI") {
    return (
      <form action={cancelAction} data-cancel={shipmentId} className="text-right">
        <input type="hidden" name="shipmentId" value={shipmentId} />
        <input type="hidden" name="reason" value="Admin iptali" />
        <button
          type="submit"
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          İptal Et
        </button>
        <FormError message={cancelState.error} />
      </form>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}
