import { describe, it, expect } from 'vitest'
import { wrapAsHtmlDocument } from '../../../../src/webview/viewer/utils/wrapAsHtmlDocument'

describe('wrapAsHtmlDocument', () => {
  it('wraps a fragment with meta/style/link into proper HTML document', () => {
    const input = '<meta charset="utf-8"><style>:root { color: red; }</style><div>Hello</div>'
    const result = wrapAsHtmlDocument(input)
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<html lang="en">')
    expect(result).toContain('<head>')
    expect(result).toContain('<meta charset="utf-8">')
    expect(result).toContain('<style>:root { color: red; }</style>')
    expect(result).toContain('</head>')
    expect(result).toContain('<body>')
    expect(result).toContain('<div>Hello</div>')
    expect(result).toContain('</body>')
    expect(result).toContain('</html>')
  })

  it('passes through already-valid document unchanged (idempotent)', () => {
    const input = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<style>body { color: red; }</style>\n</head>\n<body>\n<div>Hello</div>\n</body>\n</html>'
    const result = wrapAsHtmlDocument(input)
    expect(result).toBe(input)
  })

  it('passes through document with leading whitespace', () => {
    const input = '  <!DOCTYPE html>\n<html><head></head><body></body></html>'
    const result = wrapAsHtmlDocument(input)
    expect(result).toBe(input)
  })

  it('is case-insensitive for DOCTYPE detection', () => {
    const input = '<!doctype html>\n<html><head></head><body></body></html>'
    const result = wrapAsHtmlDocument(input)
    expect(result).toBe(input)
  })

  it('removes <style data-shadow-animations=""> blocks', () => {
    const input = '<style data-shadow-animations="">@keyframes fade { from { opacity: 0; } }</style><style>:root { color: red; }</style><div>Content</div>'
    const result = wrapAsHtmlDocument(input)
    expect(result).not.toContain('data-shadow-animations')
    expect(result).not.toContain('@keyframes fade')
    expect(result).toContain(':root { color: red; }')
    expect(result).toContain('<div>Content</div>')
  })

  it('removes duplicate animation style blocks', () => {
    const input = '<style data-shadow-animations="">@keyframes a {}</style><style data-shadow-animations="">@keyframes b {}</style><div>Content</div>'
    const result = wrapAsHtmlDocument(input)
    expect(result).not.toContain('data-shadow-animations')
    expect(result).toContain('<div>Content</div>')
  })

  it('handles empty input', () => {
    const result = wrapAsHtmlDocument('')
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<head>')
    expect(result).toContain('<body>')
    expect(result).toContain('</html>')
  })

  it('preserves all slide content in body', () => {
    const input = '<style>h1 { font-size: 2em; }</style><div class="slide-container"><h1>Title</h1><p>Content</p><img src="logo.png" /></div>'
    const result = wrapAsHtmlDocument(input)
    expect(result).toContain('<div class="slide-container">')
    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<p>Content</p>')
    expect(result).toContain('<img src="logo.png" />')
  })

  it('extracts <title> into head', () => {
    const input = '<title>My Slide</title><div>Content</div>'
    const result = wrapAsHtmlDocument(input)
    // Title should be in head section
    const headSection = result.split('<head>')[1].split('</head>')[0]
    expect(headSection).toContain('<title>My Slide</title>')
  })

  it('extracts <link> into head', () => {
    const input = '<link rel="stylesheet" href="styles.css"><div>Content</div>'
    const result = wrapAsHtmlDocument(input)
    const headSection = result.split('<head>')[1].split('</head>')[0]
    expect(headSection).toContain('<link rel="stylesheet" href="styles.css">')
  })

  it('handles fragment with no head elements', () => {
    const input = '<div>Just a div</div><p>And a paragraph</p>'
    const result = wrapAsHtmlDocument(input)
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<div>Just a div</div>')
    expect(result).toContain('<p>And a paragraph</p>')
  })
})
