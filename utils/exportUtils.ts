import type { PolicyAnalysisResult } from '../types';

// Helper function to escape special characters for HTML
const escapeHtml = (unsafe: string): string => {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// --- PDF EXPORT (via Print Dialog) ---
const generatePdfHtml = (result: PolicyAnalysisResult): string => {
    const { status, summary, violations, suggestions, fixedContent, imageAnalysis } = result;

    const getStatusInfo = () => {
        switch (status) {
            case 'compliant': return { text: 'Tuân thủ', color: '#22c55e' };
            case 'non_compliant': return { text: 'Vi phạm', color: '#ef4444' };
            case 'warning': return { text: 'Cảnh báo', color: '#f59e0b' };
            default: return { text: 'Không xác định', color: '#6b7280' };
        }
    };
    const statusInfo = getStatusInfo();

    let violationsHtml = '<tr><td colspan="3">Không tìm thấy vi phạm.</td></tr>';
    if (violations.length > 0) {
        violationsHtml = violations.map(v => `
            <tr>
                <td>${escapeHtml(v.rule)}</td>
                <td>${escapeHtml(v.explanation)}</td>
                <td>${escapeHtml(v.severity)}</td>
            </tr>
        `).join('');
    }
    
    let suggestionsHtml = '<li>Không có gợi ý nào.</li>';
    if (suggestions.length > 0) {
        suggestionsHtml = suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    }

    let imageAnalysisHtml = '';
    if (imageAnalysis) {
        imageAnalysisHtml = `
            <h2>Phân tích Hình ảnh</h2>
            ${imageAnalysis.policyViolations.length > 0 ? `
                <h3>Vi phạm chính sách hình ảnh</h3>
                <ul>${imageAnalysis.policyViolations.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>
            ` : ''}
            ${imageAnalysis.layoutFeedback.length > 0 ? `
                <h3>Góp ý Bố cục & Thiết kế</h3>
                <ul>${imageAnalysis.layoutFeedback.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
            ` : ''}
            ${imageAnalysis.brandingFeedback.length > 0 ? `
                <h3>Góp ý Nhận diện Thương hiệu</h3>
                <ul>${imageAnalysis.brandingFeedback.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
            ` : ''}
        `;
    }

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Báo cáo Phân tích Chính sách Quảng cáo</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
            h1, h2, h3 { color: #111; }
            h1 { font-size: 24px; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
            h3 { font-size: 16px; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ddd; }
            ul { padding-left: 20px; }
            .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 5px solid ${statusInfo.color}; }
            .summary-status { font-weight: bold; color: ${statusInfo.color}; }
        </style>
    </head>
    <body>
        <h1>Báo cáo Phân tích Chính sách Quảng cáo</h1>
        
        <h2>Tổng quan</h2>
        <div class="summary">
            <p><strong>Trạng thái:</strong> <span class="summary-status">${statusInfo.text}</span></p>
            <p><strong>Tóm tắt:</strong> ${escapeHtml(summary)}</p>
        </div>

        <h2>Chi tiết Vi phạm (Nội dung)</h2>
        <table>
            <thead>
                <tr>
                    <th>Quy tắc Vi phạm</th>
                    <th>Giải thích</th>
                    <th>Mức độ</th>
                </tr>
            </thead>
            <tbody>
                ${violationsHtml}
            </tbody>
        </table>

        ${imageAnalysisHtml}

        <h2>Gợi ý Chỉnh sửa Chung</h2>
        <ul>
            ${suggestionsHtml}
        </ul>

        <h2>Nội dung Văn bản Đã sửa</h2>
        <pre>${escapeHtml(fixedContent)}</pre>
    </body>
    </html>
    `;
};


export const exportToPdf = (result: PolicyAnalysisResult): void => {
    const htmlContent = generatePdfHtml(result);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.srcdoc = htmlContent;
    iframe.onload = () => {
        setTimeout(() => { // Timeout ensures content is rendered before print
            try {
                iframe.contentWindow?.print();
            } catch (e) {
                console.error("Failed to print:", e);
                alert("Không thể mở hộp thoại in. Vui lòng thử lại hoặc kiểm tra cài đặt trình duyệt của bạn.");
            } finally {
                 document.body.removeChild(iframe);
            }
        }, 500);
    };
};


// --- CSV EXPORT ---
const escapeCsvField = (field: string | undefined): string => {
    if (field === undefined || field === null) {
        return '';
    }
    const str = String(field);
    // If the field contains a comma, a quote, or a newline, enclose it in double quotes.
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Also, any double quotes within the field must be escaped by doubling them.
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};


export const exportToCsv = (result: PolicyAnalysisResult): void => {
    const { violations, suggestions, imageAnalysis } = result;
    
    const rows: string[][] = [];
    const headers = ['Category', 'Severity', 'Rule / Detail', 'Explanation'];
    
    // Add content violations
    violations.forEach(v => {
        rows.push([
            'Content Violation',
            v.severity,
            v.rule,
            v.explanation
        ]);
    });

    // Add suggestions
    suggestions.forEach(s => {
        rows.push([
            'General Suggestion',
            'N/A',
            s,
            ''
        ]);
    });

    // Add image analysis details
    if (imageAnalysis) {
        imageAnalysis.policyViolations.forEach(v => {
            rows.push([
                'Image Policy Violation',
                'N/A',
                v,
                ''
            ]);
        });
        imageAnalysis.layoutFeedback.forEach(f => {
            rows.push([
                'Image Layout Feedback',
                'N/A',
                f,
                ''
            ]);
        });
        imageAnalysis.brandingFeedback.forEach(b => {
            rows.push([
                'Image Branding Feedback',
                'N/A',
                b,
                ''
            ]);
        });
    }

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(escapeCsvField).join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ad_policy_analysis.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};