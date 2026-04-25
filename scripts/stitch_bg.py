#!/usr/bin/env python3
"""Stitch 3 images side-by-side with smooth blending for seamless looping."""

from PIL import Image, ImageDraw
import os

def blend_images(img1, img2, blend_width=100):
    """Blend two images together with a gradient."""
    w1, h = img1.size
    w2, _ = img2.size
    
    # Create new image for the blend region
    blend = Image.new('RGB', (blend_width, h))
    
    # Get edge pixels
    edge1 = img1.crop((w1 - blend_width, 0, w1, h))
    edge2 = img2.crop((0, 0, blend_width, h))
    
    # Blend pixel by pixel
    pixels1 = edge1.load()
    pixels2 = edge2.load()
    pixels_blend = blend.load()
    
    for y in range(h):
        for x in range(blend_width):
            # Calculate blend factor (0 = img1, 1 = img2)
            factor = x / blend_width
            r = int(pixels1[x, y][0] * (1 - factor) + pixels2[x, y][0] * factor)
            g = int(pixels1[x, y][1] * (1 - factor) + pixels2[x, y][1] * factor)
            b = int(pixels1[x, y][2] * (1 - factor) + pixels2[x, y][2] * factor)
            pixels_blend[x, y] = (r, g, b)
    
    return blend

def stitch_images_smooth(image_paths, output_path, blend_width=150):
    """Stitch images horizontally with smooth blending between them."""
    images = [Image.open(p).convert('RGB') for p in image_paths]
    
    # Find common height
    target_height = min(img.height for img in images)
    
    # Resize all to same height
    resized = []
    for img in images:
        aspect = img.width / img.height
        new_width = int(target_height * aspect)
        resized_img = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
        resized.append(resized_img)
    
    # Calculate total width (with overlap for blending)
    total_width = sum(img.width for img in resized) - (blend_width * (len(resized) - 1))
    
    # Create panoramic image
    panorama = Image.new('RGB', (total_width, target_height))
    
    # Paste first image
    x_offset = 0
    panorama.paste(resized[0], (0, 0))
    x_offset = resized[0].width
    
    # Blend and paste remaining images
    for i in range(1, len(resized)):
        prev_img = resized[i-1]
        curr_img = resized[i]
        
        # Create blend region
        blend = blend_images(prev_img, curr_img, blend_width)
        
        # Paste blend region (overlapping previous image edge)
        panorama.paste(blend, (x_offset - blend_width, 0))
        
        # Paste current image (minus the blend part)
        remaining = curr_img.crop((blend_width, 0, curr_img.width, curr_img.height))
        panorama.paste(remaining, (x_offset, 0))
        
        x_offset += curr_img.width - blend_width
    
    panorama.save(output_path, 'JPEG', quality=95)
    print(f"Created smooth panorama: {output_path}")
    print(f"  Size: {panorama.size}")
    print(f"  Blend width: {blend_width}px between images")
    return output_path

if __name__ == '__main__':
    base_dir = os.path.expanduser('~/.openclaw/workspace/projects/tucano-flap/public/backgrounds')
    
    images = [
        f'{base_dir}/brazil-coast-1.jpg',
        f'{base_dir}/brazil-coast-2.jpg', 
        f'{base_dir}/brazil-coast-3.jpg'
    ]
    
    output = f'{base_dir}/brazil-coast-panorama.jpg'
    stitch_images_smooth(images, output, blend_width=200)
