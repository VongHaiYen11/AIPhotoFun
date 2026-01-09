/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert data URL to Part
const fileToGenerativePart = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
    if (!match) {
        throw new Error('Invalid data URL format');
    }
    const mimeType = match[1];
    const data = match[2];
    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};

// Helper function to extract image data from response
const extractImageData = (response: GenerateContentResponse): string => {
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates returned from the model.");
    }
    
    const candidate = response.candidates[0];
    let generatedText = "";
    
    if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            if (part.text) {
                generatedText += part.text;
            }
        }
    }

    if (candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
         throw new Error(`Image generation stopped due to: ${candidate.finishReason}. Check safety ratings.`);
    }

    if (generatedText) {
        throw new Error(`Model returned text instead of image: "${generatedText.substring(0, 150)}..."`);
    }

    throw new Error("No image was generated. The model may have returned only text or empty content.");
};


/**
 * A generic function to generate an image based on a prompt and multiple input images.
 */
export async function generateStyledImage(prompt: string, imageUrls: string[], additionalInstructions?: string): Promise<string> {
    const fullPrompt = additionalInstructions ? `${prompt}\n\nAdditional Instructions: ${additionalInstructions}` : prompt;
    
    const imageParts = imageUrls.map(url => fileToGenerativePart(url));

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                ...imageParts,
                { text: fullPrompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageData(response);
}


export async function extractOutfitFromImage(imageDataUrl: string, instructions?: string): Promise<string> {
    const prompt = `Your task is to isolate and extract only the complete outfit (clothing, shoes, accessories) worn by the person in the provided image.
    
    **CRITICAL INSTRUCTIONS:**
    1.  **Isolate the Outfit:** Identify all articles of clothing, footwear, and accessories.
    2.  **Remove the Person and Background:** The final image MUST NOT contain the person (no skin, no face, no hair) or the original background.
    3.  **Generate a Clean Output:** Place the extracted outfit on a solid, neutral light grey background.
    4.  **Maintain Realism:** The outfit should be presented as a photorealistic "flat lay" or as if on an invisible mannequin, preserving its original shape, texture, and colors.
    
    ${instructions ? `\n**Additional Instructions:** ${instructions}` : ''}`;

    const imagePart = fileToGenerativePart(imageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageData(response);
}

export async function fillMaskedImage(prompt: string, maskedImageDataUrl: string, additionalInstructions?: string): Promise<string> {
    const fullPrompt = `Inpainting Task.
    The provided image contains a transparent area (the mask).
    
    **Goal:**
    Fill the transparent area based EXCLUSIVELY on this instruction: "${prompt}".

    **CRITICAL INSTRUCTIONS:**
    1.  **Content:** Generate the object, texture, or scene described in the prompt within the transparent area.
    2.  **Integration:** The new content must seamlessly blend with the surrounding pixels in terms of lighting, shadows, perspective, and style.
    3.  **Cohesion:** The final result should look like a single, unaltered photograph.
    4.  **Constraint:** Do NOT change the non-transparent parts of the image.

    ${additionalInstructions ? `**Refinement:** ${additionalInstructions}` : ''}`;
    
    const imagePart = fileToGenerativePart(maskedImageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: fullPrompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageData(response);
}

export async function removeObjectFromImage(maskedImageDataUrl: string): Promise<string> {
    // Explicitly instruct the model about the transparency mask
    const prompt = `Inpainting and Object Removal Task.
    The provided image contains a transparent area (alpha channel = 0) where an object was removed.
    
    **TASK:**
    Fill the transparent area ("inpainting") to restore the background.
    
    **CRITICAL INSTRUCTIONS:**
    1.  Analyze the surrounding pixels (context) around the transparent hole.
    2.  Generate new pixels to fill the hole that perfectly continue the surrounding background textures, lighting, and shadows.
    3.  The result must look as if the object never existed.
    4.  Output the full image with the hole filled. Do not leave any transparency.
    5.  DO NOT regenerate the object. The goal is to make it disappear.`;
    
    const imagePart = fileToGenerativePart(maskedImageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageData(response);
}

export async function removeBackgroundFromImageAtPoint(imageDataUrl: string, x: number, y: number): Promise<string> {
    const prompt = `Your task is to perform foreground segmentation. The user has provided an image and a coordinate point (x=${Math.round(x)}, y=${Math.round(y)}) that is on the main subject they want to keep.

    **CRITICAL INSTRUCTIONS:**
    1.  Identify the primary object/person at the specified coordinate.
    2.  Create a precise and clean segmentation mask for that entire object/person.
    3.  Make the background completely transparent.
    4.  The output must be a PNG image with a transparent background, containing only the segmented foreground subject.`;
    
    const imagePart = fileToGenerativePart(imageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageData(response);
}

export async function swapFacesInImage(sourceImageDataUrl: string, targetFaceDataUrl: string, mask?: any, additionalInstructions?: string): Promise<string> {
    const prompt = `Your task is to perform a face swap.
    - The **first image** is the source image that needs to be modified.
    - The **second image** contains the target face that should be transferred onto the person in the first image.

    **CRITICAL INSTRUCTIONS:**
    1.  Identify the face in the second image.
    2.  Identify the primary face in the first image.
    3.  Replace the face in the first image with the face from the second image.
    4.  The final result must be seamless and photorealistic. You must adjust lighting, skin tone, and perspective of the swapped face to perfectly match the source image's environment.
    5.  Preserve the hair, clothing, and background of the first image.

    ${additionalInstructions ? `**User Refinement:** ${additionalInstructions}` : ''}`;
    
    const sourceImagePart = fileToGenerativePart(sourceImageDataUrl);
    const targetFacePart = fileToGenerativePart(targetFaceDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [sourceImagePart, targetFacePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageData(response);
}

export async function generatePhotoBoothImage(imageDataUrl: string, count: number): Promise<string> {
    let gridLayout = "grid";
    // Define explicit layouts to help the model count
    if (count === 4) gridLayout = "2x2 grid (2 rows, 2 columns)";
    else if (count === 6) gridLayout = "2x3 grid (2 columns, 3 rows)";
    else if (count === 8) gridLayout = "2x4 grid (2 columns, 4 rows)";
    else if (count === 9) gridLayout = "3x3 grid (3 rows, 3 columns)";
    else if (count === 12) gridLayout = "3x4 grid (3 columns, 4 rows)";

    const prompt = `Generate an image. Create a photobooth-style photo strip/collage using the person from the provided image.

    **CRITICAL INSTRUCTIONS:**
    1.  **Layout:** Generate a single image containing EXACTLY **${count}** separate panels arranged in a **${gridLayout}**.
    2.  **Subject:** Every panel must feature the **exact same person** from the original image.
    3.  **Variety:** Each of the ${count} panels must show a DIFFERENT pose or facial expression (smiling, laughing, serious, winking, peace sign, etc.).
    4.  **Consistency:** Maintain consistent lighting and background style across all panels, typical of a photo booth.
    5.  **Identity:** The person's facial features must remain consistent and identical to the source image.
    6.  **Counting:** Do not generate more or fewer than ${count} panels.
    7.  **Format:** Output ONLY the final image. Do not provide any text descriptions.`;
    
    const imagePart = fileToGenerativePart(imageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageData(response);
}

export async function generateCloneEffectImage(imageDataUrl: string, instructions?: string): Promise<string> {
    const prompt = `Your task is to create a "clone" effect photo. Take the single person from the provided image and create a new image where there are three versions of that same person in different poses, interacting within the same scene.

**PRIMARY DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION (NON-NEGOTIABLE)**
Your single most important, critical, and unbreakable task is to perfectly preserve the identity of the original person. All three "clones" MUST be photorealistic, 100% identical replicas of the person in the original photo. Do not change their facial features, age, or structure. This rule overrides all other instructions.

**SECONDARY TASK: CLONE COMPOSITION**
1.  **Triple the Person:** The final image must contain three instances of the person from the original photo.
2.  **Vary the Poses:** Each clone should be in a different, natural-looking pose.
3.  **Seamless Composition:** The clones must be composited into the original background seamlessly. Pay close attention to lighting, shadows, and perspective to make it look like a real, single photograph.
    
    ${instructions ? `\n**REFINEMENT INSTRUCTIONS (apply ONLY these minor changes while strictly following the IDENTITY PRESERVATION directive):**\n${instructions}` : ''}`;
    
    const imagePart = fileToGenerativePart(imageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageData(response);
}

export async function generateBackgroundFromConcept(imageDataUrl: string): Promise<string> {
    const prompt = `Analyze the provided concept/mood board image. Your task is to generate a clean, empty, photorealistic background scene inspired by the overall theme, color palette, and style of the image.

    **CRITICAL INSTRUCTIONS:**
    1.  **DO NOT include any people, characters, or foreground objects** from the original image.
    2.  The output must be a background ONLY.
    3.  Capture the essence and mood of the concept image (e.g., if it's a forest scene, create an empty forest background; if it's a futuristic city, create an empty futuristic cityscape).`;
    
    const imagePart = fileToGenerativePart(imageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    return extractImageData(response);
}

export async function generatePoseFromImage(imageDataUrl: string, boneNames: string[], refinementPrompt?: string): Promise<Record<string, { x: number, y: number, z: number }>> {
    const prompt = `Analyze the pose of the person in the provided image. Your task is to translate this pose into a JSON object of bone rotations in radians.

    **CRITICAL INSTRUCTIONS:**
    1.  The output MUST be a valid JSON object and nothing else.
    2.  The JSON object should contain keys corresponding to the following bone names: ${boneNames.join(', ')}.
    3.  Each key's value should be an object with "x", "y", and "z" properties, representing the rotation in radians for that axis.
    4.  Estimate the rotations to match the pose in the image as accurately as possible.

    ${refinementPrompt ? `**User Refinement:** Apply the following adjustment: "${refinementPrompt}"` : ''}`;
    
    const imagePart = fileToGenerativePart(imageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: 'application/json' },
    });

    try {
        let text = response.text.trim();
        if (text.startsWith('```json')) {
            text = text.substring(7, text.length - 3).trim();
        } else if (text.startsWith('```')) {
             text = text.substring(3, text.length - 3).trim();
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON from model response:", response.text);
        throw new Error("Model returned invalid JSON for pose data.");
    }
}

export async function generateDepthMap(imageDataUrl: string): Promise<string> {
    const prompt = `Your task is to generate a depth map for the provided image.
    
    **CRITICAL INSTRUCTIONS:**
    1.  **Output Format:** You MUST return a single image file. Do NOT return text.
    2.  **Depth Representation:** The output image must be a grayscale depth map where:
        - **White (Light)** represents objects that are **closest** to the camera.
        - **Black (Dark)** represents objects that are **farthest** away (background).
    3.  **Accuracy:** Preserve the shapes and edges of the objects in the original image.`;
    
    const imagePart = fileToGenerativePart(imageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { 
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            systemInstruction: "You are an expert depth map generator. You always return an image."
        },
    });

    return extractImageData(response);
}

export async function generateProductMockup(logoDataUrl: string, productDataUrl: string): Promise<string> {
    const prompt = `Your task is to create a product mockup.
    - The **first image** is a logo with a transparent background.
    - The **second image** is a product photo.

    **CRITICAL INSTRUCTIONS:**
    1.  Take the logo from the first image and realistically apply it to the surface of the product in the second image.
    2.  The placement of the logo should be natural and centered, where a brand logo would typically appear on such a product.
    3.  You MUST adjust the logo's perspective, lighting, and texture to perfectly match the product's surface. It should look like it was printed on or part of the product, not just pasted on top.
    4.  Preserve the original product and its background entirely. The only change should be the addition of the logo.`;
    
    const logoPart = fileToGenerativePart(logoDataUrl);
    const productPart = fileToGenerativePart(productDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [logoPart, productPart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    return extractImageData(response);
}

export async function generateGraphicFromPrompt(prompt: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a high-resolution, professional graphic suitable for a t-shirt, based on the following description: "${prompt}". The graphic should be isolated on a transparent background. The style should be bold and clear.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png'
        }
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("AI Graphic Designer failed to generate an image.");
    }
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}

export async function generateApparelMockup(designDataUrl: string, apparelPrompt: string): Promise<string> {
    const prompt = `
Your task is to create a photorealistic apparel mockup.
- The provided image is a design graphic with a transparent background.
- Your instructions for the apparel are: "${apparelPrompt}".

**CRITICAL INSTRUCTIONS:**
1.  **Generate Apparel:** Create a high-quality, photorealistic image of the apparel as described in the instructions. Pay attention to fabric, style, color, and mockup style (e.g., hanging, flat lay).
2.  **Apply Graphic:** Take the design from the provided image and realistically apply it to the apparel.
3.  **Realism is Key:** The design must conform to the folds, texture, and lighting of the fabric. It should look like it was printed on the garment, not just pasted on top.
4.  **Clean Background:** Place the final mockup on a clean, neutral, professional studio background.`;
    
    const designPart = fileToGenerativePart(designDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [designPart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    return extractImageData(response);
}

export async function generateTypographicIllustration(phrase: string): Promise<string> {
    const prompt = `Using only the letters from the phrase ["${phrase}"], create a minimalist black and white typographic illustration depicting the scene described by the phrase. Each letter should be creatively shaped and arranged to form a sense of motion and represent the elements in the scene. The design must be clean and minimal, comprising the entire manipulated alphabet of ["${phrase}"] without any additional shapes or lines. The letters should bend or curve to mimic the natural forms of the scene while remaining legible. The final image should be on a clean, solid, light grey background. Output only the image.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageData(response);
}
    
export async function generateConceptSuggestions(imageUrls: string[], availablePoses: string[], availableAngles: string[], availableGrades: string[]): Promise<{ background: string, poses: string[], cameraAngle: string, colorGrade: string }> {
    const imageParts = imageUrls.map(url => fileToGenerativePart(url));
    const prompt = `Analyze the provided image(s) of clothing and/or objects. Based on them, generate a creative photoshoot concept. Provide your answer as a valid JSON object.

**CRITICAL INSTRUCTIONS:**
1.  **background**: A detailed description of a suitable background scene.
2.  **poses**: An array of exactly 5 pose IDs that best fit the concept. Choose ONLY from this list: [${availablePoses.join(', ')}].
3.  **cameraAngle**: A single camera angle ID that best fits the concept. Choose ONLY from this list: [${availableAngles.join(', ')}].
4.  **colorGrade**: A single color grade ID that best fits the concept. Choose ONLY from this list: [${availableGrades.join(', ')}].

Your output must be a valid JSON object and nothing else.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    background: { type: Type.STRING },
                    poses: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    cameraAngle: { type: Type.STRING },
                    colorGrade: { type: Type.STRING },
                },
                required: ['background', 'poses', 'cameraAngle', 'colorGrade']
            }
        },
    });
    
    try {
        let text = response.text.trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON from model response for concepts:", response.text);
        throw new Error("Model returned invalid JSON for concept suggestions.");
    }
}
    
export async function recolorImageWithPaletteImage(
    originalImageDataUrl: string,
    paletteImageDataUrl: string,
    dimensions: { width: number, height: number }
): Promise<string> {
    const prompt = `
Your task is to perform a color palette swap.
- The **first image** is the source image that needs to be recolored.
- The **second image** is the color palette reference.

**CRITICAL INSTRUCTIONS:**
1.  **Extract Palette:** Analyze the second image and identify its dominant color palette.
2.  **Recolor Source Image:** Apply the extracted color palette to the first image. You must replace the original colors of the source image with colors from the palette image.
3.  **Preserve Structure:** The content, shapes, lighting, and textures of the first image must be perfectly preserved. The only change should be the colors.
4.  **Enforce Dimensions:** The final output image MUST be exactly ${dimensions.width} pixels wide by ${dimensions.height} pixels tall.

The result should be a new version of the first image, but as if onlay created using only the colors from the second image.`;

    const originalImagePart = fileToGenerativePart(originalImageDataUrl);
    const paletteImagePart = fileToGenerativePart(paletteImageDataUrl);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, paletteImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    return extractImageData(response);
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
    const fullPrompt = `Photorealistic, full-body photo of a model for a fashion photoshoot. ${prompt}. Clean studio background, professional lighting, looking at the camera.`;
        
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png'
        }
    });
    
    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("AI failed to generate an image.");
    }
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}
