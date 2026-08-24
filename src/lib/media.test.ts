import { describe, it, expect } from "vitest"
import { MAX_RECORDING_SECONDS, pickMimeType } from "./media"

describe("pickMimeType", () => {
  it("prefers opus-in-webm when supported", () => {
    expect(pickMimeType((mime) => mime === "audio/webm;codecs=opus")).toBe(
      "audio/webm;codecs=opus"
    )
  })

  it("falls back to plain webm when opus is unsupported", () => {
    const ladder = ["audio/webm"]
    expect(pickMimeType((mime) => ladder.includes(mime))).toBe("audio/webm")
  })

  it("falls through to mp4 (Safari)", () => {
    expect(pickMimeType((mime) => mime === "audio/mp4")).toBe("audio/mp4")
  })

  it("returns undefined when nothing is supported (browser default)", () => {
    expect(pickMimeType(() => false)).toBeUndefined()
  })
})

describe("MAX_RECORDING_SECONDS", () => {
  it("caps recordings at 60 s", () => {
    expect(MAX_RECORDING_SECONDS).toBe(60)
  })
})
