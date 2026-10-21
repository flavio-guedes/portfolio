#!/usr/bin/env python3
import os, sys
from http.server import SimpleHTTPRequestHandler, HTTPServer
PASTA="/Users/mac/hermes/painel"; PORTA=8080
class H(SimpleHTTPRequestHandler):
    def __init__(self,*a,**k): super().__init__(*a,directory=PASTA,**k)
    def log_message(self,*a): pass
    def end_headers(self):
        self.send_header("Cache-Control","no-store")
        super().end_headers()
if __name__=="__main__":
    print("serve-painel em http://127.0.0.1:%d (pasta %s)"%(PORTA,PASTA))
    HTTPServer(("127.0.0.1",PORTA),H).serve_forever()
