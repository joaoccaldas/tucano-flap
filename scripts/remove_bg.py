#!/usr/bin/env python3
"""Remove background from images - handles both white and black backgrounds."""

from PIL import Image
import os

def remove_bg(input_path, output_path, bg_type='auto', threshold=40):
    """Remove background from image. bg_type can be 'white', 'black', or 'auto'."""
    img = Image.open(input_path).convert('RGBA')
    datas = img.load()
    
    width, height = img.size
    
    # Auto-detect background color from corners
    if bg_type == 'auto':
        corners = [
            img.getpixel((5, 5)),
            img.getpixel((width-5, 5)),
            img.getpixel((5, height-5)),
            img.getpixel((width-5, height-5))
        ]
        avg_brightness = sum(sum(c[:3]) for c in corners) / (len(corners) * 3)
        bg_type = 'white' if avg_brightness > 127 else 'black'
        print(f"Detected {bg_type} background (avg brightness: {avg_brightness:.1f})")
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = datas[x, y]
            
            if bg_type == 'white':
                # Remove white/light pixels
                if r > (255-threshold) and g > (255-threshold) and b > (255-threshold):
                    datas[x, y] = (255, 255, 255, 0)
            else:
                # Remove black/dark pixels
                if r < threshold and g < threshold and b < threshold:
                    datas[x, y] = (0, 0, 0, 0)
    
    img.save(output_path, 'PNG')
    print(f"Saved: {output_path}")

if __name__ == '__main__':
    base_dir = os.path.expanduser('~/.openclaw/workspace/projects/tucano-flap/public/sprites')
    
    # Process both with auto-detection
    remove_bg(f'{base_dir}/jow.jpg', f'{base_dir}/jow.png', bg_type='auto', threshold=50)
    remove_bg(f'{base_dir}/thais.jpg', f'{base_dir}/thais.png', bg_type='auto', threshold=40)
