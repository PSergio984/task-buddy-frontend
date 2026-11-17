/**
 * Habit Domain Model
 * Encapsulates entity contracts, input schemas, and API communication.
 */
import {
  habitsApi,
  type Habit,
  type HabitClickDirection,
  type HabitClickResponse,
  type HabitDirection,
  type HabitInput,
  type HabitPatch,
} from "@/lib/api"

export type {
  Habit,
  HabitDirection,
  HabitClickDirection,
  HabitInput,
  HabitPatch,
  HabitClickResponse,
}

export const HabitModel = {
  api: habitsApi,
}
