"use client";

import { useSyncExternalStore } from "react";
import { formatTicketUpdatedAt } from "@/lib/types";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** The first render must match the server even when browser locale/timezone differ. */
export function LocalTime({ value }: { value: Date | string }) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const date = new Date(value);
  const iso = date.toISOString();
  return <time dateTime={iso}>{hydrated ? formatTicketUpdatedAt(value) : `${iso.slice(0, 16).replace("T", " ")} UTC`}</time>;
}
