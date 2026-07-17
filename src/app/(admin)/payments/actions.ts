"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { amountTLSchema } from "@/lib/validation";
import { PaymentMethod } from "@/generated/prisma/enums";

export type PaymentFormState = { error?: string; ok?: boolean };

function parseMethod(v: FormDataEntryValue | null): PaymentMethod {
  const s = String(v);
  return s in PaymentMethod ? (s as PaymentMethod) : PaymentMethod.TRANSFER;
}

export async function createPayment(
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  await requireAdmin();

  const sellerId = formData.get("sellerId") as string;
  const amountTL = Number(formData.get("amount"));
  const method = parseMethod(formData.get("method"));
  const note = ((formData.get("note") as string) || "").trim() || null;
  const dateStr = (formData.get("date") as string) || "";

  if (!sellerId) return { error: "Satıcı seçiniz." };
  if (!amountTLSchema.safeParse(amountTL).success)
    return { error: "Geçerli bir tutar giriniz." };

  const seller = await prisma.user.findFirst({
    where: { id: sellerId, role: "SELLER" },
  });
  if (!seller) return { error: "Satıcı bulunamadı." };

  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.payment.create({
    data: {
      sellerId,
      amount: tlToKurus(amountTL),
      method,
      note,
      date,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/sellers");
  revalidatePath("/dashboard");
  return { ok: true };
}
