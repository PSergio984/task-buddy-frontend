/**
 * Daily Domain Model
 * Encapsulates entity contracts, input schemas, and API communication.
 */
import {
  dailiesApi,
  type Daily,
  type DailyCheckInput,
  type DailyCheckResponse,
  type DailyInput,
  type DailyItem,
  type DailyItemInput,
  type DailyPatch,
  type Recurrence,
} from "@/lib/api"

export type {
  Daily,
  DailyItem,
  DailyInput,
  DailyItemInput,
  DailyPatch,
  DailyCheckInput,
  DailyCheckResponse,
  Recurrence,
}

export const DailyModel = {
  api: dailiesApi,
}
