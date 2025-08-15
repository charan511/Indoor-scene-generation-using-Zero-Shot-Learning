# ========== GOOGLE COLAB NOTEBOOK ==========
# Title: Interior Design Generator API
# Save this as a Google Colab notebook (.ipynb)

# Install dependencies
!pip install flask flask-cors diffusers transformers accelerate huggingface_hub flask-ngrok pyngrok

# Import necessary libraries
import torch
from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline # Added StableDiffusionImg2ImgPipeline
from huggingface_hub import login
import flask
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
import re
import random
from PIL import Image
import os
from pyngrok import ngrok, conf
from google.colab import userdata  # For accessing Colab secrets

# Login to Hugging Face
login("hugging face token")

# Set device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load the Stable Diffusion models
print("Loading Stable Diffusion text-to-image model...")
text_to_image_pipe = StableDiffusionPipeline.from_pretrained(
    "CompVis/stable-diffusion-v1-4",
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    revision="fp16" if device == "cuda" else None
).to(device)
print("Stable Diffusion text-to-image model loaded successfully.")

print("Loading Stable Diffusion image-to-image model...")
img_to_image_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    "CompVis/stable-diffusion-v1-4",
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    revision="fp16" if device == "cuda" else None
).to(device)
print("Stable Diffusion image-to-image model loaded successfully.")


# Room types and design elements data
ROOM_TYPES = [
    "living room", "bedroom", "kitchen", "bathroom", "home office",
    "dining room", "entryway", "hallway", "library", "children's room",
    "nursery", "studio apartment", "loft", "master suite", "guest room",
    "walk-in closet", "laundry room", "sunroom", "conservatory",]

DESIGN_STYLES = [
    "modern", "minimalist", "Scandinavian", "industrial", "mid-century modern",
    "bohemian", "traditional", "rustic", "contemporary", "Art Deco",
    "farmhouse", "coastal", "Japanese", "Mediterranean", "eclectic",
    "Victorian", "transitional", "tropical", "neoclassical", "Georgian"
]

MATERIALS = [
    "marble", "hardwood", "exposed brick", "concrete", "glass",
    "leather", "velvet", "brass", "copper", "stainless steel",
    "ceramic tile", "terrazzo", "natural stone", "rattan", "bamboo",
    "quartz", "granite", "reclaimed wood", "porcelain", "travertine"
]

COLORS = [
    "neutral tones", "monochromatic", "earth tones", "pastels",
    "bold and vibrant", "black and white", "navy and gold", "sage green",
    "terracotta", "blues and greens", "warm grays", "cool grays",
    "jewel tones", "muted colors", "high contrast", "complementary colors"
]

LIGHTING = [
    "ambient lighting", "pendant lights", "recessed lighting", "natural light",
    "floor lamps", "table lamps", "chandelier", "sconces", "track lighting",
    "cove lighting", "LED strips", "under-cabinet lighting", "skylight",
    "task lighting", "statement lighting", "diffused lighting"
]

