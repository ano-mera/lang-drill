// コピー成功ポップアップコンポーネント

interface CopySuccessPopupProps {
  message: string;
  isVisible: boolean;
}

export default function CopySuccessPopup({ message, isVisible }: CopySuccessPopupProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 p-3 bg-green-100 text-green-800 rounded-lg shadow-lg border border-green-200"
      style={{
        right: "20px",
        bottom: "20px",
        maxWidth: "300px",
      }}
    >
      {message}
    </div>
  );
}