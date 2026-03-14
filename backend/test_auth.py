import urllib.request, json
req = urllib.request.Request(
    'http://localhost:8000/api/v1/auth/signup', 
    data=json.dumps({"email":"test3@c.com","password":"password123","role":"Admin"}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
