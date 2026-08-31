#!/usr/bin/env python3
"""Dev server: python3 serve.py — like http.server 8433 but never caches,
so CSS/JS changes show up on a plain refresh."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print("serving on http://localhost:8433")
    ThreadingHTTPServer(("", 8433), NoCacheHandler).serve_forever()
