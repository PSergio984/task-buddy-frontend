import { describe, it, expect } from "vitest"
import { voiceFilename } from "./api"

describe("voiceFilename", () => {
  it("maps mp4 recordings to .m4a", () => {
    expect(voiceFilename("audio/mp4")).toBe("clip.m4a")
    expect(voiceFilename("audio/x-m4a")).toBe("clip.m4a")
  })

  it("maps ogg recordings to .ogg", () => {
    expect(voiceFilename("audio/ogg;codecs=vorbis")).toBe("clip.ogg")
  })

  it("maps wav recordings to .wav", () => {
    expect(voiceFilename("audio/wav")).toBe("clip.wav")
    expect(voiceFilename("audio/x-wav")).toBe("clip.wav")
  })

  it("defaults to webm for webm and unknown types", () => {
    expect(voiceFilename("audio/webm;codecs=opus")).toBe("clip.webm")
    expect(voiceFilename("")).toBe("clip.webm")
    expect(voiceFilename("audio/something-exotic")).toBe("clip.webm")
  })
})
