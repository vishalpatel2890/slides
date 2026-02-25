import { describe, it, expect } from 'vitest'
import { reverseAdaptCssForShadowDom } from '../../../../src/webview/viewer/utils/reverseAdaptCssForShadowDom'

describe('reverseAdaptCssForShadowDom', () => {
  it('reverses :host { to :root {', () => {
    const input = '<style>:host { --color: red; }</style>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toBe('<style>:root { --color: red; }</style>')
  })

  it('reverses .slide, [data-slide-id] { to body {', () => {
    const input = '<style>.slide, [data-slide-id] { background: blue; }</style>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toBe('<style>body { background: blue; }</style>')
  })

  it('handles both replacements in same style block', () => {
    const input = '<style>:host { --bg: white; } .slide, [data-slide-id] { margin: 0; }</style>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toBe('<style>:root { --bg: white; } body { margin: 0; }</style>')
  })

  it('handles multiple <style> blocks', () => {
    const input = '<style>:host { color: red; }</style><div>hello</div><style>.slide, [data-slide-id] { padding: 0; }</style>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toBe('<style>:root { color: red; }</style><div>hello</div><style>body { padding: 0; }</style>')
  })

  it('does not modify content outside <style> tags', () => {
    const input = '<div>:host is a CSS pseudo-class</div><p>.slide, [data-slide-id] are selectors</p>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toBe(input)
  })

  it('passes through already-correct :root CSS unchanged (idempotent)', () => {
    const input = '<style>:root { --color: red; } body { margin: 0; }</style>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toBe(input)
  })

  it('handles style tags with attributes', () => {
    const input = '<style type="text/css">:host { color: red; }</style>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toBe('<style type="text/css">:root { color: red; }</style>')
  })

  it('returns empty string for empty input', () => {
    expect(reverseAdaptCssForShadowDom('')).toBe('')
  })

  it('returns input unchanged when no style tags present', () => {
    const input = '<div>Hello world</div>'
    expect(reverseAdaptCssForShadowDom(input)).toBe(input)
  })

  it('handles varying whitespace in selectors', () => {
    const input = '<style>:host{color:red;} .slide,  [data-slide-id]  {margin:0;}</style>'
    const result = reverseAdaptCssForShadowDom(input)
    expect(result).toContain(':root {')
    expect(result).toContain('body {')
    expect(result).not.toContain(':host')
    expect(result).not.toContain('.slide')
  })
})
