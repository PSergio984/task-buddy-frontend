import { describe, it, expect } from "vitest"
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { api } from "./api"

// Custom adapters drive the axios instance without a network — a rejected
// adapter lands in the response interceptor exactly like an HTTP error.

const inProgress409 = (config: InternalAxiosRequestConfig) => ({
  config,
  response: {
    status: 409,
    statusText: "Conflict",
    headers: {},
    config,
    data: { detail: "Request already in progress with this idempotency key." },
  },
})

const conflict409 = (config: InternalAxiosRequestConfig, detail: string) => ({
  config,
  response: {
    status: 409,
    statusText: "Conflict",
    headers: {},
    config,
    data: { detail },
  },
})

const ok = (config: InternalAxiosRequestConfig): AxiosResponse => ({
  status: 200,
  statusText: "OK",
  headers: {},
  config,
  data: { ok: true },
})

describe("api response interceptor — idempotent 409", () => {
  it("replays an in-progress 409 once and resolves with the response", async () => {
    let calls = 0
    const keys: unknown[] = []
    const res = await api.post(
      "/api/v1/tasks/",
      {},
      {
        adapter: async (config) => {
          calls++
          keys.push(config.headers["X-Idempotency-Key"])
          if (calls === 1) throw inProgress409(config)
          return ok(config)
        },
      }
    )
    expect(calls).toBe(2)
    expect(res.data).toEqual({ ok: true })
    // The replay must carry the SAME key — a regenerated key is a second
    // real execution, not a cache replay, and would double the mutation.
    expect(keys[0]).toBeTruthy()
    expect(keys[1]).toBe(keys[0])
  })

  it("rejects instead of looping when the replay also 409s", async () => {
    let calls = 0
    await expect(
      api.post(
        "/api/v1/tasks/",
        {},
        {
          adapter: async (config) => {
            calls++
            throw inProgress409(config)
          },
        }
      )
    ).rejects.toMatchObject({ response: { status: 409 } })
    expect(calls).toBe(2)
  })

  it("does not retry a 409 that isn't the in-progress message", async () => {
    let calls = 0
    await expect(
      api.post(
        "/api/v1/tasks/",
        {},
        {
          adapter: async (config) => {
            calls++
            throw conflict409(
              config,
              "A stand-up entry already exists for this date"
            )
          },
        }
      )
    ).rejects.toMatchObject({ response: { status: 409 } })
    expect(calls).toBe(1)
  })

  it("does not retry an unkeyed request — only keyed POSTs can hit that 409", async () => {
    let calls = 0
    await expect(
      api.put(
        "/api/v1/tasks/1",
        {},
        {
          adapter: async (config) => {
            calls++
            throw inProgress409(config)
          },
        }
      )
    ).rejects.toMatchObject({ response: { status: 409 } })
    expect(calls).toBe(1)
  })
})
