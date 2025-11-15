
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { PolicyAnalysisResult, ImageAnalysis } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const generateLifestyleContent = async (imageAnalysis: ImageAnalysis, originalContent: string): Promise<string> => {
    const contentGenPrompt = `
        **PERSONA:**
        Bạn là một "chiến thần" bán hàng online trên mạng xã hội (Facebook, Instagram), chuyên bán hàng hiệu cho giới sành điệu. Giọng văn của bạn "chợ búa" một cách thông minh, đời thường, gần gũi nhưng vẫn toát ra sự "sang" và hiểu biết về sản phẩm.

        **NHIỆM VỤ:**
        Viết một bài đăng bán hàng NGẮN GỌN (tối đa 3-5 câu) cho sản phẩm trong ảnh.
        **ƯU TIÊN HÀNG ĐẦU LÀ SỰ NGẮN GỌN. Khách hàng giàu rất lười đọc. Viết sao cho 3-5 câu là đủ sức thuyết phục, đọc xong là muốn inbox mua ngay lập tức.**
        Bài viết phải bằng tiếng Việt.

        **PHONG CÁCH CẦN CÓ:**
        - **Ngôn từ đời thường, tạo trend:** Dùng từ ngữ gần gũi, đôi khi là tiếng lóng, bắt trend.
        - **Đánh vào tâm lý:** Sử dụng các yếu tố gây tò mò, tạo sự khan hiếm, nhấn mạnh giá trị.
        - **Tạo điểm nhấn:** Nội dung phải có "chất riêng", không chung chung.
        - **Phù hợp với ảnh:** Nội dung phải ăn khớp một cách hoàn hảo với hình ảnh AI đã tạo ra.

        **CÁC VÍ DỤ VỀ PHONG CÁCH CẦN BẮT CHƯỚC:**
        1. "Tìm túi đi làm hàng auth thôi"
        2. "Khăn lụa LV màu camel hay màu mật ong yêu quá 🍃"
        3. "Grok nó đang là trend hả mng 🥹"
        4. "Nếu chị em đang tìm kiếm một chiếc túi thể biến hóa phong cách thời trang của mình trở nên ấn tượng và nổi bật hơn, thì em HM K25 màu cam này chắc chắn sẽ là lựa chọn hoàn hảo. Em Thư vẫn luôn sẵn sàng để phục vụ các chị, mang tới các chị những sản phẩm túi xách sang trọng nhất, thời trang nhất."
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
    
    const contentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentGenPrompt,
        config: {
            temperature: 0.9
        }
    });

    return contentResponse.text.trim();
};


export const checkAdPolicy = async (
  content: string,
  contentType: string,
  checkType: string,
  images: string[] = []
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
    - fixedContent: (string) Nội dung VĂN BẢN đã được viết lại để tuân thủ. Nếu không có văn bản hoặc văn bản đã tuân thủ, trả về nội dung gốc.
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
        mimeType: 'image/jpeg',
        data: img,
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

    // If images were analyzed, attempt to generate a new demo image and lifestyle content.
    // These are treated as enhancements. If they fail, the core analysis is still returned.
    if (images.length > 0 && analysisResult.imageAnalysis) {
        
        // --- Generate Demo Image ---
        try {
            const generationPrompt = `
                As a creative director, redesign the provided user's image based on the following expert feedback.
                The goal is to create a more compelling and effective ad visual.
                Maintain the core subject and product, but improve the composition and layout.

                **Crucial Instruction: Do not include any text, words, or letters in the generated image. The image should be purely visual, focusing only on the product and its environment.**

                **Expert Feedback to Apply:**
                - **Layout Improvements:** ${analysisResult.imageAnalysis.layoutFeedback.join('. ')}
                - **Creative Suggestions:** ${analysisResult.imageAnalysis.layoutSuggestions?.map(s => `${s.name}: ${s.description}`).join('. ')}

                Generate a new image that visually implements these suggestions.
            `;

            const originalImagePart = { inlineData: { mimeType: 'image/jpeg', data: images[0] } };
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
            console.error("Error during demo image generation:", imageGenError);
            console.log("Image generation failed, but proceeding gracefully with the main analysis.");
            // analysisResult.generatedImage will remain undefined, which is the desired fallback.
        }

        // --- Generate Lifestyle Content ---
        try {
            // This content is generated based on the original analysis, regardless of whether the new image was created successfully.
            analysisResult.lifestyleContent = await generateLifestyleContent(analysisResult.imageAnalysis, content);
        } catch (contentGenError) {
            console.error("Error during lifestyle content generation:", contentGenError);
            console.log("Lifestyle content generation failed, but proceeding gracefully with the main analysis.");
            // analysisResult.lifestyleContent will remain undefined.
        }
    }

    return analysisResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get analysis from AI service.");
  }
};

export const regenerateImage = async (
    originalImageBase64: string,
    imageAnalysis: ImageAnalysis,
): Promise<{ generatedImage?: string }> => {
    const imageGenPrompt = `
        As a creative director, redesign the provided user's image based on the following expert feedback.
        The goal is to create a more compelling and effective ad visual.
        Maintain the core subject and product, but improve the composition and layout.

        **Crucial Instruction: Do not include any text, words, or letters in the generated image. The image should be purely visual, focusing only on the product and its environment.**

        **Expert Feedback to Apply:**
        - **Layout Improvements:** ${imageAnalysis.layoutFeedback.join('. ')}
        - **Creative Suggestions:** ${imageAnalysis.layoutSuggestions?.map(s => `${s.name}: ${s.description}`).join('. ')}

        Generate a new image that visually implements these suggestions. Only output the image.
    `;

    try {
        const originalImagePart = { inlineData: { mimeType: 'image/jpeg', data: originalImageBase64 } };
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
        console.error("Error during image regeneration:", error);
        throw new Error("Failed to regenerate image from AI service.");
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
        console.error("Error during lifestyle content regeneration:", error);
        throw new Error("Failed to regenerate content from AI service.");
    }
};
