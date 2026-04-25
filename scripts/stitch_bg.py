#!/usr/bin/env python3
"""Create seamless looping panorama with mirrored edges for perfect blending."""

from PIL import Image, ImageFilter
import os

def create_seamless_blend(img1, img2, blend_width=300):
    """Create seamless blend by mirroring edges and cross-fading."""
    w1, h = img1.size
    w2, _ = img2.size
    
    # Get edge strips
    edge1 = img1.crop((w1 - blend_width, 0, w1, h))  # Right edge of img1
    edge2 = img2.crop((0, 0, blend_width, h))  # Left edge of img2
    
    # Mirror edge1 (flip horizontally) so it matches the flow into edge2
    edge1_mirrored = edge1.transpose(Image.FLIP_LEFT_RIGHT)
    
    # Create blend zone
    blend = Image.new('RGB', (blend_width, h))
    
    # Cross-fade between mirrored edge1 and edge2
    pixels1 = edge1_mirrored.load()
    pixels2 = edge2.load()
    pixels_blend = blend.load()
    
    for y in range(h):
        for x in range(blend_width):
            # Factor: 0 = mirrored img1, 1 = img2
            factor = x / blend_width
            
            r = int(pixels1[x, y][0] * (1 - factor) + pixels2[x, y][0] * factor)
            g = int(pixels1[x, y][1] * (1 - factor) + pixels2[x, y][1] * factor)
            b = int(pixels1[x, y][2] * (1 - factor) + pixels2[x, y][2] * factor)
            
            pixels_blend[x, y] = (r, g, b)
    
    return blend

def create_seamless_panorama(image_paths, output_path, blend_width=400):
    """Create panorama where last image connects seamlessly back to first."""
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
    
    # For seamless loop: last image must blend back to first
    # So we create: img1 → blend → img2 → blend → img3 → blend → (back to img1)
    
    # Calculate total width
    total_width = sum(img.width for img in resized)
    
    # Create output image (extra space for blends)
    output_width = total_width
    panorama = Image.new('RGB', (output_width, target_height))
    
    # Paste images with blends
    x_offset = 0
    for i, img in enumerate(resized):
        # Paste current image
        panorama.paste(img, (x_offset, 0))
        x_offset += img.width
        
        # Create blend to next image (or wrap to first if last)
        next_img = resized[(i + 1) % len(resized)]
        
        # Get edges for blending
        edge_current = img.crop((img.width - blend_width, 0, img.width, target_height))
        edge_next = next_img.crop((0, 0, blend_width, target_height))
        
        # Create blend zone (overlap)
        blend = create_seamless_blend(img, next_img, blend_width)
        
        # Overwrite the blend area
        if i < len(resized) - 1:
            # Not last image - blend into next
            panorama.paste(blend, (x_offset - blend_width, 0))
            x_offset -= blend_width  # Overlap
    
    # For the final wrap-around (img3 back to img1), we need to handle it specially
    # Create a version that can loop by blending last to first
    
    # Alternative approach: make the panorama double-length and seamless
    # Actually, let's use a simpler approach: cross-fade at the seam
    
    # Re-do with proper seamless loop
    return create_looping_panorama(resized, output_path, blend_width)

def create_looping_panorama(images, output_path, blend_width=400):
    """Create a panorama that loops seamlessly (end connects to start)."""
    target_height = images[0].height
    
    # Calculate positions with overlaps
    positions = [0]
    for i, img in enumerate(images[:-1]):
        positions.append(positions[-1] + img.width - blend_width)
    
    # Total width
    total_width = positions[-1] + images[-1].width
    
    # Create canvas
    panorama = Image.new('RGB', (total_width, target_height))
    
    # Paste images
    for i, (img, pos) in enumerate(zip(images, positions)):
        panorama.paste(img, (pos, 0))
    
    # Create blend zones between each pair
    for i in range(len(images)):
        curr_img = images[i]
        next_img = images[(i + 1) % len(images)]  # Wrap around
        
        # Position of current image
        curr_pos = positions[i]
        
        # End of current image
        end_pos = curr_pos + curr_img.width
        
        # Create blend at the seam
        if i < len(images) - 1:
            # Regular blend between consecutive images
            blend_start = end_pos - blend_width
            
            # Get the overlapping region
            edge_curr = curr_img.crop((curr_img.width - blend_width, 0, curr_img.width, target_height))
            edge_next = next_img.crop((0, 0, blend_width, target_height))
            
            # Mirror the edge of current to match flow into next
            edge_curr_flipped = edge_curr.transpose(Image.FLIP_LEFT_RIGHT)
            
            # Cross-fade
            blend = Image.new('RGB', (blend_width, target_height))
            p1 = edge_curr_flipped.load()
            p2 = edge_next.load()
            pb = blend.load()
            
            for y in range(target_height):
                for x in range(blend_width):
                    factor = x / blend_width
                    r = int(p1[x, y][0] * (1 - factor) + p2[x, y][0] * factor)
                    g = int(p1[x, y][1] * (1 - factor) + p2[x, y][1] * factor)
                    b = int(p1[x, y][2] * (1 - factor) + p2[x, y][2] * factor)
                    pb[x, y] = (r, g, b)
            
            # Paste blend
            panorama.paste(blend, (blend_start, 0))
    
    panorama.save(output_path, 'JPEG', quality=95)
    print(f"Created seamless looping panorama: {output_path}")
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
    create_seamless_panorama(images, output, blend_width=400)
