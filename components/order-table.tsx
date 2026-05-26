"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { Order, Settings } from "@/lib/types";
import { convertUsdToUzs, formatDate, formatUzs } from "@/lib/utils";

export function OrderTable({
  orders,
  settings,
}: {
  orders: Order[];
  settings: Settings;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");

  const filtered = useMemo(() => {
    return orders.filter((order) => (statusFilter === "all" ? true : order.status === statusFilter));
  }, [orders, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            Все
          </Button>
          {ORDER_STATUSES.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
            >
              {ORDER_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <Card key={order.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{order.clientName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {order.telegramUsername || order.productName}
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="text-sm font-medium">{order.productName}</div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs uppercase tracking-wide">Цена</div>
                      <div className="mt-1 font-medium text-foreground">{formatUzs(order.salePriceUzs)}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs uppercase tracking-wide">Прибыль</div>
                      <div className="mt-1 font-medium text-foreground">
                        {formatUzs(convertUsdToUzs(order.profitUsd, settings.usdToUzsRate))}
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs uppercase tracking-wide">Предоплата</div>
                      <div className="mt-1">{order.prepaymentReceived ? formatDate(order.prepaymentDate) : "Нет"}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs uppercase tracking-wide">Заказ</div>
                      <div className="mt-1">{order.orderedOnPinduoduo ? formatDate(order.orderedDate) : "Нет"}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs uppercase tracking-wide">В пути</div>
                      <div className="mt-1">{order.inTransit ? "Да" : "Нет"}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs uppercase tracking-wide">Финал</div>
                      <div className="mt-1">{order.finalPaymentReceived ? "Да" : "Нет"}</div>
                    </div>
                  </div>

                  {order.notes ? <div className="text-sm text-muted-foreground">{order.notes}</div> : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Товар</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Предоплата</TableHead>
                    <TableHead>Заказ</TableHead>
                    <TableHead>В пути</TableHead>
                    <TableHead>Прибыл</TableHead>
                    <TableHead>Финал</TableHead>
                    <TableHead>Прибыль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Заметки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order, index) => (
                    <TableRow key={order.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.clientName}</div>
                        <div className="text-xs text-muted-foreground">{order.telegramUsername || "—"}</div>
                      </TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>{formatUzs(order.salePriceUzs)}</TableCell>
                      <TableCell>{order.prepaymentReceived ? formatDate(order.prepaymentDate) : "Нет"}</TableCell>
                      <TableCell>{order.orderedOnPinduoduo ? formatDate(order.orderedDate) : "Нет"}</TableCell>
                      <TableCell>{order.inTransit ? "Да" : "Нет"}</TableCell>
                      <TableCell>{order.arrived ? formatDate(order.arrivedDate) : "Нет"}</TableCell>
                      <TableCell>{order.finalPaymentReceived ? "Да" : "Нет"}</TableCell>
                      <TableCell>{formatUzs(convertUsdToUzs(order.profitUsd, settings.usdToUzsRate))}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{order.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6 text-sm text-muted-foreground">
            <span>Заказы по выбранному фильтру не найдены.</span>
            <Link
              href="/orders/new"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Добавить заказ
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
