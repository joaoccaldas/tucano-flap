#!/usr/bin/env python3
"""Remove white background from images and make them larger."""

from PIL import Image
import sys

def remove_white_bg(input_path, output_path, threshold=240):
    """Remove white background from image."""
    img = Image.open(input_path).convert('RGBA')
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # If pixel is close to white, make it transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    
    img.putdata(newData)
    img.save(output_path, 'PNG')
    print(f"Saved: {output_path}")

if __name__ == '__main__':
    import os
    base_dir = os.path.expanduser('~/.openclaw/workspace/projects/tucano-flap/public/sprites')
    
    # Process jow.jpg
    remove_white_bg(f'{base_dir}/jow.jpg', f'{base_dir}/jow.png')
    
    # Process thais.jpg  
    remove_white_bg(f'{base_dir}/thais.jpg', f'{base_dir}/thais.png')
