# Indoor-scene-generation-using-Zero-Shot-Learning
:
🏠 Interior Design Studio

An AI-powered interior design tool built with React that uses a CLIP-based processor to generate custom room designs, analyze layouts, and provide style suggestions.

<!-- Optional: Add a screenshot of your app -->

✨ Features

AI-Generated Designs with CLIP – Uses a CLIP-based model to interpret text prompts and generate high-quality, style-accurate room designs.

Room Layout Analysis – Upload a room image (JPG, PNG, WebP, AVIF up to 5MB) and get furniture rearrangement suggestions.

Customizable Parameters – Adjust style adherence, detail level, and the number of images generated.

Design Presets – Quick inspiration with styles like Modern Living Room, Cozy Bedroom, and more.

Dynamic Suggestions – Get curated ideas for room types, styles, colors, and materials.

Download Designs – Save your favorite generated images directly.

🛠 Tech Stack

Frontend: React, Axios, Tailwind CSS, React Spinners

AI Processing: CLIP-based processor for prompt-image understanding and generation

State Management: React Hooks (useState, useEffect)

Backend API: Accepts text prompts & image uploads for AI generation/analysis

File Handling: Supports JPG, PNG, WebP, AVIF (max 5MB)

🚀 Getting Started
1️⃣ Clone the repository
git clone https://github.com/yourusername/interior-design-studio.git
cd interior-design-studio

2️⃣ Install dependencies
npm install

3️⃣ Configure API endpoint

Create a .env file in the project root:

REACT_APP_API_URL=https://your-api-endpoint.com

4️⃣ Run the app locally
npm start


Your app will run at http://localhost:3000.

📸 Usage

Upload a room photo (optional) for layout analysis.

Enter a custom design prompt or choose from presets.

Adjust sliders for quality, detail, and image count.

Generate and review the AI-created designs.

Download images you like.

🧪 Running Tests
npm test

📄 License

This project is licensed under the MIT License – see the LICENSE file for details.
