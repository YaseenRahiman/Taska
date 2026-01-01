import re

with open('build.gradle.kts', 'r') as f:
    content = f.read()

content = re.sub(r'"http://10\.0\.2\.2:3000"', '"http://10.0.2.2:3000/api/v1/"', content)
content = re.sub(r'"https://api\.taska\.co\.za"', '"https://api.taska.co.za/api/v1/"', content)

with open('build.gradle.kts', 'w') as f:
    f.write(content)

print("API URLs updated successfully")
