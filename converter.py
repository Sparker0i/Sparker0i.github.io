import os
import json
import yaml
from markdownify import markdownify
import urllib.request
import time
import re
from urllib.parse import urlparse
import requests

export_path = '5cdd04921a7cb8b20267646b-articles.json'
posts_path = 'content/post'
config = {
    'domain': 'https://blog.sparker0i.me',
    'media_url': 'https://blog.sparker0i.me/media',
}

def download_image(url, path):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(path, 'wb') as f:
        f.write(response.read())


export = json.load(open(export_path))
# print(export['posts'])

for post in export['posts']:
    # Create post-specific directory based on slug
    post_slug = post['slug']
    post_dir = f"{posts_path}/{post_slug}"
    os.makedirs(post_dir, exist_ok=True)
    
    cover_image_basename = f"{post['id']}.png"
    cover_image_path = f"{post_dir}/{cover_image_basename}"
    post_path = f"{post_dir}/index.md"

    if not os.path.isfile(cover_image_path):
        print(post['coverImage'])
        download_image(post['coverImage'], cover_image_path)
        time.sleep(2)

    # Extract and download images from content
    content = post['content']
    img_urls = re.findall(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>', content)
    
    for img_url in img_urls:
        parsed_url = urlparse(img_url)
        img_filename = f"{post['id']}_{os.path.basename(parsed_url.path)}"
        if not img_filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            img_filename += '.jpg'
        img_path = f"{post_dir}/{img_filename}"
        
        if not os.path.isfile(img_path):
            try:
                print(f"Downloading: {img_url}")
                download_image(img_url, img_path)
                time.sleep(1)
            except Exception as e:
                print(f"Failed to download {img_url}: {e}")
                continue
        
        # Replace URL in content with relative path
        content = content.replace(img_url, img_filename)
        time.sleep(2)

    # Fetch tag names dynamically from Hashnode API
    tag_ids = post.get('tags', [])
    tag_names = tag_ids
    
    frontmatter = {
        'title': post['title'],
        'description': post.get('subtitle', ''),
        'image': cover_image_basename,
        'date': post['dateAdded'],
        'slug': post['slug'],
        'tags': tag_names,
    }
    if 'dateUpdated' in post:
        frontmatter['lastmod'] = post['dateUpdated']
    frontmatter_yaml = yaml.dump(frontmatter)

    post = f'''---\n{frontmatter_yaml}---\n\n{markdownify(content)}'''

    with open(post_path, 'w') as f:
        f.write(post)
