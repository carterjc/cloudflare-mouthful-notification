import type { Child } from "hono/jsx";

export function Layout({ title, children }: { title: string; children: Child }) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --bg: #fafaf9; --surface: #ffffff; --surface2: #f5f5f4;
            --border: #e7e5e4; --border2: #d6d3d1;
            --text: #1c1917; --text2: #78716c; --text3: #a8a29e;
            --accent: #0d9488; --accent-light: #ccfbf1;
            --green: #16a34a; --red: #dc2626;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--bg); color: var(--text);
            padding: 24px; max-width: 1060px; margin: 0 auto;
            line-height: 1.45; font-size: 13px;
          }
          h1 { font-size: 1.125rem; font-weight: 700; letter-spacing: -0.02em; }
          h2 { font-size: 0.6875rem; font-weight: 600; color: var(--text2); margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; }
          a { color: var(--accent); text-decoration: none; }
          a:hover { text-decoration: underline; }

          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
          .header-right { display: flex; align-items: center; gap: 12px; }

          .nav { display: flex; gap: 6px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
          .nav a {
            padding: 4px 10px; border-radius: 5px; font-size: 0.75rem; font-weight: 500;
            color: var(--text2); transition: all 0.1s;
          }
          .nav a:hover { color: var(--text); background: var(--surface2); text-decoration: none; }

          .card {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 8px; padding: 16px;
          }
          .card-link { text-decoration: none; color: inherit; display: block; }
          .card-link:hover { text-decoration: none; }
          .card-link .card { transition: border-color 0.1s, box-shadow 0.1s; }
          .card-link:hover .card { border-color: var(--accent); box-shadow: 0 1px 4px rgba(13,148,136,0.08); }

          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }

          .community-name { font-size: 0.8125rem; font-weight: 600; margin-bottom: 10px; }
          .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 10px; }
          .stat-item { display: flex; flex-direction: column; gap: 1px; }
          .stat-label { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text3); }
          .stat-value { font-size: 1rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

          .chart-img { width: 100%; border-radius: 6px; margin-top: 6px; }

          table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
          th { text-align: left; padding: 6px 10px; color: var(--text3); font-weight: 500; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
          td { padding: 6px 10px; border-bottom: 1px solid var(--surface2); }
          tr:hover td { background: var(--surface2); }
          .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 500; }

          .btn {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 5px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;
            border: 1px solid var(--border); background: var(--surface); color: var(--text);
            cursor: pointer; transition: all 0.1s; text-decoration: none;
            font-family: 'Inter', sans-serif;
          }
          .btn:hover { border-color: var(--border2); background: var(--surface2); text-decoration: none; }
          .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
          .btn-primary:hover { background: #0f766e; border-color: #0f766e; color: #fff; }

          .meta { font-size: 0.6875rem; color: var(--text2); }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.625rem; font-weight: 500; background: var(--surface2); color: var(--text2); }

          @media (max-width: 640px) {
            body { padding: 12px; }
            .grid { grid-template-columns: 1fr; }
            .header { flex-direction: column; align-items: flex-start; gap: 8px; }
          }
        `}</style>
      </head>
      <body>
        <div class="nav">
          <a href="/">Dashboard</a>
          <a href="/api/communities">API</a>
        </div>
        {children}
      </body>
    </html>
  );
}
