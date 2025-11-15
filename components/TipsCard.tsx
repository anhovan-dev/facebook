
import React, { useState } from 'react';
import { LightBulbIcon, ChevronDownIcon } from './icons';

interface Tip {
    title: string;
    description: string;
}

const customerInsightsTips: Tip[] = [
    {
        title: '01. Trò chuyện trực tiếp với khách hàng',
        description: 'Đừng chỉ bán, hãy trao đổi. Phỏng vấn sâu 1-1 hoặc tạo khảo sát ngắn gọn để tìm hiểu vấn đề, khó khăn và mong muốn của họ. Điều này mang lại insight quý giá hơn nhiều so với phỏng đoán.'
    },
    {
        title: '02. Lắng nghe từ đội ngũ tiếp xúc khách hàng',
        description: 'Nhân viên sales và chăm sóc khách hàng là một mỏ vàng insight. Tổ chức trò chuyện định kỳ với họ để khám phá những rào cản, mối bận tâm và ngôn ngữ chính xác mà khách hàng sử dụng.'
    },
    {
        title: '03. Social Listening trên Mạng xã hội',
        description: 'Khách hàng bộc lộ suy nghĩ thật một cách tự nhiên nhất trên mạng xã hội. Tham gia các hội nhóm, đọc bình luận của đối thủ để tìm kiếm từ khóa và xem họ đang nói gì về vấn đề của họ.'
    },
    {
        title: '04. Đào sâu vào dữ liệu tổng hợp',
        description: 'Dữ liệu cho thấy bức tranh chân thực về hành vi. Phân tích từ khóa tìm kiếm trên website, các trang được truy cập nhiều nhất và dữ liệu bán hàng để hiểu rõ nhu cầu thực sự của khách hàng.'
    },
    {
        title: '05. Học hỏi và cải tiến từ đối thủ',
        description: 'Phân tích đối thủ không phải để sao chép, mà là để tìm ra khoảng trống thị trường. Đọc kỹ đánh giá, xem quảng cáo tương tác cao và phân tích các câu hỏi khách hàng đặt cho họ.'
    },
    {
        title: '06. Tự mình trải nghiệm hành trình khách hàng',
        description: 'Đây là cách để có sự đồng cảm sâu sắc nhất. Hãy thử tìm kiếm thông tin, vào website và thực hiện quy trình mua hàng như một khách hàng mới để nhận ra những khó khăn và điểm cần cải thiện.'
    }
];

const TipItem: React.FC<Tip> = ({ title, description }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-left"
            >
                <span className="font-semibold text-sm text-[var(--color-text-header)]">{title}</span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <p className="mt-2 text-sm text-gray-300">
                    {description}
                </p>
            )}
        </div>
    );
};

export const TipsCard = (): React.JSX.Element => {
    return (
        <div className="bg-[var(--color-surface-1)] backdrop-blur-sm rounded-xl p-5 border border-[var(--color-border)]">
            <div className="flex items-center">
                <LightBulbIcon className="w-6 h-6 text-[var(--color-icon-warning)]" />
                <h3 className="ml-3 text-lg font-semibold text-[var(--color-text-header)]">6 Cách Thấu Hiểu Khách Hàng</h3>
            </div>
            <p className="mt-2 text-sm text-gray-400">Những phương pháp thực tế để đào sâu vào insight và tạo ra nội dung quảng cáo hiệu quả hơn.</p>
            <div className="mt-4 space-y-3">
                {customerInsightsTips.map(tip => <TipItem key={tip.title} title={tip.title} description={tip.description} />)}
            </div>
        </div>
    );
};
