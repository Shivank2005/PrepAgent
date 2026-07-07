import urllib.request, re

url = 'https://prep-agent-ten.vercel.app/'
html = urllib.request.urlopen(url).read().decode('utf-8')

js_links = re.findall(r'src=\"(.*?\.js)\"', html)

found_api = False
found_google = False

for link in js_links:
    js_url = link if link.startswith('http') else url.rstrip('/') + '/' + link.lstrip('/')
    try:
        js = urllib.request.urlopen(js_url).read().decode('utf-8')
        if 'prepagent.onrender.com' in js:
            print(f'Found API URL in {js_url}')
            match = re.search(r'\"https://prepagent\.onrender\.com[^\"]*\"', js)
            if match: print(f'  API string: {match.group(0)}')
            found_api = True
        if 'googleusercontent.com' in js:
            print(f'Found Google Client ID in {js_url}')
            found_google = True
        if 'dummy_client_id_for_development' in js:
            print(f'Found DUMMY Client ID in {js_url}')
            found_google = False
    except Exception as e:
        pass

if not found_api: print('API URL NOT FOUND IN JS!')
if not found_google: print('GOOGLE CLIENT ID NOT FOUND IN JS (or dummy found)!')