# Prompt enhancement function
def enhance_prompt(user_input):
    """
    Enhance user input by analyzing what's missing and adding appropriate details
    to generate better interior design images
    """
    user_input = user_input.lower()
    enhanced_parts = [user_input]

    # Check if a room type is specified, if not add a suggestion
    has_room_type = any(room_type in user_input for room_type in ROOM_TYPES)
    if not has_room_type:
        # Look for general terms that might indicate a room
        if "room" in user_input or "space" in user_input or "area" in user_input:
            pass  # User mentioned some kind of space but not specifically
        else:
            # Add a generic room type based on possible clues in the prompt
            if any(word in user_input for word in ["sleep", "bed", "rest", "night"]):
                enhanced_parts.append("bedroom")
            elif any(word in user_input for word in ["cook", "dining", "eat", "food"]):
                enhanced_parts.append("kitchen")
            elif any(word in user_input for word in ["work", "desk", "study"]):
                enhanced_parts.append("home office")
            else:
                enhanced_parts.append("living space")

    # Check if a design style is specified
    has_style = any(style.lower() in user_input for style in DESIGN_STYLES)
    if not has_style:
        # If user specifies "modern" or similar words, don't add style
        if not any(word in user_input for word in ["modern", "contemporary", "style", "design", "aesthetic"]):
            # Analyze prompt for style hints
            if any(word in user_input for word in ["cozy", "warm", "natural", "wood"]):
                enhanced_parts.append("with a rustic style")
            elif any(word in user_input for word in ["clean", "simple", "uncluttered"]):
                enhanced_parts.append("with a minimalist style")
            elif any(word in user_input for word in ["luxury", "elegant", "sophisticated"]):
                enhanced_parts.append("with an elegant style")

    # Check for specific materials
    has_materials = any(material in user_input for material in MATERIALS)
    if not has_materials and not "material" in user_input:
        # Add generic quality materials
        enhanced_parts.append("with quality materials")

    # Check for lighting specification
    has_lighting = any(light in user_input for light in LIGHTING) or "light" in user_input
    if not has_lighting:
        enhanced_parts.append("with beautiful lighting")

    # Add perspective if not specified
    if not any(word in user_input for word in ["view", "angle", "perspective", "looking"]):
        perspectives = [
            "wide-angle view",
            "corner perspective",
            "viewed from the doorway",
            "looking toward the windows"
        ]
        enhanced_parts.append(random.choice(perspectives))

    # Always add quality boosters
    enhanced_parts.append("High quality interior design, professional photography, interior design magazine, detailed textures, 8k resolution")

    # Combine all parts into a coherent prompt
    enhanced_prompt = ". ".join(enhanced_parts)
    enhanced_prompt = re.sub(r'\.+', '.', enhanced_prompt)  # Remove duplicate periods
    enhanced_prompt = enhanced_prompt.replace('..', '.')    # Clean up any double periods

    return enhanced_prompt

# Function to generate images from text prompt
def generate_images(user_input, num_images=3, guidance_scale=7.5, num_inference_steps=50):
    """Generate interior design images based on user input (text-to-image)"""
    # Enhance the prompt
    enhanced_prompt = enhance_prompt(user_input)
    print(f"Enhanced prompt for text-to-image: {enhanced_prompt}")

    try:
        # Generate images with different seeds
        images = []
        for _ in range(num_images):
            # Create a new seed for each image
            generator = torch.Generator(device=device).manual_seed(random.randint(1, 2147483647))
            result = text_to_image_pipe( # Use text_to_image_pipe here
                enhanced_prompt,
                guidance_scale=guidance_scale,
                num_inference_steps=num_inference_steps,
                generator=generator
            )
            images.append(result.images[0])

        return images, enhanced_prompt
    except Exception as e:
        print(f"Error generating images: {str(e)}")
        return [None] * num_images, f"Error: {str(e)}"

# Function to generate images from an input image
def generate_from_image(init_image, user_input, num_images=1, guidance_scale=7.5, num_inference_steps=50, strength=0.8):
    """Generate interior design images based on an input image and a text prompt."""
    enhanced_prompt = enhance_prompt(user_input)
    print(f"Enhanced prompt for img2img: {enhanced_prompt}")

    try:
        images = []
        for _ in range(num_images):
            generator = torch.Generator(device=device).manual_seed(random.randint(1, 2147483647))
            result = img_to_image_pipe(
                prompt=enhanced_prompt,
                image=init_image,
                strength=strength, # How much to transform the original image (0.0 to 1.0)
                guidance_scale=guidance_scale,
                num_inference_steps=num_inference_steps,
                generator=generator
            )
            images.append(result.images[0])
        return images, enhanced_prompt
    except Exception as e:
        print(f"Error generating images from input image: {str(e)}")
        return [None] * num_images, f"Error: {str(e)}"


# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/design-suggestions', methods=['GET'])
def get_design_suggestions():
    """Return design style and room type suggestions"""
    return jsonify({
        'roomTypes': ROOM_TYPES,
        'designStyles': DESIGN_STYLES,
        'materials': MATERIALS,
        'colors': COLORS,
        'lighting': LIGHTING
    })

@app.route('/api/generate', methods=['POST'])
def generate_design():
    """Generate interior design images based on a text prompt"""
    data = request.json
    user_input = data.get('prompt', '')
    quality_level = float(data.get('qualityLevel', 7.5))
    detail_level = int(data.get('detailLevel', 50))
    num_images = min(int(data.get('numImages', 3)), 4)  # Limit to 4 max images

    # Generate images
    images, enhanced_prompt = generate_images(
        user_input,
        num_images=num_images,
        guidance_scale=quality_level,
        num_inference_steps=detail_level
    )

    # Convert images to base64 strings
    image_data = []
    for img in images:
        if img is not None:
            buffered = BytesIO()
            img.save(buffered, format="JPEG", quality=90)
            img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
            image_data.append(img_str)
        else:
            image_data.append(None)

    # Return response
    return jsonify({
        'images': image_data,
        'enhancedPrompt': enhanced_prompt,
        'originalPrompt': user_input
    })

@app.route('/api/generate_from_image', methods=['POST'])
def generate_design_from_image():
    """Generate interior design images based on an uploaded image and a text prompt"""
    data = request.json
    image_b64 = data.get('image', '') # Base64 encoded image string
    user_input = data.get('prompt', '')
    quality_level = float(data.get('qualityLevel', 7.5))
    detail_level = int(data.get('detailLevel', 50))
    num_images = min(int(data.get('numImages', 1)), 4) # Limit to 4 max images
    strength = float(data.get('strength', 0.8)) # How much to transform the original image

    if not image_b64:
        return jsonify({'error': 'No image provided.'}), 400

    try:
        # Decode base64 image string to bytes, then open with PIL
        image_bytes = base64.b64decode(image_b64)
        init_image = Image.open(BytesIO(image_bytes)).convert("RGB") # Ensure RGB format

        # Generate images from the input image
        images, enhanced_prompt = generate_from_image(
            init_image,
            user_input,
            num_images=num_images,
            guidance_scale=quality_level,
            num_inference_steps=detail_level,
            strength=strength
        )

        # Convert generated images to base64 strings
        image_data = []
        for img in images:
            if img is not None:
                buffered = BytesIO()
                img.save(buffered, format="JPEG", quality=90)
                img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                image_data.append(img_str)
            else:
                image_data.append(None)

        # Return response
        return jsonify({
            'images': image_data,
            'enhancedPrompt': enhanced_prompt,
            'originalPrompt': user_input
        })

    except Exception as e:
        print(f"Error processing image or generating design: {str(e)}")
        return jsonify({'error': f'Failed to process image or generate design: {str(e)}'}), 500


# Set up ngrok tunnel
def start_ngrok():
    # Configure ngrok with authtoken from Colab secrets
    try:
        ngrok_auth_token = userdata.get('NGROK_AUTH_TOKEN')
        if not ngrok_auth_token:
            raise ValueError("NGROK_AUTH_TOKEN not found in Colab secrets. Please set it in the Secrets tab.")
        ngrok.set_auth_token(ngrok_auth_token)
    except Exception as e:
        print(f"Error setting ngrok authtoken: {str(e)}")
        raise

    # Get the dev url (will be different each time you run this)
    url = ngrok.connect(5000)
    print(f'Ngrok URL: {url}')
    return url

# Start the Flask app with ngrok
if __name__ == '__main__':
    try:
        # This will make the API accessible from outside Colab
        ngrok_url = start_ngrok()
        app.run(host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"Error starting Flask app with ngrok: {str(e)}")