import { describe, it, expect } from "vitest"
import {
  SPEECH_CHUNK_LIMIT,
  buildTopPickUtterance,
  chunkForSpeech,
} from "./tts"

describe("chunkForSpeech", () => {
  it("returns an empty list for blank input", () => {
    expect(chunkForSpeech("   ")).toEqual([])
  })

  it("keeps short text as a single chunk", () => {
    expect(chunkForSpeech("Top pick tonight: Read, about 20 minutes.")).toEqual(
      ["Top pick tonight: Read, about 20 minutes."]
    )
  })

  it("never exceeds the 160-char limit", () => {
    const long = "word ".repeat(120).trim()
    for (const chunk of chunkForSpeech(long)) {
      expect(chunk.length).toBeLessThanOrEqual(SPEECH_CHUNK_LIMIT)
      expect(chunk.length).toBeGreaterThan(0)
    }
  })

  it("breaks at word boundaries when possible", () => {
    const long = `${"lorem ".repeat(40)}finis`
    const chunks = chunkForSpeech(long)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(/lorem$|finis$/.test(chunk)).toBe(true)
    }
  })
})

describe("buildTopPickUtterance", () => {
  it("names the period, task, and effort", () => {
    expect(buildTopPickUtterance("tonight", "Read a chapter", 20)).toBe(
      "Top pick tonight: Read a chapter, about 20 minutes."
    )
  })

  it("omits effort when unknown", () => {
    expect(buildTopPickUtterance("tomorrow", "Call the bank", null)).toBe(
      "Top pick tomorrow: Call the bank."
    )
  })
})
