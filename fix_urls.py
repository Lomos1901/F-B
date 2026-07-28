import os, re
path = r'D:\SAMCAFFEE\frontend\src\services'
for file in os.listdir(path):
    if not file.endswith('.ts'): continue
    filepath = os.path.join(path, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'const API_URL = ([^;]+);', content)
    if match:
        old_val = match.group(1)
        endpoint = ''
        if 'auth' in file.lower(): endpoint = '/auth'
        elif 'category' in file.lower(): endpoint = '/categories'
        elif 'ingredient' in file.lower(): endpoint = '/ingredients'
        elif 'order' in file.lower(): endpoint = '/orders'
        elif 'payment' in file.lower(): endpoint = '/payments'
        elif 'product' in file.lower(): endpoint = '/products'
        elif 'shift' in file.lower(): endpoint = '/shifts'
        elif 'stat' in file.lower() or 'analytic' in file.lower() or 'dashboard' in file.lower(): endpoint = '/stats'
        elif 'user' in file.lower(): endpoint = '/users'
        
        new_val = f'`${{process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}}{endpoint}`'
        content = content.replace(f'const API_URL = {old_val};', f'const API_URL = {new_val};')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file} with endpoint {endpoint}")
