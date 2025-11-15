import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { PolicyAnalysisResult, ImageAnalysis, ThemeGenerationResult, AppError, ImageInput } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Custom error for the service
export class GeminiServiceError extends Error {
  appError: AppError;

  constructor(appError: AppError) {
    super(appError.message);
    this.name = 'GeminiServiceError';
    this.appError = appError;
  }
}

// Centralized error handler
const handleApiError = (error: unknown, context: string): never => {
  console.error(`Error during ${context}:`, error);

  let details = 'An unknown error occurred.';
  if (error instanceof Error) {
    details = error.message;
  } else if (typeof error === 'string') {
    details = error;
  }

  const appError: AppError = {
    code: 'GEMINI_API_ERROR',
    message: `Đã có lỗi xảy ra trong quá trình ${context}. Vui lòng thử lại.`,
    details: details,
    troubleshooting: [
      "Kiểm tra kết nối mạng của bạn.",
      "API Key của Google AI có thể không hợp lệ hoặc đã hết hạn.",
      "Dịch vụ có thể đang tạm thời quá tải. Vui lòng đợi và thử lại sau ít phút.",
      "Đảm bảo nội dung bạn gửi không chứa thông tin nhạy cảm hoặc bị cấm."
    ]
  };
  
  throw new GeminiServiceError(appError);
};


const generateLifestyleContent = async (imageAnalysis: ImageAnalysis, originalContent: string): Promise<string> => {
    const contentGenPrompt = `
        **PERSONA:**
        Bạn là một "chiến thần" bán hàng online trên mạng xã hội (Facebook, Instagram), chuyên bán hàng hiệu cho giới sành điệu. Bạn tên là Long, hoặc có thể xưng là "em Long" hoặc dùng tên thương hiệu "Fugalo". Giọng văn của bạn "chợ búa" một cách thông minh, đời thường, gần gũi nhưng vẫn toát ra sự "sang" và hiểu biết về sản phẩm. **TUYỆT ĐỐI KHÔNG DÙNG TÊN NÀO KHÁC NGOÀI "Long", "em Long", hoặc "Fugalo" KHI XƯNG HÔ.**

        **NHIỆM VỤ:**
        Viết một bài đăng bán hàng NGẮN GỌN (tối đa 3-5 câu) cho sản phẩm trong ảnh.
        **NỘI DUNG BẮT BUỘC PHẢI DỰA TRÊN HÌNH ẢNH SẢN PHẨM MÀ AI ĐÃ TẠO RA. Bám sát vào các chi tiết của sản phẩm trong ảnh, tránh viết nội dung chung chung hoặc không liên quan.**
        **ƯU TIÊN HÀNG ĐẦU LÀ SỰ NGẮN GỌN. Khách hàng giàu rất lười đọc. Viết sao cho 3-5 câu là đủ sức thuyết phục, đọc xong là muốn inbox mua ngay lập tức.**
        Bài viết phải bằng tiếng Việt.

        **PHONG CÁCH CẦN CÓ:**
        - **Ngôn từ đời thường, tạo trend:** Dùng từ ngữ gần gũi, đôi khi là tiếng lóng, bắt trend.
        - **Đánh vào tâm lý:** Sử dụng các yếu tố gây tò mò, tạo sự khan hiếm, nhấn mạnh giá trị.
        - **Tạo điểm nhấn:** Nội dung phải có "chất riêng", không chung chung.
        - **Phù hợp với ảnh:** Nội dung phải ăn khớp một cách hoàn hảo với hình ảnh sản phẩm đã được AI tạo ra và các gợi ý bên dưới.

        **CÁC VÍ DỤ VỀ PHONG CÁCH CẦN BẮT CHƯỚC:**
        1. "Tìm túi đi làm hàng auth thôi"
        2. "Khăn lụa LV màu camel hay màu mật ong yêu quá 🍃"
        3. "Grok nó đang là trend hả mng 🥹"
        4. "Nếu chị em đang tìm kiếm một chiếc túi thể biến hóa phong cách thời trang của mình trở nên ấn tượng và nổi bật hơn, thì em HM K25 màu cam này chắc chắn sẽ là lựa chọn hoàn hảo. Em Long vẫn luôn sẵn sàng để phục vụ các chị, mang tới các chị những sản phẩm túi xách sang trọng nhất, thời trang nhất."
        5. "Các anh Sếp chú ý. Mẫu túi handbag Bôtega Aauthentic mẫu mới vừa cập bến nhà em đây ạ. Em nhận order Uy tín giá yêu thương. Chất lượng không cần bàn, giá cả phải chăng. Fullbox, bill cho các anh check hoặc tặng. Nếu thấy đẹp hãy cho em 1 tym tạo động lực để em tìm giày đẹp giá rẻ cho mình lựa nha. Em cảm ơn"

        **THAM KHẢO TỪ NỘI DUNG GỐC CỦA NGƯỜI DÙNG (NẾU CÓ):**
        ---
        ${originalContent || "Không có nội dung văn bản gốc."}
        ---
        Nếu nội dung gốc có ý tưởng, giọng văn hay, hoặc thông tin sản phẩm quan trọng, hãy khéo léo chắt lọc và kết hợp vào bài viết mới của bạn. Tuy nhiên, **ưu tiên hàng đầu** vẫn là phong cách "chiến thần" bán hàng và **sự ngắn gọn** đã được mô tả ở trên. Đừng sao chép nguyên văn.

        **BỐI CẢNH ĐỂ BẠN VIẾT BÀI:**
        - Phân tích hình ảnh: ${imageAnalysis.layoutFeedback.join('. ')}
        - Gợi ý sáng tạo: ${imageAnalysis.layoutSuggestions?.map(s => `${s.name}: ${s.description}`).join('. ')}
        
        Bây giờ, hãy viết bài đăng. **Chỉ trả về nội dung bài đăng bằng tiếng Việt.** Không có bất kỳ bình luận, tiêu đề hay markdown nào khác.
    `;
    
    try {
        const contentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contentGenPrompt,
            config: {
                temperature: 0.9
            }
        });
        return contentResponse.text.trim();
    } catch(error) {
        handleApiError(error, 'tạo nội dung lifestyle');
    }
};


