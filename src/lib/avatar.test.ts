import { describe, it, expect } from "vitest"
import { avatarConfigToUrl, traitLabel } from "./avatar"

const BASE = "https://api.dicebear.com/9.x"

describe("avatarConfigToUrl", () => {
  it("builds the pixel-art default URL from a seed alone", () => {
    expect(avatarConfigToUrl({ seed: "kiki" })).toBe(
      `${BASE}/pixel-art/svg?seed=kiki`
    )
  })

  it("uses the stored style in the URL path", () => {
    expect(avatarConfigToUrl({ style: "bottts", seed: "x" })).toBe(
      `${BASE}/bottts/svg?seed=x`
    )
  })

  it("returns null without a seed or with a non-allowlisted style", () => {
    expect(avatarConfigToUrl({})).toBeNull()
    expect(avatarConfigToUrl({ seed: "" })).toBeNull()
    expect(avatarConfigToUrl({ seed: "x", style: "evil-path" })).toBeNull()
    expect(avatarConfigToUrl(undefined)).toBeNull()
  })

  it("maps traits onto DiceBear 9.x query params", () => {
    const url = avatarConfigToUrl({
      style: "pixel-art",
      seed: "kiki",
      traits: {
        hair: "short01",
        eyes: "variant02",
        mouth: "happy01",
        skinColor: "d08b5b",
        backgroundColor: "b6e3f4",
      },
      costume: { name: "knight" },
    })
    expect(url).toBe(
      `${BASE}/pixel-art/svg?seed=kiki&hair=short01&eyes=variant02&mouth=happy01&skinColor=d08b5b&backgroundColor=b6e3f4`
    )
  })

  it("pins accessoriesProbability when an accessory is picked", () => {
    const url = avatarConfigToUrl({
      seed: "x",
      traits: { accessories: "variant01" },
    })
    expect(url).toContain("accessories=variant01")
    expect(url).toContain("accessoriesProbability=100")
  })

  it("never maps the costume layer onto DiceBear params", () => {
    const url = avatarConfigToUrl({
      seed: "x",
      costume: { name: "mage" },
    })
    expect(url).not.toContain("costume")
    expect(url).not.toContain("mage")
  })

  it("drops unknown or mistyped trait entries — forward-stored, not rendered", () => {
    const url = avatarConfigToUrl({
      seed: "x",
      traits: { hair: "short01", beard: "variant01", eyes: 5, seed: "evil" },
    })
    expect(url).toBe(`${BASE}/pixel-art/svg?seed=x&hair=short01`)
  })

  it("omits trait params for non-pixel-art styles (foreign option names)", () => {
    const url = avatarConfigToUrl({
      style: "bottts",
      seed: "x",
      traits: { hair: "short01" },
    })
    expect(url).toBe(`${BASE}/bottts/svg?seed=x`)
  })
})

describe("traitLabel", () => {
  it("prettifies DiceBear variant names", () => {
    expect(traitLabel("short01")).toBe("Short 01")
    expect(traitLabel("happy13")).toBe("Happy 13")
    expect(traitLabel("adventurer")).toBe("Adventurer")
  })
})
