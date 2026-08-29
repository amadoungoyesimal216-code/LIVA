import http.server
import socketserver
import threading
import sys

PORTS = [8000, 3000]

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        super().end_headers()

def start_server_on_port(port):
    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
            print(f"LIVA Dev Server running at http://localhost:{port}")
            httpd.serve_forever()
    except Exception as e:
        print(f"Port {port} not available: {e}")

if __name__ == '__main__':
    threads = []
    for p in PORTS:
        t = threading.Thread(target=start_server_on_port, args=(p,), daemon=True)
        t.start()
        threads.append(t)
    
    print(f"LIVA Dev Servers running on {PORTS} - Press Ctrl+C to stop.")
    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print("\nStopping LIVA dev servers...")
        sys.exit(0)