export const checkAdPolicy = async (
  content: string,
  contentType: string,
  checkType: string,
  images: ImageInput[] = []
): Promise<PolicyAnalysisResult> => {
  
  const analysisPrompt = `
    Bạn là một chuyên gia hàng đầu về Chính sách quảng cáo của Facebook, luật quảng cáo tại Việt Nam, và là một giám đốc sáng tạo đầy kinh nghiệm. 
    Nhiệm vụ của bạn là phân tích toàn diện nội dung được cung cấp (cả văn bản và hình ảnh), xác định các vi phạm tiềm ẩn, đưa ra gợi ý cải thiện, và cung cấp phiên bản nội dung văn bản đã sửa lỗi.

    Bối cảnh kiểm tra:
    - Dạng content: ${contentType}
    - Loại kiểm tra: ${checkType}

    Nội dung văn bản cần kiểm tra (nếu có):
    ---
    ${content || "Không có nội dung văn bản."}
    ---

    **Phân tích hình ảnh đính kèm (nếu có):**
    Đối với mỗi hình ảnh được cung cấp, hãy thực hiện các phân tích sau:
    1.  **Kiểm tra vi phạm chính sách:** Phân tích hình ảnh để tìm các vi phạm chính sách của Facebook. ĐẶC BIỆT CHÚ Ý đến:
        *   **Mật độ văn bản (Text Density):** Ước tính tỷ lệ văn bản trên hình ảnh. Nếu văn bản có vẻ chiếm hơn 20% diện tích ảnh, hãy báo cáo đây là một vi phạm chính sách tiềm ẩn trong 'policyViolations'.
        *   **Nội dung bị cấm khác:** Bạo lực, nội dung người lớn, tuyên bố gây hiểu lầm, thương hiệu bị cấm, v.v.
    2.  **Phân tích bố cục & Thiết kế (Layout):** Đánh giá bố cục, sự cân đối, điểm nhấn. Hãy tham khảo 7 NGUYÊN TẮC BỐ CỤC CƠ BẢN sau đây khi đưa ra phân tích: Bố cục Trung tâm, Bố cục 1/3, Bố cục Đường chéo, Bố cục Đường dẫn, Bố cục Đối xứng, Bố cục Bất đối xứng, Bố cục Tỉ lệ vàng. Đưa ra các gợi ý cụ thể để cải thiện bố cục sao cho thu hút và chuyên nghiệp hơn dựa trên các nguyên tắc này.
    3.  **Phân tích nhận diện thương hiệu (Branding):** Đánh giá việc sử dụng logo, màu sắc, phông chữ có nhất quán, rõ ràng và chuyên nghiệp không. Đưa ra gợi ý để cải thiện tính nhận diện thương hiệu.
    4.  **Đề xuất Bố cục Sáng tạo (Layout Suggestions):** Dựa trên hình ảnh gốc và 7 nguyên tắc bố cục, đề xuất 2-3 ý tưởng bố cục thay thế để tăng tính hấp dẫn và hiệu quả. Mỗi đề xuất phải có:
        *   'name': Tên ngắn gọn cho ý tưởng bố cục (ví dụ: "Áp dụng Bố cục 1/3", "Tạo sự Đối xứng", "Tập trung vào Đường dẫn").
        *   'description': Mô tả chi tiết cách sắp xếp các yếu tố (sản phẩm, văn bản, logo, CTA) trong bố cục đó.

    **Yêu cầu đối với Nội dung đã sửa (fixedContent):**
    1.  **Giữ lại ý chính:** Giữ lại mục tiêu, thông điệp cốt lõi và thông tin quan trọng (như tên sản phẩm, giá, ưu đãi) từ nội dung gốc.
    2.  **Sửa lỗi vi phạm:** Chỉnh sửa tất cả các từ ngữ, câu chữ, tuyên bố vi phạm chính sách đã được xác định trong phần phân tích.
    3.  **Nâng cao tính chuyên nghiệp và thương hiệu:** Viết lại nội dung với giọng văn chuyên nghiệp, hấp dẫn hơn, phù hợp với hình ảnh thương hiệu (nếu có thể suy ra từ logo hoặc nội dung). Tránh các lỗi chính tả, ngữ pháp.
    4.  **Tối ưu cho quảng cáo:** Nội dung cần ngắn gọn, súc tích, và có lời kêu gọi hành động (call-to-action) rõ ràng, hiệu quả.
    5.  **Không sáng tạo nội dung hoàn toàn mới:** Đây là phiên bản **CHỈNH SỬA** và **CẢI TIỆN** từ nội dung gốc, không phải là một bài viết mới hoàn toàn.

    **Yêu cầu đầu ra:**
    Dựa trên TOÀN BỘ nội dung (cả văn bản và hình ảnh), hãy phân tích kỹ lưỡng và trả về kết quả dưới dạng một đối tượng JSON.
    JSON phải tuân thủ nghiêm ngặt schema sau:
    - status: (string) Trạng thái tuân thủ. Bắt buộc: "compliant", "non_compliant", hoặc "warning".
    - summary: (string) Một câu tóm tắt kết quả phân tích tổng thể.
    - violations: (array) Mảng các đối tượng vi phạm từ cả văn bản và hình ảnh. Nếu không có, trả về mảng rỗng. Mỗi đối tượng có:
      - rule: (string) Tên chính sách bị vi phạm.
      - explanation: (string) Giải thích chi tiết vi phạm.
      - severity: (string) Mức độ nghiêm trọng: "high", "medium", "low".
    - suggestions: (array) Mảng các chuỗi ký tự, đưa ra gợi ý chung để cải thiện quảng cáo.
    - fixedContent: (string) Nội dung VĂN BẢN gốc đã được chỉnh sửa và cải thiện theo các yêu cầu chi tiết ở trên để tuân thủ chính sách và chuyên nghiệp hơn. Nếu không có văn bản hoặc văn bản đã tuân thủ, trả về nội dung gốc.
    - imageAnalysis: (object, optional) Chỉ trả về nếu có hình ảnh được cung cấp. Gồm:
        - policyViolations: (array of strings) Danh sách các vi phạm chính sách tìm thấy trong hình ảnh.
        - layoutFeedback: (array of strings) Danh sách các gợi ý cải thiện bố cục và thiết kế.
        - brandingFeedback: (array of strings) Danh sách các gợi ý cải thiện về nhận diện thương hiệu.
        - layoutSuggestions: (array of objects) Danh sách các gợi ý về bố cục sáng tạo. Mỗi object có 'name' và 'description'.

    Chỉ trả về đối tượng JSON, không có bất kỳ văn bản hay định dạng markdown nào khác.
  `;
  
  const imageAnalysisSchema = {
      type: Type.OBJECT,
      properties: {
          policyViolations: { type: Type.ARRAY, items: { type: Type.STRING } },
          layoutFeedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          brandingFeedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          layoutSuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['name', 'description']
            }
          },
      },
      required: ['policyViolations', 'layoutFeedback', 'brandingFeedback', 'layoutSuggestions'],
  };

  const properties = {
    status: { type: Type.STRING, description: "Must be one of: 'compliant', 'non_compliant', or 'warning'." },
    summary: { type: Type.STRING },
    violations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rule: { type: Type.STRING },
          explanation: { type: Type.STRING },
          severity: { type: Type.STRING, description: "Must be one of: 'high', 'medium', or 'low'." },
        },
        required: ['rule', 'explanation', 'severity'],
      },
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    fixedContent: { type: Type.STRING },
    imageAnalysis: imageAnalysisSchema,
  };

  const required = ['status', 'summary', 'violations', 'suggestions', 'fixedContent'];
  if (images.length > 0) {
    required.push('imageAnalysis');
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties,
    required,
  };

  try {
    const textPart = { text: analysisPrompt };
    const allImageParts = images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [textPart, ...allImageParts] },
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = analysisResponse.text.trim();
    const analysisResult = JSON.parse(jsonText) as PolicyAnalysisResult;

    if (images.length > 0 && analysisResult.imageAnalysis) {
        
        try {
            const generationPrompt = `
                You are a high-end lifestyle photographer and creative director for luxury brands. Your signature style is "effortless chic" – creating images that feel authentic, artistic, and aspirational, targeting discerning, wealthy customers.

                **ABSOLUTE CORE MISSION:**
                The product from the user's original image MUST remain 100% identical. DO NOT change, alter, or redraw the product in any way—preserve its shape, color, texture, and lighting perfectly. You are only changing the context around it.

                **YOUR TASK:**
                Create a compelling, lifestyle-oriented image by placing the untouched product into a new, sophisticated scene. The goal is an eye-catching, unique image that feels like a glimpse into a stylish life, not a generic ad.

                **CREATIVE DIRECTION & INSPIRATION:**
                - **Vibe:** Candid, "in-the-moment," and natural. Avoid anything that looks overly staged or like a stock photo.
                - **Lighting:** Use natural, soft lighting. Avoid harsh, artificial studio lights.
                - **Composition:** Be bold and artistic. Use unconventional angles, creative framing, and interesting negative space. The layout must be unique and captivating.
                - **Setting:** The background should be a sophisticated, real-world setting that complements the product. Think: a minimalist modern apartment, a chic cafe corner with soft morning light, an art gallery, or a luxury travel scene.
                - **Expert Feedback:** Also incorporate these specific suggestions to guide the new background and layout:
                  - Layout Improvements: ${analysisResult.imageAnalysis.layoutFeedback.join('. ')}
                  - Creative Ideas: ${analysisResult.imageAnalysis.layoutSuggestions?.map(s => `${s.name}: ${s.description}`).join('. ')}

                **CRUCIAL RULES:**
                1.  **NO TEXT:** The generated image must be purely visual. No words, letters, or logos.
                2.  **PHOTOREALISTIC:** The final output should be a seamless, realistic composition.
                3.  **AVOID:** Do not create a boring, centered product shot. Avoid the polished "magazine ad" or "e-commerce catalog" look.

                Now, generate the new image.
            `;

            const originalImagePart = { inlineData: { mimeType: images[0].mimeType, data: images[0].data } };
            const generationTextPart = { text: generationPrompt };
            
            const generationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [originalImagePart, generationTextPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const imagePart = generationResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart && imagePart.inlineData) {
                analysisResult.generatedImage = imagePart.inlineData.data;
            }
        } catch (imageGenError) {
            console.error("Error during demo image generation (gracefully handled):", imageGenError);
        }

        try {
            analysisResult.lifestyleContent = await generateLifestyleContent(analysisResult.imageAnalysis, content);
        } catch (contentGenError) {
            console.error("Error during lifestyle content generation (gracefully handled):", contentGenError);
        }
    }

    return analysisResult;

  } catch (error) {
    handleApiError(error, "phân tích chính sách");
  }
};

