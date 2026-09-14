// The whole site is static — prerender every route.
export const prerender = true;

// And ship no JavaScript by default. Prerendered pages are complete HTML, so
// hydration only costs bytes. A route that needs client-side behaviour opts
// back in with `export const csr = true` in its own +page.ts.
export const csr = false;
