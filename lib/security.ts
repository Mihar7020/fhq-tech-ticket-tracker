import sanitizeHtml from "sanitize-html";
export function sanitizeEmailHtml(html: string) { return sanitizeHtml(html, { allowedTags: ["p", "br", "div", "span", "strong", "b", "em", "i", "u", "ol", "ul", "li", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "a", "img"], allowedAttributes: { a: ["href", "title"], img: ["src", "alt", "width", "height", "cid"] }, allowedSchemes: ["http", "https", "mailto", "cid"], disallowedTagsMode: "discard" }); }
export function sanitizeSignatureHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "div", "span", "strong", "b", "em", "i", "u", "small", "table", "tbody", "tr", "td", "a", "img"],
    allowedAttributes: { "*": ["style"], a: ["href", "title", "style"], img: ["src", "alt", "width", "height", "style"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^[a-z]+$/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^[a-z]+$/i],
        "font-family": [/^[\w\s,'"-]+$/],
        "font-size": [/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/],
        "font-weight": [/^(?:normal|bold|[1-9]00)$/],
        "font-style": [/^(?:normal|italic)$/],
        "text-decoration": [/^(?:none|underline)$/],
        width: [/^\d+(?:\.\d+)?(?:px|%)$/],
        height: [/^\d+(?:\.\d+)?(?:px|%)$/],
      },
    },
    disallowedTagsMode: "discard",
  });
}
export function stripQuotedReply(text: string) { const lines = text.replace(/\r/g, "").split("\n"); const cut = lines.findIndex((line) => /^On .+wrote:$/i.test(line.trim()) || /^-{2,}\s*Original Message\s*-{2,}$/i.test(line.trim()) || /^From:\s.+/i.test(line.trim())); return lines.slice(0, cut >= 0 ? cut : lines.length).filter((line) => !/^>/.test(line.trim())).join("\n").replace(/\n{3,}/g, "\n\n").trim(); }
