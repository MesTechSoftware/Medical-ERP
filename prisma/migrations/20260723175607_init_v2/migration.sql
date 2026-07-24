-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SELLER', 'DEALER');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'PASSIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('AKTIF', 'IPTAL');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('HESAPLANDI', 'ONAYLANDI', 'ODENDI');

-- CreateEnum
CREATE TYPE "CongressStatus" AS ENUM ('TASLAK', 'YAYINDA', 'TAMAMLANDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "CongressRegistrationStatus" AS ENUM ('TALEP', 'ONAYLANDI', 'IPTAL', 'REDDEDILDI');

-- CreateEnum
CREATE TYPE "CongressLedgerType" AS ENUM ('EARN', 'SPEND', 'ADJUST', 'EXPIRE');

-- CreateEnum
CREATE TYPE "DealerShipmentStatus" AS ENUM ('TALEP', 'ONAYLANDI', 'IPTAL', 'REDDEDILDI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SELLER',
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commissionRate" DOUBLE PRECISION,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "specialty" TEXT,
    "clinic" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT,
    "email" TEXT,
    "phoneNormalized" TEXT NOT NULL,
    "ownerSellerId" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorAssignment" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toDate" TIMESTAMP(3),
    "assignedBy" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "DoctorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "netListPrice" BIGINT NOT NULL,
    "netMinPrice" BIGINT NOT NULL DEFAULT 0,
    "vatRate" INTEGER NOT NULL DEFAULT 20,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "orderId" TEXT,
    "dealerShipmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "netTotal" BIGINT NOT NULL,
    "vatTotal" BIGINT NOT NULL,
    "grossTotal" BIGINT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "netUnitPrice" BIGINT NOT NULL,
    "listPriceAtSale" BIGINT NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatRate" INTEGER NOT NULL,
    "vatAmount" BIGINT NOT NULL,
    "lineNetTotal" BIGINT NOT NULL,
    "lineGrossTotal" BIGINT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "status" "OrderStatus" NOT NULL DEFAULT 'SHIPPED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorPayment" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNo" TEXT,
    "invoiceNo" TEXT,
    "note" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'AKTIF',
    "recordedBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDateChange" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "oldDueDate" TIMESTAMP(3) NOT NULL,
    "newDueDate" TIMESTAMP(3) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DueDateChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPeriod" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "baseAmount" BIGINT NOT NULL,
    "ratePercent" DOUBLE PRECISION NOT NULL,
    "commissionAmount" BIGINT NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'HESAPLANDI',
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedBy" TEXT NOT NULL,

    CONSTRAINT "CommissionPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionAdjustment" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "sourcePaymentId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedPeriodId" TEXT,

    CONSTRAINT "CommissionAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Congress" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "registrationDeadline" TIMESTAMP(3),
    "quota" INTEGER,
    "status" "CongressStatus" NOT NULL DEFAULT 'TASLAK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Congress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CongressPackage" (
    "id" TEXT NOT NULL,
    "congressId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" BIGINT NOT NULL,
    "quota" INTEGER,

    CONSTRAINT "CongressPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CongressRegistration" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "CongressRegistrationStatus" NOT NULL DEFAULT 'TALEP',
    "reservedAmount" BIGINT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,

    CONSTRAINT "CongressRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CongressLedger" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" "CongressLedgerType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "remainingAmount" BIGINT NOT NULL DEFAULT 0,
    "registrationId" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CongressLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taxOffice" TEXT,
    "taxNo" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerPrice" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "netPrice" BIGINT NOT NULL,
    "vatRate" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "DealerPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerShipment" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "status" "DealerShipmentStatus" NOT NULL DEFAULT 'TALEP',
    "netTotal" BIGINT NOT NULL,
    "vatTotal" BIGINT NOT NULL,
    "grossTotal" BIGINT NOT NULL,
    "requestedByUserId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "dueDate" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "netUnitPrice" BIGINT NOT NULL,
    "vatRate" INTEGER NOT NULL,
    "vatAmount" BIGINT NOT NULL,
    "lineNetTotal" BIGINT NOT NULL,
    "lineGrossTotal" BIGINT NOT NULL,

    CONSTRAINT "DealerShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerPayment" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNo" TEXT,
    "note" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeData" TEXT,
    "afterData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_phoneNormalized_key" ON "Doctor"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Doctor_ownerSellerId_idx" ON "Doctor"("ownerSellerId");

-- CreateIndex
CREATE INDEX "Doctor_fullName_idx" ON "Doctor"("fullName");

-- CreateIndex
CREATE INDEX "DoctorAssignment_doctorId_idx" ON "DoctorAssignment"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorAssignment_sellerId_idx" ON "DoctorAssignment"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "Order_sellerId_idx" ON "Order"("sellerId");

-- CreateIndex
CREATE INDEX "Order_doctorId_idx" ON "Order"("doctorId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "DoctorPayment_doctorId_idx" ON "DoctorPayment"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorPayment_status_idx" ON "DoctorPayment"("status");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_orderId_idx" ON "PaymentAllocation"("orderId");

-- CreateIndex
CREATE INDEX "DueDateChange_orderId_idx" ON "DueDateChange"("orderId");

-- CreateIndex
CREATE INDEX "CommissionPeriod_sellerId_idx" ON "CommissionPeriod"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPeriod_sellerId_year_month_key" ON "CommissionPeriod"("sellerId", "year", "month");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_sellerId_year_month_idx" ON "CommissionAdjustment"("sellerId", "year", "month");

-- CreateIndex
CREATE INDEX "Congress_status_idx" ON "Congress"("status");

-- CreateIndex
CREATE INDEX "CongressPackage_congressId_idx" ON "CongressPackage"("congressId");

-- CreateIndex
CREATE INDEX "CongressRegistration_packageId_idx" ON "CongressRegistration"("packageId");

-- CreateIndex
CREATE INDEX "CongressRegistration_doctorId_idx" ON "CongressRegistration"("doctorId");

-- CreateIndex
CREATE INDEX "CongressRegistration_status_idx" ON "CongressRegistration"("status");

-- CreateIndex
CREATE INDEX "CongressLedger_doctorId_earnedAt_idx" ON "CongressLedger"("doctorId", "earnedAt");

-- CreateIndex
CREATE INDEX "CongressLedger_registrationId_idx" ON "CongressLedger"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_code_key" ON "Dealer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_userId_key" ON "Dealer"("userId");

-- CreateIndex
CREATE INDEX "DealerPrice_dealerId_idx" ON "DealerPrice"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerPrice_dealerId_productId_key" ON "DealerPrice"("dealerId", "productId");

-- CreateIndex
CREATE INDEX "DealerShipment_dealerId_idx" ON "DealerShipment"("dealerId");

-- CreateIndex
CREATE INDEX "DealerShipment_status_idx" ON "DealerShipment"("status");

-- CreateIndex
CREATE INDEX "DealerShipmentItem_shipmentId_idx" ON "DealerShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "DealerPayment_dealerId_idx" ON "DealerPayment"("dealerId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_ownerSellerId_fkey" FOREIGN KEY ("ownerSellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorAssignment" ADD CONSTRAINT "DoctorAssignment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorAssignment" ADD CONSTRAINT "DoctorAssignment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPayment" ADD CONSTRAINT "DoctorPayment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "DoctorPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateChange" ADD CONSTRAINT "DueDateChange_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPeriod" ADD CONSTRAINT "CommissionPeriod_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_appliedPeriodId_fkey" FOREIGN KEY ("appliedPeriodId") REFERENCES "CommissionPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CongressPackage" ADD CONSTRAINT "CongressPackage_congressId_fkey" FOREIGN KEY ("congressId") REFERENCES "Congress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CongressRegistration" ADD CONSTRAINT "CongressRegistration_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CongressPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CongressRegistration" ADD CONSTRAINT "CongressRegistration_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CongressLedger" ADD CONSTRAINT "CongressLedger_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CongressLedger" ADD CONSTRAINT "CongressLedger_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "CongressRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerPrice" ADD CONSTRAINT "DealerPrice_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerPrice" ADD CONSTRAINT "DealerPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerShipment" ADD CONSTRAINT "DealerShipment_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerShipmentItem" ADD CONSTRAINT "DealerShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "DealerShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerShipmentItem" ADD CONSTRAINT "DealerShipmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerPayment" ADD CONSTRAINT "DealerPayment_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