export const regenerateImage = async (
    originalImageBase64: string,
    mimeType: string,
    imageAnalysis: ImageAnalysis,
): Promise<{ generatedImage?: string }> => {
    const imageGenPrompt = `
        You are a high-end lifestyle photographer and creative director for luxury brands. Your signature style is "effortless chic" – creating images that feel authentic, artistic, and aspirational, targeting discerning, wealthy customers.

        **ABSOLUTE CORE MISSION:**
        The product from the user's original image MUST remain 100% identical. DO NOT change, alter, or redraw the product in any way—preserve its shape, color, texture, and lighting perfectly. You are only changing the context around it.

        **YOUR TASK:**
        Create a compelling, lifestyle-oriented image by placing the untouched product into a new, sophisticated scene. The goal is an eye-catching, unique image that feels like a glimpse into a stylish life, not a generic ad.

        **CREATIVE DIRECTION & INSPIRATION:**
        - **Vibe:** Candid, "in-the-moment," and natural. Avoid anything that looks overly staged or like a stock photo.
        - **Lighting:** Use natural, soft lighting. Avoid harsh, artificial studio lights.
        - **Composition:** Be bold and artistic. Use unconventional angles, creative framing, and interesting negative space. The layout must be unique and captivating.
        - **Setting:** The background should be a sophisticated, real-world setting that complements the product. Think: a minimalist modern apartment, a chic cafe corner with soft morning light, an art gallery, or a luxury travel scene.
        - **Expert Feedback:** Also incorporate these specific suggestions to guide the new background and layout:
          - Layout Improvements: ${imageAnalysis.layoutFeedback.join('. ')}
          - Creative Ideas: ${imageAnalysis.layoutSuggestions?.map(s => `${s.name}: ${s.description}`).join('. ')}

        **CRUCIAL RULES:**
        1.  **NO TEXT:** The generated image must be purely visual. No words, letters, or logos.
        2.  **PHOTOREALISTIC:** The final output should be a seamless, realistic composition.
        3.  **AVOID:** Do not create a boring, centered product shot. Avoid the polished "magazine ad" or "e-commerce catalog" look.

        Now, generate the new image. Only output the image.
    `;

    try {
        const originalImagePart = { inlineData: { mimeType: mimeType, data: originalImageBase64 } };
        const imageGenTextPart = { text: imageGenPrompt };

        const imageGenerationResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [originalImagePart, imageGenTextPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        let generatedImage: string | undefined;
        const imagePart = imageGenerationResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            generatedImage = imagePart.inlineData.data;
        }

        return { generatedImage };

    } catch (error) {
        handleApiError(error, "tạo lại hình ảnh");
    }
};

