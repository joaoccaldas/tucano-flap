#!/usr/bin/env python3
"""Stitch 3 images side-by-side for seamless looping background."""

from PIL import Image
import os

def stitch_images(image_paths, output_path):
    """Stitch images horizontally."""
    images = [Image.open(p).convert('RGB') for p in image_paths]
    
    # Find common height (use minimum to avoid stretching)
    target_height = min(img.height for img in images)
    
    # Resize all to same height maintaining aspect ratio
    resized = []
    for img in images:
        aspect = img.width / img.height
        new_width = int(target_height * aspect)
        resized_img = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
        resized.append(resized_img)
    
    # Calculate total width
    total_width = sum(img.width for img in resized)
    
    # Create panoramic image
    panorama = Image.new('RGB', (total_width, target_height))
    
    # Paste images side by side
    x_offset = 0
    for img in resized:
        panorama.paste(img, (x_offset, 0))
        x_offset += img.width
    
    panorama.save(output_path, 'JPEG', quality=90)
    print(f"Created panorama: {output_path}")
    print(f"  Size: {panorama.size}")
    return output_path

if __name__ == '__main__':
    base_dir = os.path.expanduser('~/.openclaw/workspace/projects/tucano-flap/public/backgrounds')
    
    # Order: 1, 2, 3 (left to right as requested)
    images = [
        f'{base_dir}/brazil-coast-1.jpg',
        f'{base_dir}/brazil-coast-2.jpg', 
        f'{base_dir}/brazil-coast-3.jpg'
    ]
    
    output = f'{base_dir}/brazil-coast-panorama.jpg'
    stitch_images(images, output)