export const editImage = async (
    base64ImageData: string,
    prompt: string
): Promise<{ editedImage?: string }> => {
    try {
        const imagePart = { inlineData: { mimeType: 'image/png', data: base64ImageData } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        let editedImage: string | undefined;
        const responseImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (responseImagePart && responseImagePart.inlineData) {
            editedImage = responseImagePart.inlineData.data;
        }

        return { editedImage };

    } catch (error) {
        handleApiError(error, "chỉnh sửa hình ảnh");
    }
};

export const regenerateLifestyleContent = async (
  imageAnalysis: ImageAnalysis,
  originalContent: string
): Promise<{ lifestyleContent?: string }> => {
    try {
        const lifestyleContent = await generateLifestyleContent(imageAnalysis, originalContent);
        return { lifestyleContent };
    } catch (error) {
        handleApiError(error, "tạo lại nội dung");
    }
};

export const generateThemeFromLogo = async (logoBase64: string): Promise<ThemeGenerationResult> => {
    const prompt = `
        As a branding expert, analyze the provided logo image. Your task is to extract a cohesive color palette and provide design recommendations.
        
        **Instructions:**
        1.  **Extract Colors:** Identify 5-6 key colors from the logo. Categorize them into roles like 'primary', 'secondary', 'accent', 'neutralDark', 'neutralLight'. Provide their hex codes.
        2.  **Analyze Identity & Provide Rationale:** In 2-3 sentences, analyze the brand's visual identity based on the logo (e.g., "modern and energetic," "classic and trustworthy"). Explain why you chose these colors and how they contribute to the brand's feel.
        3.  **Provide Recommendations:** Briefly suggest how to use this color palette effectively in advertisements to maintain brand consistency.

        Return the result as a single JSON object that strictly adheres to the provided schema. Do not include any other text or markdown formatting.
    `;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            colors: {
              type: Type.OBJECT,
              description: "A palette of 5-6 colors extracted from the logo as hex codes. Keys should be descriptive like 'primary', 'secondary', 'accent', 'neutralDark', 'neutralLight'.",
            },
            explanation: {
              type: Type.STRING,
              description: "A 2-3 sentence analysis of the brand's visual identity based on the logo, and recommendations for using the color palette in ads.",
            }
        },
        required: ['colors', 'explanation']
    };

    try {
        const imagePart = { inlineData: { mimeType: 'image/png', data: logoBase64 } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema,
                temperature: 0.3,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ThemeGenerationResult;

    } catch (error) {
        handleApiError(error, "tạo theme từ logo");
    }
};

export const generateProductAlbum = async (
    sourceImageBase64: string,
    sourceImageMimeType: string,
    includeModel: boolean
): Promise<{ hero: string; details: string[] }> => {
    try {
        const analysisPrompt = `Analyze the product in this image. Identify its category, brand (if visible), and most importantly, list 3-5 key features a potential buyer would want to inspect closely. For example, for a luxury handbag, this could be 'the interior lining and pockets', 'the metal logo hardware', 'the quality of the leather grain', 'the clasp mechanism', 'the stitching on the handles'. For a car, it could be 'the alloy wheel design', 'the dashboard layout', 'the leather seat texture'. Keep the list concise.`;

        const analysisResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [
                    { inlineData: { data: sourceImageBase64, mimeType: sourceImageMimeType } },
                    { text: analysisPrompt }
                ]
            }
        });
        const keyFeatures = analysisResponse.text.trim();

        const modelInstruction = includeModel 
            ? "The photo should include a person interacting with or modeling the product naturally. The person should complement the product's style."
            : "The photo should focus solely on the product. Do not include any people.";

        const heroPrompt = `You are a social media content creator specializing in authentic, everyday lifestyle photos for high-end products. Your style is simple, candid, and relatable, often set in authentic Vietnamese contexts like a local cafe in Hanoi, on a vintage tiled floor, or a rustic wooden table.
        
        **TASK:** Create a single, wide 16:9 hero image. ${modelInstruction}
        
        **BACKGROUND:** The setting should feel like a real, unstaged moment. Use natural light.
        
        **CORE MISSION:** The product itself—its shape, color, texture, and details—must remain 100% unchanged. Only modify the background and context.`;

        const detailPrompts = [
            `**TASK:** Create a 1:1 square image showing a clean, clear, **front view** of the product against a simple, non-distracting background.`,
            `**TASK:** Create a 1:1 square image showing a clean, clear, **back view** of the product.`,
            `**TASK:** Create a 1:1 square image showing a **45-degree angle view** of the product to highlight its depth and shape.`,
            `**TASK:** Create a 1:1 square image showing the **interior** of the product. It must be open to clearly display the lining and internal structure.`,
            `**TASK:** Create a 1:1 square **macro (extreme close-up) shot** focusing on one of these key features identified earlier: ${keyFeatures}. Pick the most visually interesting one.`
        ];
        
        const baseDetailPrompt = `You are a professional product photographer.
        
        **BACKGROUND:** Use a simple, clean, neutral studio background (light grey, off-white) to ensure the product is the absolute focus.
        
        **CORE MISSION:** The product itself must remain 100% unchanged from the original. Only modify the background and the viewing angle as specified in the task.`;

        const generateEditedImage = async (prompt: string): Promise<string> => {
            const sourceImagePart = { inlineData: { data: sourceImageBase64, mimeType: sourceImageMimeType } };
            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [sourceImagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart && imagePart.inlineData) {
                return imagePart.inlineData.data;
            }
            throw new Error(`Failed to generate image for prompt: ${prompt.substring(0, 50)}...`);
        };
        
        const heroPromise = generateEditedImage(heroPrompt);
        const detailPromises = detailPrompts.map(p => generateEditedImage(`${baseDetailPrompt}\n${p}`));

        const [hero, ...details] = await Promise.all([heroPromise, ...detailPromises]);

        return { hero, details };

    } catch (error) {
        handleApiError(error, "tạo album sản phẩm AI");
    }
};